'use strict';

const EventEmitter = require('node:events');
const Gateway = require('../Gateway/Gateway');
const RestWrapper = require('../REST/RestWrapper');
const Options = require('../util/Options');

class Client extends EventEmitter {
  constructor(token, phone = false) {
    super();

    this.options = Options.createDefault();

    /**
     * The token for the client
     * @type {string}
     */
    this.token = token;

    this.rest = new RestWrapper(this);
    this.ws = new Gateway(this, phone);
  }
}

module.exports = Client;
