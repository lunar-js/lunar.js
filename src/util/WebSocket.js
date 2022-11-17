'use strict';

const td = new TextDecoder();

exports.unpack = data => {
  if (typeof data !== 'string') data = td.decode(data);
  return JSON.parse(data);
};
