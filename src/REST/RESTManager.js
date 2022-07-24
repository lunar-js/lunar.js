'use strict';

const { setInterval } = require('node:timers');
const { Collection } = require('@discordjs/collection');
const APIRequest = require('./APIRequest');
const routeBuilder = require('./APIRouter');
const RequestHandler = require('./RequestHandler');
const { Endpoints } = require('../util/Constants');

class RESTManager {
  constructor(client) {
    this.client = client;
    this.handlers = new Collection();
    this.versioned = true;
    this.globalLimit = client.options.restGlobalRateLimit > 0 ? client.options.restGlobalRateLimit : Infinity;
    this.globalRemaining = this.globalLimit;
    this.globalReset = null;
    this.globalDelay = null;
  }

  get api() {
    return routeBuilder(this);
  }

  getAuth() {
    if (this.client.token) return this.client.token;

    throw new Error('Invalid / No token provided');
  }

  get cdn() {
    return Endpoints.CDN(this.client.options.http.cdn);
  }

  async request(method, url, options = {}) {
    const apiRequest = new APIRequest(this, method, url, options);
    var handler = this.handlers.get(apiRequest.route);

    if (!handler) {
      handler = new RequestHandler(this);
      this.handlers.set(apiRequest.route, handler);
    }

    return await handler.push(apiRequest);
  }

  get endpoint() {
    return this.client.options.http.api;
  }

  set endpoint(endpoint) {
    this.client.options.http.api = endpoint;
  }
}

module.exports = RESTManager;
