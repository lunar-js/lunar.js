"use strict";

const WebSocket = require("ws");
const zlib = require("node:zlib");
const EventHandler = require("./events");
const { Opcodes, Events, WSEvents } = require("../util/Constants");
const ab = new TextDecoder();

class GatewayServer {
  constructor(client, super_properties) {
    super();

    this.client = client;
    this.token = this.client.token;
    this.properties = super_properties;
    this.ws = null;

    this.auth = {
      capabilities: 509,
      client_state: {
        guild_hashes: {},
        hightes_last_message_id: "0",
        read_state_version: 0,
        user_guild_settings_version: -1,
        user_settings_version: -1,
      },
      compress: false,
      presence: { status: "online", since: 0, activities: [], afk: false },
      properties: this.properties,
      token: this.token,
    };

    this.interval = null;
    this.session_id = null;
    this.sequence = -1;

    this.lastPingTimestamp = null;
    this.ping = null;

    this.heartbeatInterval = null;

    this.connected = false;
    this.resumable = false;
    this.ready = false;

    Object.defineProperty(this, "inflate", { value: null, writable: true });

    this.ws.on("message", (d) => this.on_message(d));
  }

  on_message({ data }) {
    let raw;
    if (data instanceof ArrayBuffer) data = new Uint8Array(data);
    raw = data;

    let packet;
    try {
      packet = this.unpack(raw);
    } catch (e) {
      this.client.emit(Events.ERROR, e);
      return;
    }

    this.client.emit(Events.RAW, packet);
    this.on_packet(packet);
  }

  on_packet(packet) {
    if (!packet) {
      this.client.emit(Events.DEBUG, `Recieved broken packet: ${packet}`);
      return;
    }

    switch (packet.t) {
      case WSEvents.READY:
        this.session_id = packet.d.session_id;
        break;
    }

    if (packet.s > this.sequence) this.sequence = packet.s;

    switch (packet.op) {
      case Opcodes.HELLO:
        this.setHeartbeatTimer(packet.d.heartbeat_interval);
        this.identify();
        break;
      case Opcodes.INVALID_SESSION:
        if (packet.d) {
          this.identifyResume();
          return;
        }

        this.sequence = -1;
        this.session_id = null;
        break;
      case Opcodes.HEARTBEAT_ACK:
        this.ackHeartbeat();
        break;
      case Opcodes.HEARTBEAT:
        this.sendHeartbeat();
        break;
      default:
        EventHandler[packet.t](this.client, packet);
    }
  }

  identify() {
    return this.session_id ? this.identifyResume() : this.identifyNew();
  }

  identifyNew() {
    if (!this.client.token) {
      this.client.emit(
        Events.DEBUG,
        `[IDENTIFY] No token available to identify`
      );
      return;
    }

    this._send({ op: Opcodes.IDENTIFY, d: this.auth });
    this.ready = true;
  }

  identifyResume() {
    if (!this.session_id) {
      this.client.emit(
        Events.DEBUG,
        `[RESUME] No session id was present, starting new session`
      );
      this.identifyNew();
      return;
    }

    const d = {
      token: this.client.token,
      session_id: this.session_id,
      seq: 0,
    };

    this._send({ op: Opcodes.RESUME, d });
  }

  setHeartbeatTimer(time) {
    if (time === -1) {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      return;
    }

    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(
      () => this.sendHeartbeat(),
      time
    ).unref();
  }

  sendHeartbeat() {
    this.lastPingTimestamp = Date.now();
    this._send({ op: Opcodes.HEARTBEAT, d: this.sequence });
  }

  ackHeartbeat() {
    const lat = Date.now() - this.lastPingTimestamp;
    this.ping = lat;
  }

  _send(data) {
    this.ws.send(JSON.stringify(data));
  }

  unpack(data) {
    if (typeof data !== "string") {
      data = ab.decode(data);
    }
    return JSON.parse(data);
  }
}
