'use strict';

exports.WebSocket = require('ws');
const td = new TextDecoder();

exports.unpack = data => {
  if (typeof data !== 'string') data = td.decode(data);
  return JSON.parse(data);
};

exports.create = (gateway, query = {}, ...args) => {
  const [g, q] = gateway.split('?');
  query.encoding = exports.encoding;
  query = new URLSearchParams(query);
  if (q) new URLSearchParams(q).forEach((v, k) => query.set(k, v));
  const ws = new exports.WebSocket(`${g}?${query}`, ...args);
  return ws;
};

for (const state of ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED']) exports[state] = exports.WebSocket[state];
