'use strict';

module.exports = (client, { d: data }, shard) => {
  client.sessionId = data.session_id;

  shard.checkReady();
};
