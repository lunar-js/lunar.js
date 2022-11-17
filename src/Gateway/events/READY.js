'use strict';

const ClientUser = require('../../structures/ClientUser');

module.exports = (client, { d: data }) => {
  client.user = new ClientUser(client, data);
  client.emit('debug', `Ready event data: ${data}`);
  client.emit('ready', client);
};
