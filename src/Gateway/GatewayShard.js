'use strict';

const EventEmitter = require('node:events');
const { setTimeout, setInterval, clearTimeout } = require('node:timers');
const WebSocket = require('../WebSocket');
const { Status, Events, ShardEvents, Opcodes, WSEvents, WSCodes } = require('../util/Constants');
const Intents = require('../util/Intents');

const STATUS_KEYS = Object.keys(Status);
const CONNECTION_STATE = Object.keys(WebSocket.WebSocket);

class GatewayShard extends EventEmitter {
  constructor(manager, id) {
    super();

    this.manager = manager;
    this.id = id;

    this.status = Status.IDLE;
    this.sequence = -1;
    this.closeSequence = 0;
    /**
     * The session id for the shard
     * @type {?string}
     */
    this.shardId = null;
    /**
     * Previous heartbeat ping
     * @type {number}
     */
    this.ping = -1;

    /**
     * The last time a ping was sent (a timestamp)
     * @type {number}
     */
    this.lastPingTimestamp = -1;

    /**
     * If we received a heartbeat ack back. Used to identify zombie connections
     * @type {boolean}
     */
    this.lastHeartbeatAcked = true;

    /**
     * Used to prevent calling {@link GatewayShard#event:close} twice while closing or terminating the WebSocket.
     * @type {boolean}
     */
    this.closeEmitted = false;

    /**
     * Contains the rate limit queue and metadata
     * @type {Object}
     */
    this.ratelimit = {
      queue: [],
      total: 120,
      remaining: 120,
      time: 60e3,
      timer: null,
    };

    /**
     * The Websocket Connection
     * @type {?WebSocket}
     */
    this.connection = null;

    /**
     * The HELLO timeout
     * @type {?NodeJS.Timeout}
     */
    this.helloTimeout = null;

    /**
     * The WebSocket timeout
     * @type {?NodeJS.Timeout}
     */
    this.wsCloseTimeout = null;

    /**
     * If the manager attacked its events to the shard
     * @type {boolean}
     */
    this.eventsAttached = false;

    /**
     * A set of guild ids the shard expects to recive
     * @type {?Set<string>}
     */
    this.expectedGuilds = null;

    /**
     * The ready timeout
     * @type {?NodeJS.Timeout}
     */
    this.readyTimeout = null;

    /**
     * Time when the WebSocket connection was opened
     * @type {number}
     */
    this.connectedAt = 0;
  }

  /**
   * Emits a debug message
   * @param {string} message The debug message
   */
  debug(message) {
    this.manager.debug(message, this);
  }

  /**
   * Connects the shard to the gateway
   * @returns {Promise<void>} A promise that will resolve if the shard connects successfully, or rejects if it could connect
   */
  connect() {
    const { gateway, client } = this.manager;

    if (this.connection?.readyState === WebSocket.OPEN && this.status === Status.READY) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        this.removeListener(ShardEvents.CLOSE, onClose);
        this.removeListener(ShardEvents.READY, onReady);
        this.removeListener(ShardEvents.RESUMED, onResumed);
        this.removeListener(ShardEvents.INVALID_SESSION, onInvalidOrDestroyed);
        this.removeListener(ShardEvents.DESTROYED, onInvalidOrDestroyed);
      };

      const onReady = () => {
        cleanup();
        resolve();
      };

      const onResumed = () => {
        cleanup();
        resolve();
      };

      const onClose = event => {
        cleanup();
        reject(event);
      };

      const onInvalidOrDestroyed = () => {
        cleanup();
        // eslint-disable-next-line prefer-promise-reject-errors
        reject();
      };

      this.once(ShardEvents.READY, onReady);
      this.once(ShardEvents.RESUMED, onResumed);
      this.once(ShardEvents.CLOSE, onClose);
      this.once(ShardEvents.INVALID_SESSION, onInvalidOrDestroyed);
      this.once(ShardEvents.DESTROYED, onInvalidOrDestroyed);

      if (this.connection?.readyState === WebSocket.OPEN) {
        this.debug('An open connection was found, attempting to identify');
        this.identify();
        return;
      }

      if (this.connection) {
        this.debug(`A connection object was found. Cleaning up before continuing.
    State: ${CONNECTION_STATE[this.connection.readyState]}`);
        this.destroy({ emit: false });
      }

      const wsQuery = { v: client.options.ws.version };

      this.debug(
        `[CONNECT]
    Gateway    : ${gateway}
    Version    : ${client.options.ws.version}
    Encoding   : ${WebSocket.encoding}
    Compression: none`,
      );

      this.status = this.status === Status.DISCONNECTED ? Status.RECONNECTING : Status.CONNECTING;
      this.setHelloTimeout();
      this.setWsCloseTimeout(-1);
      this.connectedAt = Date.now();

      // Adding a handshake timeout to just make sure no zombie connection appears.
      const ws = (this.connection = WebSocket.create(gateway, wsQuery, { handshakeTimeout: 30_000 }));
      ws.onopen = this.onOpen.bind(this);
      ws.onmessage = this.onMessage.bind(this);
      ws.onerror = this.onError.bind(this);
      ws.onclose = this.onClose.bind(this);
    });
  }

  /**
   * Called whenever a connection to the gateway is opened
   */
  onOpen() {
    this.debug(`[CONNECTED] Took ${Date.now() - this.connectedAt}ms`);
    this.status = Status.NEARLY;
  }

  /**
   * Called whenever a message is recived
   * @param {MessageEvent} event Event recived
   */
  omMessage({ data }) {
    if (data instanceof ArrayBuffer) data = new Uint8Array(data);
    let raw = data;
    let packet;

    try {
      packet = WebSocket.unpack(raw);
    } catch (err) {
      this.manager.client.emit(Events.SHARD_ERROR, err, this.id);
      return;
    }

    this.manager.client.emit(Events.RAW, packet, this.id);
    if (packet.op === Opcodes.DISPATCH) this.manager.emit(packet.t, packet.d, this.id);
    this.onPacket(packet);
  }

  /**
   * Called whenever an error occurs with the WebSocket.
   * @param {ErrorEvent} event The error that occurred
   */
  onError(event) {
    const error = event?.error ?? event;
    if (!error) return;
    this.manager.client.emit(Events.SHARD_ERROR, error, this.id);
  }

  /**
   * Called whenever a connection to the gateway is closed.
   * @param {CloseEvent} event Close event that was received
   */
  onClose(event) {
    this.closeEmitted = true;
    if (this.sequence !== -1) this.closeSequence = this.sequence;
    this.sequence = -1;
    this.setHeartbeatTimer(-1);
    this.setHelloTimeout(-1);
    // Clearing the WebSocket close timeout as close was emitted.
    this.setWsCloseTimeout(-1);
    // If we still have a connection object, clean up its listeners
    if (this.connection) {
      this._cleanupConnection();
      // Having this after _cleanupConnection to just clean up the connection and not listen to ws.onclose
      this.destroy({ reset: !this.sessionId, emit: false, log: false });
    }
    this.status = Status.DISCONNECTED;
    this.emitClose(event);
  }

  /**
   * This method is responsible to emit close event for this shard.
   * This method helps the shard reconnect.
   * @param {CloseEvent} [event] Close event that was received
   */
  emitClose(
    event = {
      code: 1011,
      reason: WSCodes[1011],
      wasClean: false,
    },
  ) {
    this.debug(`[CLOSE]
    Event Code: ${event.code}
    Clean     : ${event.wasClean}
    Reason    : ${event.reason ?? 'No reason received'}`);
    /**
     * Emitted when a shard's WebSocket closes.
     * @private
     * @event WebSocketShard#close
     * @param {CloseEvent} event The received event
     */
    this.emit(ShardEvents.CLOSE, event);
  }

  /**
   * Called whenever a packet is received.
   * @param {Object} packet The received packet
   */
  onPacket(packet) {
    if (!packet) {
      this.debug(`Received broken packet: '${packet}'.`);
      return;
    }

    switch (packet.t) {
      case WSEvents.READY:
        this.emit(ShardEvents.READY);

        this.sessionId = packet.d.session_id;
        this.expectedGuilds = new Set(packet.d.guilds.map(d => d.id));
        this.status = Status.WAITING_FOR_GUILDS;
        this.debug(`[READY] Session ${this.sessionId}.`);
        this.lastHeartbeatAcked = true;
        this.sendHeartbeat('ReadyHeartbeat');
        break;
      case WSEvents.RESUMED: {
        this.emit(ShardEvents.RESUMED);

        this.status = Status.READY;
        const replayed = packet.s - this.closeSequence;
        this.debug(`[RESUMED] Session ${this.sessionId} | Replayed ${replayed} events.`);
        this.lastHeartbeatAcked = true;
        this.sendHeartbeat('ResumeHeartbeat');
        break;
      }
    }

    if (packet.s > this.sequence) this.sequence = packet.s;

    switch (packet.op) {
      case Opcodes.HELLO:
        this.setHelloTimeout(-1);
        this.setHeartbeatTimer(packet.d.heartbeat_interval);
        this.identify();
        break;
      case Opcodes.RECONNECT:
        this.debug('[RECONNECT] Discord asked us to reconnect');
        this.destroy({ closeCode: 4_000 });
        break;
      case Opcodes.INVALID_SESSION:
        this.debug(`[INVALID SESSION] Resumable: ${packet.d}.`);
        if (packet.d) {
          this.identifyResume();
          return;
        }
        this.sequence = -1;
        this.sessionId = null;
        this.status = Status.RECONNECTING;
        this.emit(ShardEvents.INVALID_SESSION);
        break;
      case Opcodes.HEARTBEAT_ACK:
        this.ackHeartbeat();
        break;
      case Opcodes.HEARTBEAT:
        this.sendHeartbeat('HeartbeatRequest', true);
        break;
      default:
        this.manager.handlePacket(packet, this);
        if (this.status === Status.WAITING_FOR_GUILDS && packet.t === WSEvents.GUILD_CREATE) {
          this.expectedGuilds.delete(packet.d.id);
          this.checkReady();
        }
    }
  }

  /**
   * Checks if the shard can be marked as ready
   */
  checkReady() {
    if (this.readyTimeout) {
      clearTimeout(this.readyTimeout);
      this.readyTimeout = null;
    }
    if (!this.expectedGuilds.size) {
      this.debug('Shard received all its guilds. Marking as fully ready.');
      this.status = Status.READY;
      this.emit(ShardEvents.ALL_READY);
      return;
    }
    const hasGuildsIntent = new Intents(this.manager.client.options.intents).has(Intents.FLAGS.GUILDS);

    const { waitGuildTimeout } = this.manager.client.options;

    this.readyTimeout = setTimeout(
      () => {
        this.debug(
          `Shard ${hasGuildsIntent ? 'did' : 'will'} not receive any more guild packets` +
            `${hasGuildsIntent ? ` in ${waitGuildTimeout} ms` : ''}.\nUnavailable guild count: ${
              this.expectedGuilds.size
            }`,
        );

        this.readyTimeout = null;

        this.status = Status.READY;

        this.emit(ShardEvents.ALL_READY, this.expectedGuilds);
      },
      hasGuildsIntent && this.manager.client.user.bot ? waitGuildTimeout : 0,
    ).unref();
  }

  /**
   * Sets the HELLO packet timeout.
   * @param {number} [time] If set to -1, it will clear the hello timeout
   */
  setHelloTimeout(time) {
    if (time === -1) {
      if (this.helloTimeout) {
        this.debug('Clearing the HELLO timeout.');
        clearTimeout(this.helloTimeout);
        this.helloTimeout = null;
      }
      return;
    }
    this.debug('Setting a HELLO timeout for 20s.');
    this.helloTimeout = setTimeout(() => {
      this.debug('Did not receive HELLO in time. Destroying and connecting again.');
      this.destroy({ reset: true, closeCode: 4009 });
    }, 20_000).unref();
  }

  /**
   * Sets the WebSocket Close timeout.
   * This method is responsible for detecting any zombie connections if the WebSocket fails to close properly.
   * @param {number} [time] If set to -1, it will clear the timeout
   */
  setWsCloseTimeout(time) {
    if (this.wsCloseTimeout) {
      this.debug('[WebSocket] Clearing the close timeout.');
      clearTimeout(this.wsCloseTimeout);
    }
    if (time === -1) {
      this.wsCloseTimeout = null;
      return;
    }
    this.wsCloseTimeout = setTimeout(() => {
      this.setWsCloseTimeout(-1);
      this.debug(`[WebSocket] Close Emitted: ${this.closeEmitted}`);
      if (this.closeEmitted) {
        this.debug(
          `[WebSocket] was closed. | WS State: ${
            CONNECTION_STATE[this.connection?.readyState ?? WebSocket.CLOSED]
          } | Close Emitted: ${this.closeEmitted}`,
        );
        this.closeEmitted = false;
        return;
      }

      this.debug(
        // eslint-disable-next-line max-len
        `[WebSocket] did not close properly, assuming a zombie connection.\nEmitting close and reconnecting again.`,
      );

      this.emitClose();
      this.closeEmitted = false;
    }, time).unref();
  }

  /**
   * Sets the heartbeat timer for this shard.
   * @param {number} time If -1, clears the interval, any other number sets an interval
   */
  setHeartbeatTimer(time) {
    if (time === -1) {
      if (this.heartbeatInterval) {
        this.debug('Clearing the heartbeat interval.');
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      return;
    }
    this.debug(`Setting a heartbeat interval for ${time}ms.`);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), time).unref();
  }

  /**
   * Sends a heartbeat to the WebSocket.
   * If this shard didn't receive a heartbeat last time, it will destroy it and reconnect
   * @param {string} [tag='HeartbeatTimer'] What caused this heartbeat to be sent
   * @param {boolean} [ignoreHeartbeatAck] If we should send the heartbeat forcefully.
   */
  sendHeartbeat(
    tag = 'HeartbeatTimer',
    ignoreHeartbeatAck = [Status.WAITING_FOR_GUILDS, Status.IDENTIFYING, Status.RESUMING].includes(this.status),
  ) {
    if (ignoreHeartbeatAck && !this.lastHeartbeatAcked) {
      this.debug(`[${tag}] Didn't process heartbeat ack yet but we are still connected. Sending one now.`);
    } else if (!this.lastHeartbeatAcked) {
      this.debug(
        `[${tag}] Didn't receive a heartbeat ack last time, assuming zombie connection. Destroying and reconnecting.
    Status          : ${STATUS_KEYS[this.status]}
    Sequence        : ${this.sequence}
    Connection State: ${this.connection ? CONNECTION_STATE[this.connection.readyState] : 'No Connection??'}`,
      );

      this.destroy({ reset: true, closeCode: 4009 });
      return;
    }

    this.debug(`[${tag}] Sending a heartbeat.`);
    this.lastHeartbeatAcked = false;
    this.lastPingTimestamp = Date.now();
    this.send({ op: Opcodes.HEARTBEAT, d: this.sequence }, true);
  }

  /**
   * Acknowledges a heartbeat.
   */
  ackHeartbeat() {
    this.lastHeartbeatAcked = true;
    const latency = Date.now() - this.lastPingTimestamp;
    this.debug(`Heartbeat acknowledged, latency of ${latency}ms.`);
    this.ping = latency;
  }

  /**
   * Identifies the client on the connection.
   * @private
   * @returns {void}
   */
  identify() {
    return this.sessionId ? this.identifyResume() : this.identifyNew();
  }

  /**
   * Identifies as a new connection on the gateway.
   */
  identifyNew() {
    const { client } = this.manager;
    if (!client.token) {
      this.debug('[IDENTIFY] No token available to identify a new session.');
      return;
    }

    this.status = Status.IDENTIFYING;

    client.options.ws.properties = Object.assign(client.options.ws.properties, {
      $browser_user_agent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
      $browser_version: '103.0.0.0',
    });
    const d = {
      ...client.options.ws,
      token: client.token,
    };

    delete d.large_threshold;

    this.debug(
      `[IDENTIFY] Shard ${this.id}/${client.options.shardCount} with intents: ${Intents.resolve(
        client.options.intents,
      )} :)`,
    );
    this.send({ op: Opcodes.IDENTIFY, d }, true);
  }

  /**
   * Resumes a session on the gateway.
   */
  identifyResume() {
    if (!this.sessionId) {
      this.debug('[RESUME] No session id was present; identifying as a new session.');
      this.identifyNew();
      return;
    }

    this.status = Status.RESUMING;

    this.debug(`[RESUME] Session ${this.sessionId}, sequence ${this.closeSequence}`);

    const d = {
      token: this.manager.client.token,
      session_id: this.sessionId,
      seq: this.closeSequence,
    };

    this.send({ op: Opcodes.RESUME, d }, true);
  }

  /**
   * Adds a packet to the queue to be sent to the gateway.
   * <warn>If you use this method, make sure you understand that you need to provide
   * a full [Payload](https://discord.com/developers/docs/topics/gateway#commands-and-events-gateway-commands).
   * Do not use this method if you don't know what you're doing.</warn>
   * @param {Object} data The full packet to send
   * @param {boolean} [important=false] If this packet should be added first in queue
   */
  send(data, important = false) {
    this.ratelimit.queue[important ? 'unshift' : 'push'](data);
    this.processQueue();
  }

  /**
   * Sends data, bypassing the queue.
   * @param {Object} data Packet to send
   * @returns {void}
   */
  _send(data) {
    if (this.connection?.readyState !== WebSocket.OPEN) {
      this.debug(`Tried to send packet '${JSON.stringify(data)}' but no WebSocket is available!`);
      this.destroy({ closeCode: 4_000 });
      return;
    }

    this.connection.send(WebSocket.pack(data), err => {
      if (err) this.manager.client.emit(Events.SHARD_ERROR, err, this.id);
    });
  }

  /**
   * Processes the current WebSocket queue.
   * @returns {void}
   */
  processQueue() {
    if (this.ratelimit.remaining === 0) return;
    if (this.ratelimit.queue.length === 0) return;
    if (this.ratelimit.remaining === this.ratelimit.total) {
      this.ratelimit.timer = setTimeout(() => {
        this.ratelimit.remaining = this.ratelimit.total;
        this.processQueue();
      }, this.ratelimit.time).unref();
    }
    while (this.ratelimit.remaining > 0) {
      const item = this.ratelimit.queue.shift();
      if (!item) return;
      this._send(item);
      this.ratelimit.remaining--;
    }
  }

  /**
   * Destroys this shard and closes its WebSocket connection.
   * @param {Object} [options={ closeCode: 1000, reset: false, emit: true, log: true }] Options for destroying the shard
   */
  destroy({ closeCode = 1_000, reset = false, emit = true, log = true } = {}) {
    if (log) {
      this.debug(`[DESTROY]
    Close Code    : ${closeCode}
    Reset         : ${reset}
    Emit DESTROYED: ${emit}`);
    }

    this.setHeartbeatTimer(-1);
    this.setHelloTimeout(-1);
    this.debug(
      `[WebSocket] Destroy: Attempting to close the WebSocket. | WS State: ${
        CONNECTION_STATE[this.connection?.readyState ?? WebSocket.CLOSED]
      }`,
    );
    if (this.connection) {
      if (this.connection.readyState === WebSocket.OPEN) {
        this.connection.close(closeCode);
        this.debug(`[WebSocket] Close: Tried closing. | WS State: ${CONNECTION_STATE[this.connection.readyState]}`);
      } else {
        this.debug(`WS State: ${CONNECTION_STATE[this.connection.readyState]}`);
        try {
          this.connection.close(closeCode);
        } catch (err) {
          this.debug(
            `[WebSocket] Close: Something went wrong while closing the WebSocket: ${
              err.message || err
            }. Forcefully terminating the connection | WS State: ${CONNECTION_STATE[this.connection.readyState]}`,
          );
          this.connection.terminate();
        }
        if (emit) this._emitDestroyed();
      }
    } else if (emit) {
      this._emitDestroyed();
    }

    if (this.connection?.readyState === WebSocket.CLOSING || this.connection?.readyState === WebSocket.CLOSED) {
      this.closeEmitted = false;
      this.debug(
        `[WebSocket] Adding a WebSocket close timeout to ensure a correct WS reconnect.
        Timeout: ${this.manager.client.options.closeTimeout}ms`,
      );
      this.setWsCloseTimeout(this.manager.client.options.closeTimeout);
    }

    this.connection = null;

    this.status = Status.DISCONNECTED;

    if (this.sequence !== -1) this.closeSequence = this.sequence;

    if (reset) {
      this.sequence = -1;
      this.sessionId = null;
    }

    this.ratelimit.remaining = this.ratelimit.total;
    this.ratelimit.queue.length = 0;
    if (this.ratelimit.timer) {
      clearTimeout(this.ratelimit.timer);
      this.ratelimit.timer = null;
    }
  }

  /**
   * Cleans up the WebSocket connection listeners.
   */
  _cleanupConnection() {
    this.connection.onopen = this.connection.onclose = this.connection.onmessage = null;
    this.connection.onerror = () => null;
  }

  /**
   * Emits the DESTROYED event on the shard
   */
  _emitDestroyed() {
    this.emit(ShardEvents.DESTROYED);
  }
}

module.exports = GatewayShard;
