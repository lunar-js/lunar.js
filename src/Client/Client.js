/* eslint-disable import/order */
'use strict';

// Managers
const RestWrapper = require('../REST/RestWrapper');
const Gateway = require('../Gateway/Gateway');

// Misc
const EventEmitter = require('node:events');
const Options = require('../util/Options');

/**
 * The main class for interacting with the discord api.
 * @extends {EventEmitter}
 */
class Client extends EventEmitter {
  /**
   * @param {string} token The client token
   * @param {boolean} phone Weather or not you want the status to be online via phone
   */
  constructor(token, phone = false) {
    super();

    this.options = Options.createDefault();

    /**
     * The token for the client
     * @type {string}
     */
    this.token = token;

    this.api = new RestWrapper(this);
    this.ws = new Gateway(this, phone);
  }
}

module.exports = Client;
