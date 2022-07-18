"use strict";

const { setTimeout } = require('node:timers');
const { setTimeout: sleep } = require('node:timers/promises');
const { AsyncQueue } = require('@sapphire/async-queue');
const { Events: { DEBUG, RATE_LIMIT, INVALID_REQUEST_WARNING, API_REQUEST, API_RESPONSE } } = require('../util/Constants');

function parseResponse(res) {
    if(res.headers.get('content-type').startsWith('application/json')) return res.json();
    return res.arrayBuffer();
}

function getAPIOffset(serverDate) {
    return new Date(serverDate).getTime() - Date.now();
}

function calculateReset(reset, resetAfter, serverDate) {
    if(resetAfter) return Date.now() + Number(resetAfter) * 1_000;
    return new Date(Number(reset) * 1_000).getTime() - getAPIOffset(serverDate);
}

let invalidCount = 0;
let invalidCountResetTime = null;

class RequestHandler {
    
}