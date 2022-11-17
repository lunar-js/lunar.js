'use strict';

const { setTimeout } = require('node:timers');
const axios = require('axios');
const FormData = require('form-data');

class RestWrapper {
  constructor(client) {
    this.client = client;
  }

  get auth() {
    return this.client.token;
  }

  /**
   * Make a request to the discord api
   * @param {"GET" | "POST" | "PATCH" | "PUT" | "DELETE"} method the method to use
   * @param {string} path the api path
   * @param {boolean} auth weather or not the request needs a token
   * @param {boolean} versioned weather or not the request needs the versioned api
   * @param {Object} options the options for the request
   */
  // eslint-disable-next-line require-await
  async makeRequest(method, path, auth = true, versioned = false, options = {}) {
    const API =
      versioned == true
        ? this.client.options.http.api
        : `${this.client.options.http.api}/v${this.client.options.http.version}`;
    const url = `${API}/${path}`;
    let headers = {
      ...this.client.options.http.headers,
    };
    var body;

    if (auth) headers.Authorization = this.auth;
    if (options.reason) headers['X-Audit-Log-Reason'] = encodeURIComponent(options.reason);
    if (options.files?.length) {
      body = new FormData();
      for (const [index, file] of options.files.entries()) {
        if (file?.file) body.append(file.key ?? `files[${index}]`, file.file, file.name);
      }
      if (typeof options.data !== 'undefined') {
        if (options.dontUsePayloadJSON) {
          for (const [key, value] of Object.entries(options.data)) body.append(key, value);
        } else {
          body.append('payload_json', JSON.stringify(options.data));
        }
      } else if (typeof options.body !== 'undefined') {
        if (options.dontUsePayloadJSON) {
          for (const [key, value] of Object.entries(options.body)) body.append(key, value);
        } else {
          body.append('payload_json', JSON.stringify(options.body));
        }
      }
      headers = Object.assign(headers, body.getHeaders());
    } else if (options.data !== null) {
      body = options.data ? JSON.stringify(options.data) : undefined;
      headers['Content-Type'] = 'application/json';
    } else if (options.body !== null) {
      body = new FormData();
      body.append('payload_json', JSON.stringify(options.body));
      headers = Object.assign(headers, body.getHeaders());
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.client.options.restRequestTimeout).unref();
    // eslint-disable-next-line prettier/prettier
    const res = await axios[method.toLowerCase()](url, { headers, data: body, signal: controller.signal }).finally(() =>
      clearTimeout(timeout),
    );

    return res.data;
  }
}

module.exports = RestWrapper;
