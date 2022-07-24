'use strict';

const EventEmitter = require('node:events');
const GatewayManager = require('../Gateway/GatewayManager');
const RESTManager = require('../REST/RESTManager');
const Options = require('../util/Options');

class Client extends EventEmitter {
  constructor() {
    super();

    this.options = Options.createDefault();
    this.rest = new RESTManager(this);
    this.ws = new GatewayManager(this);

    this.options.shards = Array.from({ length: this.options.shardCount }, (_, i) => i);

    /**
     * The token for the client
     * @type {string}
     */
    this.token = null;

    if ('DISCORD_TOKEN' in process.env) {
      this.token = process.env.DISCORD_TOKEN;
    } else {
      this.token = null;
    }
  }

  /**
   * API shortcut
   * @type {Object}
   * @readonly
   */
  get api() {
    return this.rest.api;
  }

  async login(token = this.token) {
    this.token = token = token.replace(/^(Bot|Bearer)\s*/i, '');

    try {
      await this.ws.connect();
      return this.token;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Client;
