'use strict';

module.exports = (client, { d: data }) => {
  client.emit('Debug', `Ready event data: ${data}`);
};
