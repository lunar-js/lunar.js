'use strict';

const { setInterval, setTimeout } = require('node:timers');
const WS = require('ws');
const handlers = require('./events');
const { address, WSEvents, Opcodes, Events } = require('../util/Constants');
const WebSocket = require('../util/WebSocket');

const CONNECTION_STATE = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];

class Gateway extends WS {
  constructor(client, phone) {
    super(address);
    this.phone = phone;

    this.client = client;
    this.options = client.options.ws;
    this.sequence = -1;
    this.sessionId = null;
    this.connectedAt = Date.now();
    this.closeSequence = 0;
    this.helloTimeout = null;

    // Heartbeat stuff
    this.ping = -1;
    this.lastPingTimestamp = -1;
    this.lastHeartbeatAcked = false;

    if (phone) {
      this.options.properties.os = '16.1';
      this.options.properties.device = 'iPhone14,5';
    }

    this.onopen = this.onOpen.bind(this);
    this.onmessage = this.onMessage.bind(this);
  }

  onOpen() {
    this.debug(`[CONNECTED] Took ${Date.now() - this.connectedAt}ms`);
  }

  onMessage({ data }) {
    if (data instanceof ArrayBuffer) data = new Uint8Array(data);
    let raw = data;
    let packet;
    try {
      packet = WebSocket.unpack(raw);
    } catch (e) {
      this.client.emit('GatewayError', e);
      return;
    }
    this.client.emit(Events.RAW, packet);
    this.onPacket(packet);
  }

  onPacket(packet) {
    if (!packet) {
      this.debug(`Received broken packet: ${packet}`);
      return;
    }

    switch (packet.t) {
      case WSEvents.READY:
        this.sessionId = packet.d.session_id;
        this.debug(`[READY] Session ${this.sessionId}`);
        this.lastHeartbeatAcked = true;
        this.sendHeartbeat('ReadyHeartbeat');
        break;
      case WSEvents.RESUMED: {
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
        this.debug(`[RECONNECT] Discord asked us to reconnect`);
        this.destroy({ closeCode: 4_000 });
        break;
      case Opcodes.INVALID_SESSION:
        this.debug(`[INVALID SESSION] Resumable: ${packet.d}`);
        if (packet.d) {
          this.identifyResume();
          return;
        }

        this.sequence = -1;
        this.sessionId = null;
        break;
      case Opcodes.HEARTBEAT:
        this.sendHeartbeat('HeartbeatRequest', true);
        break;
      case Opcodes.HEARTBEAT_ACK:
        this.ackHeartbeat();
        break;
      default:
        if (handlers[packet.t]) {
          handlers[packet.t](this.client, packet);
        } else {
          this.client.emit(Events.UNHANDLED_PACKET, packet);
        }
    }
  }

  /**
   * Send an op code to the discord gateway
   * @param {string} code The op code you want to send
   * @param {Object} data the data for the op code
   */
  sendOpcode(code, data) {
    this.send(
      JSON.stringify({
        op: code,
        d: data,
      }),
    );
  }

  /**
   * Identifies the client on the connection
   * @returns {void}
   */
  identify() {
    return this.sessionId ? this.identifyResume() : this.identifyNew();
  }

  /**
   * Identifies as a new connection on the gateway.
   */
  identifyNew() {
    if (!this.client.token) {
      this.debug(`[IDENTIFY] No token available to identify a new session`);
      return;
    }

    Object.keys(this.options.properties)
      .filter(k => k.startsWith('$'))
      .forEach(k => {
        this.options.properties[k.slice(1)] = this.options.properties[k];
        delete this.options.properties[k];
      });
    const d = {
      ...this.options,
      token: this.client.token,
    };

    this.sendOpcode(Opcodes.IDENTIFY, d);
  }

  identifyResume() {
    if (!this.sessionId) {
      this.debug('[RESUME] No session id was present; identifying as a new session.');
      this.identifyNew();
      return;
    }

    this.debug(`[RESUME] Session ${this.sessionId}, sequence ${this.closeSequence}`);

    const d = {
      token: this.client.token,
      session_id: this.sessionId,
      seq: this.closeSequence,
    };

    this.sendOpcode(Opcodes.RESUME, d);
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
    // Sanity checks
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), time).unref();
  }

  /**
   * Sends a heartbeat to the WebSocket.
   * If this shard didn't receive a heartbeat last time, it will destroy it and reconnect
   * @param {string} [tag='HeartbeatTimer'] What caused this heartbeat to be sent
   * @param {boolean} ignoreHeartbeatAck If we should send the heartbeat forcefully.
   */
  sendHeartbeat(tag = 'HeartbeatTimer', ignoreHeartbeatAck = false) {
    if (ignoreHeartbeatAck && !this.lastHeartbeatAcked) {
      this.debug(`[${tag}] Didn't process heartbeat ack yet but we are still connected. Sending one now.`);
    } else if (!this.lastHeartbeatAcked) {
      this.debug(
        `[${tag}] Didn't receive a heartbeat ack last time, assuming zombie connection. Destroying and reconnecting.
    Status          : ${this.status}
    Sequence        : ${this.sequence}
    Connection State: ${CONNECTION_STATE[this.connection.readyState]}`,
      );

      this.destroy({ reset: true, closeCode: 4009 });
      return;
    }

    this.debug(`[${tag}] Sending a heartbeat`);
    this.lastHeartbeatAcked = true;
    this.lastPingTimestamp = Date.now();
    this.sendOpcode(Opcodes.HEARTBEAT, this.sequence);
  }

  /**
   * Acknowledges a heartbeat.
   */
  ackHeartbeat() {
    this.lastHeartbeatAcked = true;
    const latency = Date.now() - this.lastPingTimestamp;
    this.debug(`Heartbeat acked, latency of ${latency}ms`);
    this.ping = latency;
  }

  debug(text) {
    this.client.emit(Events.DEBUG, text);
  }

  /**
   * Destroy the gateway connection
   * @param {Object} [options={ closeCode: 1000, reset: false }] Options for destroying the connection
   */
  destroy({ closeCode = 1_000, reset = false }) {
    this.debug(`[DESTROY]
  Close Code     : ${closeCode}
  Reset          : ${reset}`);

    this.setHeartbeatTimer(-1);
    this.setHelloTimeout(-1);

    if (this.readyState == this.OPEN) {
      this.close(closeCode);
    } else {
      try {
        this.close(closeCode);
      } catch (err) {
        this.debug(
          `[WebSocket] Close: Something went wrong while closing the WebSocket: ${
            err.message || err
          }. Forcefully terminating the connection | WS State: ${CONNECTION_STATE[this.connection.readyState]}`,
        );
        this.terminate();
      }
    }

    if (reset) this.client.ws = new Gateway(this.client, this.phone);
  }
}

module.exports = Gateway;
