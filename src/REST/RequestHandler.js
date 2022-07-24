'use strict';

const { setTimeout } = require('node:timers');
const { setTimeout: sleep } = require('node:timers/promises');
const { AsyncQueue } = require('@sapphire/async-queue');
const DiscordAPIError = require('./DiscordAPIError');
const HTTPError = require('./HTTPError');
const RateLimitError = require('./RateLimitError');

const {
  Events: { DEBUG, RATE_LIMIT, INVALID_REQUEST_WARNING, API_REQUEST, API_RESPONSE },
} = require('../util/Constants');

function parseResponse(res) {
  if (res.headers.get('content-type').startsWith('application/json')) return res.json();
  return res.arrayBuffer();
}

function getAPIOffset(serverDate) {
  return new Date(serverDate).getTime() - Date.now();
}

function calculateReset(reset, resetAfter, serverDate) {
  if (resetAfter) return Date.now() + Number(resetAfter) * 1_000;
  return new Date(Number(reset) * 1_000).getTime() - getAPIOffset(serverDate);
}

/* Invalid req limiting is done by discord on a per-IP basis not per token.
 * The best I could find to do is track invalid counts per process rather than per bot
 */
let invalidCount = 0;
let invalidCountResetTime = null;

class RequestHandler {
  constructor(manager) {
    this.manager = manager;
    this.queue = new AsyncQueue();
    this.reset = -1;
    this.remaining = -1;
    this.limit = -1;
  }

  async push(req) {
    await this.queue.wait();
    try {
      return await this.execute(req);
    } finally {
      this.queue.shift();
    }
  }

  get globalLimited() {
    return this.manager.globalRemaining <= 0 && Date.now() < this.manager.globalReset;
  }

  get localLimited() {
    return this.remaining <= 0 && Date.now() < this.reset;
  }

  get limited() {
    return this.globalLimited || this.localLimited;
  }

  get _inactive() {
    return this.queue.remaining === 0 && !this.limited;
  }

  globalDelayFor(ms) {
    return new Promise(resolve => {
      setTimeout(() => {
        this.manager.globalDelay = null;
        resolve();
      }, ms).unref();
    });
  }

  async onRateLimit(req, limit, timeout, isGlobal) {
    const { options } = this.manager.client;
    if (!options.rejectOnRateLimit) return;

    const rateLimitData = {
      timeout,
      limit,
      method: req.method,
      path: req.path,
      route: req.route,
      global: isGlobal,
    };
    const shouldThrow =
      typeof options.rejectOnRateLimit === 'function'
        ? await options.rejectOnRateLimit(rateLimitData)
        : options.rejectOnRateLimit.some(route => rateLimitData.route.startsWith(route.toLowerCase()));
    if (shouldThrow) {
      throw new RateLimitError(rateLimitData);
    }
  }

  async execute(req) {
    while (this.limited) {
      const isGlobal = this.globalLimited;
      let limit, timeout, delayPromise;

      if (isGlobal) {
        limit = this.manager.globalLimit;
        timeout = this.manager.globalReset + this.manager.client.options.resetTimeOffset - Date.now();
      } else {
        limit = this.limit;
        timeout = this.reset + this.manager.client.options.resetTimeOffset - Date.now();
      }

      if (this.manager.client.listenerCount(RATE_LIMIT)) {
        this.manager.client.emit(RATE_LIMIT, {
          timeout,
          limit,
          method: req.method,
          path: req.path,
          route: req.route,
          global: isGlobal,
        });
      }

      if (isGlobal) {
        if (!this.manager.globalDelay) {
          this.manager.globalDelay = this.globalDelayFor(timeout);
        }
        delayPromise = this.manager.globalDelay;
      } else {
        delayPromise = sleep(timeout);
      }

      await this.onRateLimit(req, limit, timeout, isGlobal); // eslint-disable-line no-await-in-loop
      await delayPromise; // eslint-disable-line no-await-in-loop
    }

    if (!this.manager.globalReset || this.manager.globalReset < Date.now()) {
      this.manager.globalReset = Date.now() + 1_000;
      this.manager.globalRemaining = this.manager.globalLimit;
    }
    this.manager.globalRemaining--;

    if (this.manager.client.listenerCount(API_REQUEST)) {
      this.manager.client.emit(API_REQUEST, {
        method: req.method,
        path: req.path,
        route: req.route,
        options: req.options,
        retries: req.retries,
      });
    }

    let res;
    try {
      res = await req.make();
    } catch (e) {
      if (req.retries === this.manager.client.options.retryLimit) {
        throw new HTTPError(e.message, e.constructor.name, e.status, req);
      }

      req.retries++;
      return this.execute(req);
    }

    if (this.manager.client.listenerCount(API_RESPONSE)) {
      this.manager.client.emit(
        API_RESPONSE,
        {
          method: req.method,
          path: req.path,
          route: req.route,
          options: req.options,
          retries: req.retries,
        },
        res.clone(),
      );
    }

    let sublimitTimeout;
    if (res.headers) {
      const serverDate = res.headers.get('date');
      const limit = res.headers.get('x-ratelimit-limit');
      const remaining = res.headers.get('x-ratelimit-remaining');
      const reset = res.headers.get('x-ratelimit-reset');
      const resetAfter = res.headers.get('x-ratelimit-reset-after');
      this.limit = limit ? Number(limit) : Infinity;
      this.remaining = remaining ? Number(remaining) : 1;

      this.reset = reset || resetAfter ? calculateReset(reset, resetAfter, serverDate) : Date.now();

      // https://github.com/discord/discord-api-docs/issues/182
      if (!resetAfter && req.route.includes('reactions')) {
        this.reset = new Date(serverDate).getTime() - getAPIOffset(serverDate) + 250;
      }

      // Handle retryAfter, which means we have actually hit a rate limit
      let retryAfter = res.headers.get('retry-after');
      retryAfter = retryAfter ? Number(retryAfter) * 1_000 : -1;
      if (retryAfter > 0) {
        // If the global rate limit header is set, that means we hit the global rate limit
        if (res.headers.get('x-ratelimit-global')) {
          this.manager.globalRemaining = 0;
          this.manager.globalReset = Date.now() + retryAfter;
        } else if (!this.localLimited) {
          /*
           * This is a sublimit (e.g. 2 channel name changes/10 minutes) since the headers don't indicate a
           * route-wide rate limit. Don't update remaining or reset to avoid rate limiting the whole
           * endpoint, just set a reset time on the req itself to avoid retrying too soon.
           */
          sublimitTimeout = retryAfter;
        }
      }
    }

    // Count the invalid reqs
    if (res.status === 401 || res.status === 403 || res.status === 429) {
      if (!invalidCountResetTime || invalidCountResetTime < Date.now()) {
        invalidCountResetTime = Date.now() + 1_000 * 60 * 10;
        invalidCount = 0;
      }
      invalidCount++;

      const emitInvalid =
        this.manager.client.listenerCount(INVALID_REQUEST_WARNING) &&
        this.manager.client.options.invalidreqWarningInterval > 0 &&
        invalidCount % this.manager.client.options.invalidreqWarningInterval === 0;
      if (emitInvalid) {
        /**
         * @typedef {Object} InvalidreqWarningData
         * @property {number} count Number of invalid reqs that have been made in the window
         * @property {number} remainingTime Time in milliseconds remaining before the count resets
         */

        /**
         * Emitted periodically when the process sends invalid reqs to let users avoid the
         * 10k invalid reqs in 10 minutes threshold that causes a ban
         * @event BaseClient#invalidreqWarning
         * @param {InvalidreqWarningData} invalidreqWarningData Object containing the invalid req info
         */
        this.manager.client.emit(INVALID_REQUEST_WARNING, {
          count: invalidCount,
          remainingTime: invalidCountResetTime - Date.now(),
        });
      }
    }

    // Handle 2xx and 3xx responses
    if (res.ok) {
      // Nothing wrong with the req, proceed with the next one
      return parseResponse(res);
    }

    // Handle 4xx responses
    if (res.status >= 400 && res.status < 500) {
      // Handle ratelimited reqs
      if (res.status === 429) {
        const isGlobal = this.globalLimited;
        let limit, timeout;
        if (isGlobal) {
          // Set the variables based on the global rate limit
          limit = this.manager.globalLimit;
          timeout = this.manager.globalReset + this.manager.client.options.restTimeOffset - Date.now();
        } else {
          // Set the variables based on the route-specific rate limit
          limit = this.limit;
          timeout = this.reset + this.manager.client.options.restTimeOffset - Date.now();
        }

        this.manager.client.emit(
          DEBUG,
          `Hit a 429 while executing a req.
    Global  : ${isGlobal}
    Method  : ${req.method}
    Path    : ${req.path}
    Route   : ${req.route}
    Limit   : ${limit}
    Timeout : ${timeout}ms
    Sublimit: ${sublimitTimeout ? `${sublimitTimeout}ms` : 'None'}`,
        );

        await this.onRateLimit(req, limit, timeout, isGlobal);

        // If caused by a sublimit, wait it out here so other reqs on the route can be handled
        if (sublimitTimeout) {
          await sleep(sublimitTimeout);
        }
        return this.execute(req);
      }

      // Handle possible malformed reqs
      let data;
      try {
        data = await parseResponse(res);
      } catch (err) {
        throw new HTTPError(err.message, err.constructor.name, err.status, req);
      }
      throw new DiscordAPIError(data, res.status, req);
    }

    // Handle 5xx responses
    if (res.status >= 500 && res.status < 600) {
      // Retry the specified number of times for possible serverside issues
      if (req.retries === this.manager.client.options.retryLimit) {
        throw new HTTPError(res.statusText, res.constructor.name, res.status, req);
      }

      req.retries++;
      return this.execute(req);
    }

    // Fallback in the rare case a status code outside the range 200..=599 is returned
    return null;
  }
}

module.exports = RequestHandler;

/**
 * @external HTTPMethod
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods}
 */

/**
 * @external Response
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Response}
 */
