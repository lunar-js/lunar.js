'use strict';

exports.address = 'wss://gateway.discord.gg/?encoding=json&v=9';

const listUserAgent = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:101.0) Gecko/20100101 Firefox/101.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 12.4; rv:101.0) Gecko/20100101 Firefox/101.0',
  'Mozilla/5.0 (X11; Linux i686; rv:101.0) Gecko/20100101 Firefox/101.0',
  'Mozilla/5.0 (Linux x86_64; rv:101.0) Gecko/20100101 Firefox/101.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:101.0) Gecko/20100101 Firefox/101.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:101.0) Gecko/20100101 Firefox/101.0',
  'Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:101.0) Gecko/20100101 Firefox/101.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 12.4; rv:91.0) Gecko/20100101 Firefox/91.0',
  'Mozilla/5.0 (X11; Linux i686; rv:91.0) Gecko/20100101 Firefox/91.0',
  'Mozilla/5.0 (Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:91.0) Gecko/20100101 Firefox/91.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0',
  'Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36 Edg/103.0.1264.37',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36 Edg/103.0.1264.37',
];
exports.randomUA = () => listUserAgent[Math.floor(Math.random() * listUserAgent.length)];

/**
 * The types of WebSocket error codes:
 * * 1000: WS_CLOSE_REQUESTED
 * * 1011: INTERNAL_ERROR
 * * 4004: TOKEN_INVALID
 * * 4010: SHARDING_INVALID
 * * 4011: SHARDING_REQUIRED
 * * 4013: INVALID_INTENTS
 * * 4014: DISALLOWED_INTENTS
 * @typedef {Object<number, string>} WSCodes
 */
exports.WSCodes = {
  1000: 'WS_CLOSE_REQUESTED',
  1011: 'INTERNAL_ERROR',
  4004: 'TOKEN_INVALID',
  4010: 'SHARDING_INVALID',
  4011: 'SHARDING_REQUIRED',
  4013: 'INVALID_INTENTS',
  4014: 'DISALLOWED_INTENTS',
};

/**
 * The current status of the client. Here are the available statuses:
 * * READY: 0
 * * CONNECTING: 1
 * * RECONNECTING: 2
 * * IDLE: 3
 * * NEARLY: 4
 * * DISCONNECTED: 5
 * * WAITING_FOR_GUILDS: 6
 * * IDENTIFYING: 7
 * * RESUMING: 8
 * @typedef {Object<string, number>} Status
 */
exports.Status = {
  READY: 0,
  CONNECTING: 1,
  RECONNECTING: 2,
  IDLE: 3,
  NEARLY: 4,
  DISCONNECTED: 5,
  WAITING_FOR_GUILDS: 6,
  IDENTIFYING: 7,
  RESUMING: 8,
};

/**
 * An object containing functions that return certain endpoints on the API.
 * @typedef {Object<string, Function|string>} Endpoints
 * @see {@link https://discord.com/developers/docs/reference#image-formatting-cdn-endpoints}
 */
exports.Endpoints = {
  CDN(root) {
    return {
      Emoji: (emojiId, format = 'webp') => `${root}/emojis/${emojiId}.${format}`,
      Asset: name => `${root}/assets/${name}`,
      DefaultAvatar: discriminator => `${root}/embed/avatars/${discriminator}.png`,
      // Avatar: (userId, hash, format, size, dynamic = false) => {
      //   if (dynamic && hash.startsWith('a_')) format = 'gif';
      //   return makeImageUrl(`${root}/avatars/${userId}/${hash}`, { format, size });
      // },
      // GuildMemberAvatar: (guildId, memberId, hash, format = 'webp', size, dynamic = false) => {
      //   if (dynamic && hash.startsWith('a_')) format = 'gif';
      //   return makeImageUrl(`${root}/guilds/${guildId}/users/${memberId}/avatars/${hash}`, { format, size });
      // },
      // Banner: (id, hash, format, size, dynamic = false) => {
      //   if (dynamic && hash.startsWith('a_')) format = 'gif';
      //   return makeImageUrl(`${root}/banners/${id}/${hash}`, { format, size });
      // },
      // Icon: (guildId, hash, format, size, dynamic = false) => {
      //   if (dynamic && hash.startsWith('a_')) format = 'gif';
      //   return makeImageUrl(`${root}/icons/${guildId}/${hash}`, { format, size });
      // },
      // AppIcon: (appId, hash, options) => makeImageUrl(`${root}/app-icons/${appId}/${hash}`, options),
      // AppAsset: (appId, hash, options) => makeImageUrl(`${root}/app-assets/${appId}/${hash}`, options),
      // StickerPackBanner: (bannerId, format, size) =>
      //   makeImageUrl(`${root}/app-assets/710982414301790216/store/${bannerId}`, { size, format }),
      // GDMIcon: (channelId, hash, format, size) =>
      //   makeImageUrl(`${root}/channel-icons/${channelId}/${hash}`, { size, format }),
      // Splash: (guildId, hash, format, size) => makeImageUrl(`${root}/splashes/${guildId}/${hash}`, { size, format }),
      // DiscoverySplash: (guildId, hash, format, size) =>
      //   makeImageUrl(`${root}/discovery-splashes/${guildId}/${hash}`, { size, format }),
      // TeamIcon: (teamId, hash, options) => makeImageUrl(`${root}/team-icons/${teamId}/${hash}`, options),
      // Sticker: (stickerId, stickerFormat) =>
      //   `${root}/stickers/${stickerId}.${stickerFormat === 'LOTTIE' ? 'json' : 'png'}`,
      // RoleIcon: (roleId, hash, format = 'webp', size) =>
      //   makeImageUrl(`${root}/role-icons/${roleId}/${hash}`, { size, format }),
      // guildScheduledEventCover: (scheduledEventId, coverHash, format, size) =>
      //   makeImageUrl(`${root}/guild-events/${scheduledEventId}/${coverHash}`, { size, format }),
    };
  },
  invite: (root, code, eventId) => (eventId ? `${root}/${code}?event=${eventId}` : `${root}/${code}`),
  scheduledEvent: (root, guildId, eventId) => `${root}/${guildId}/${eventId}`,
  botGateway: '/gateway/bot',
  userGateway: '/gateway',
};

/**
 * The Opcodes sent to the Gateway:
 * * DISPATCH: 0
 * * HEARTBEAT: 1
 * * IDENTIFY: 2
 * * STATUS_UPDATE: 3
 * * VOICE_STATE_UPDATE: 4
 * * VOICE_GUILD_PING: 5
 * * RESUME: 6
 * * RECONNECT: 7
 * * REQUEST_GUILD_MEMBERS: 8
 * * INVALID_SESSION: 9
 * * HELLO: 10
 * * HEARTBEAT_ACK: 11
 * * GUILD_SYNC: 12 [Unused]
 * * DM_UPDATE: 13 #  Send => used to get dm features
 * * LAZY_REQUEST: 14 #  Send => discord responds back with GUILD_MEMBER_LIST_UPDATE type SYNC...
 * * LOBBY_CONNECT: 15
 * * LOBBY_DISCONNECT: 16
 * * LOBBY_VOICE_STATE_UPDATE: 17 #  Receive
 * * STREAM_CREATE: 18
 * * STREAM_DELETE: 19
 * * STREAM_WATCH: 20
 * * STREAM_PING: 21 #  Send
 * * STREAM_SET_PAUSED: 22
 * * REQUEST_APPLICATION_COMMANDS: 24
 * @typedef {Object<string, number>} Opcodes
 */
exports.Opcodes = {
  DISPATCH: 0,
  HEARTBEAT: 1,
  IDENTIFY: 2,
  STATUS_UPDATE: 3,
  VOICE_STATE_UPDATE: 4,
  VOICE_GUILD_PING: 5,
  RESUME: 6,
  RECONNECT: 7,
  REQUEST_GUILD_MEMBERS: 8,
  INVALID_SESSION: 9,
  HELLO: 10,
  HEARTBEAT_ACK: 11,
  GUILD_SYNC: 12,
  DM_UPDATE: 13,
  LAZY_REQUEST: 14,
  LOBBY_CONNECT: 15,
  LOBBY_DISCONNECT: 16,
  LOBBY_VOICE_STATE_UPDATE: 17,
  STREAM_CREATE: 18,
  STREAM_DELETE: 19,
  STREAM_WATCH: 20,
  STREAM_PING: 21,
  STREAM_SET_PAUSED: 22,
  REQUEST_APPLICATION_COMMANDS: 24,
};

/**
 * The types of events emitted by the Client:
 * * RATE_LIMIT: rateLimit
 * * INVALID_REQUEST_WARNING: invalidRequestWarning
 * * API_RESPONSE: apiResponse
 * * API_REQUEST: apiRequest
 * * CLIENT_READY: ready
 * * APPLICATION_COMMAND_AUTOCOMPLETE_RESPONSE: applicationCommandAutocompleteResponse
 * * APPLICATION_COMMAND_CREATE: applicationCommandCreate (deprecated)
 * * APPLICATION_COMMAND_DELETE: applicationCommandDelete (deprecated)
 * * APPLICATION_COMMAND_UPDATE: applicationCommandUpdate (deprecated)
 * * CALL_CREATE: callCreate
 * * CALL_DELETE: callDelete
 * * CALL_UPDATE: callUpdate
 * * GUILD_CREATE: guildCreate
 * * GUILD_DELETE: guildDelete
 * * GUILD_UPDATE: guildUpdate
 * * GUILD_UNAVAILABLE: guildUnavailable
 * * GUILD_MEMBER_ADD: guildMemberAdd
 * * GUILD_MEMBER_REMOVE: guildMemberRemove
 * * GUILD_MEMBER_UPDATE: guildMemberUpdate
 * * GUILD_MEMBER_AVAILABLE: guildMemberAvailable
 * * GUILD_MEMBERS_CHUNK: guildMembersChunk
 * * GUILD_INTEGRATIONS_UPDATE: guildIntegrationsUpdate
 * * GUILD_ROLE_CREATE: roleCreate
 * * GUILD_ROLE_DELETE: roleDelete
 * * INVITE_CREATE: inviteCreate
 * * INVITE_DELETE: inviteDelete
 * * GUILD_ROLE_UPDATE: roleUpdate
 * * GUILD_EMOJI_CREATE: emojiCreate
 * * GUILD_EMOJI_DELETE: emojiDelete
 * * GUILD_EMOJI_UPDATE: emojiUpdate
 * * GUILD_BAN_ADD: guildBanAdd
 * * GUILD_BAN_REMOVE: guildBanRemove
 * * CHANNEL_CREATE: channelCreate
 * * CHANNEL_DELETE: channelDelete
 * * CHANNEL_UPDATE: channelUpdate
 * * CHANNEL_PINS_UPDATE: channelPinsUpdate
 * * MESSAGE_CREATE: messageCreate
 * * MESSAGE_DELETE: messageDelete
 * * MESSAGE_UPDATE: messageUpdate
 * * MESSAGE_BULK_DELETE: messageDeleteBulk
 * * MESSAGE_REACTION_ADD: messageReactionAdd
 * * MESSAGE_REACTION_REMOVE: messageReactionRemove
 * * MESSAGE_REACTION_REMOVE_ALL: messageReactionRemoveAll
 * * MESSAGE_REACTION_REMOVE_EMOJI: messageReactionRemoveEmoji
 * * THREAD_CREATE: threadCreate
 * * THREAD_DELETE: threadDelete
 * * THREAD_UPDATE: threadUpdate
 * * THREAD_LIST_SYNC: threadListSync
 * * THREAD_MEMBER_UPDATE: threadMemberUpdate
 * * THREAD_MEMBERS_UPDATE: threadMembersUpdate
 * * USER_UPDATE: userUpdate
 * * PRESENCE_UPDATE: presenceUpdate
 * * VOICE_SERVER_UPDATE: voiceServerUpdate
 * * VOICE_STATE_UPDATE: voiceStateUpdate
 * * TYPING_START: typingStart
 * * WEBHOOKS_UPDATE: webhookUpdate
 * * INTERACTION_CREATE: interactionCreate
 * * ERROR: error
 * * WARN: warn
 * * DEBUG: debug
 * * CACHE_SWEEP: cacheSweep
 * * SHARD_DISCONNECT: shardDisconnect
 * * SHARD_ERROR: shardError
 * * SHARD_RECONNECTING: shardReconnecting
 * * SHARD_READY: shardReady
 * * SHARD_RESUME: shardResume
 * * INVALIDATED: invalidated
 * * RAW: raw
 * * STAGE_INSTANCE_CREATE: stageInstanceCreate
 * * STAGE_INSTANCE_UPDATE: stageInstanceUpdate
 * * STAGE_INSTANCE_DELETE: stageInstanceDelete
 * * GUILD_STICKER_CREATE: stickerCreate
 * * GUILD_STICKER_DELETE: stickerDelete
 * * GUILD_STICKER_UPDATE: stickerUpdate
 * * GUILD_SCHEDULED_EVENT_CREATE: guildScheduledEventCreate
 * * GUILD_SCHEDULED_EVENT_UPDATE: guildScheduledEventUpdate
 * * GUILD_SCHEDULED_EVENT_DELETE: guildScheduledEventDelete
 * * GUILD_SCHEDULED_EVENT_USER_ADD: guildScheduledEventUserAdd
 * * GUILD_SCHEDULED_EVENT_USER_REMOVE: guildScheduledEventUserRemove
 * @typedef {Object<string, string>} Events
 */
exports.Events = {
  RATE_LIMIT: 'rateLimit',
  INVALID_REQUEST_WARNING: 'invalidRequestWarning',
  API_RESPONSE: 'apiResponse',
  API_REQUEST: 'apiRequest',
  CLIENT_READY: 'ready',
  APPLICATION_COMMAND_AUTOCOMPLETE_RESPONSE: 'applicationCommandAutocompleteResponse',
  APPLICATION_COMMAND_CREATE: 'applicationCommandCreate',
  APPLICATION_COMMAND_DELETE: 'applicationCommandDelete',
  APPLICATION_COMMAND_UPDATE: 'applicationCommandUpdate',
  CALL_CREATE: 'callCreate',
  CALL_DELETE: 'callDelete',
  CALL_UPDATE: 'callUpdate',
  GUILD_CREATE: 'guildCreate',
  GUILD_DELETE: 'guildDelete',
  GUILD_UPDATE: 'guildUpdate',
  GUILD_APPLICATION_COMMANDS_UPDATE: 'guildApplicationCommandUpdate',
  GUILD_UNAVAILABLE: 'guildUnavailable',
  GUILD_MEMBER_ADD: 'guildMemberAdd',
  GUILD_MEMBER_REMOVE: 'guildMemberRemove',
  GUILD_MEMBER_UPDATE: 'guildMemberUpdate',
  GUILD_MEMBER_AVAILABLE: 'guildMemberAvailable',
  GUILD_MEMBERS_CHUNK: 'guildMembersChunk',
  GUILD_MEMBER_LIST_UPDATE: 'guildMemberListUpdate',
  GUILD_INTEGRATIONS_UPDATE: 'guildIntegrationsUpdate',
  GUILD_ROLE_CREATE: 'roleCreate',
  GUILD_ROLE_DELETE: 'roleDelete',
  INVITE_CREATE: 'inviteCreate',
  INVITE_DELETE: 'inviteDelete',
  GUILD_ROLE_UPDATE: 'roleUpdate',
  GUILD_EMOJI_CREATE: 'emojiCreate',
  GUILD_EMOJI_DELETE: 'emojiDelete',
  GUILD_EMOJI_UPDATE: 'emojiUpdate',
  GUILD_BAN_ADD: 'guildBanAdd',
  GUILD_BAN_REMOVE: 'guildBanRemove',
  CHANNEL_CREATE: 'channelCreate',
  CHANNEL_DELETE: 'channelDelete',
  CHANNEL_UPDATE: 'channelUpdate',
  CHANNEL_PINS_UPDATE: 'channelPinsUpdate',
  MESSAGE_CREATE: 'messageCreate',
  MESSAGE_DELETE: 'messageDelete',
  MESSAGE_UPDATE: 'messageUpdate',
  MESSAGE_BULK_DELETE: 'messageDeleteBulk',
  MESSAGE_REACTION_ADD: 'messageReactionAdd',
  MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
  MESSAGE_REACTION_REMOVE_ALL: 'messageReactionRemoveAll',
  MESSAGE_REACTION_REMOVE_EMOJI: 'messageReactionRemoveEmoji',
  THREAD_CREATE: 'threadCreate',
  THREAD_DELETE: 'threadDelete',
  THREAD_UPDATE: 'threadUpdate',
  THREAD_LIST_SYNC: 'threadListSync',
  THREAD_MEMBER_UPDATE: 'threadMemberUpdate',
  THREAD_MEMBERS_UPDATE: 'threadMembersUpdate',
  USER_UPDATE: 'userUpdate',
  USER_SETTINGS_UPDATE: 'userSettingsUpdate',
  PRESENCE_UPDATE: 'presenceUpdate',
  VOICE_SERVER_UPDATE: 'voiceServerUpdate',
  VOICE_STATE_UPDATE: 'voiceStateUpdate',
  TYPING_START: 'typingStart',
  WEBHOOKS_UPDATE: 'webhookUpdate',
  INTERACTION_CREATE: 'interactionCreate',
  INTERACTION_SUCCESS: 'interactionSuccess',
  INTERACTION_FAILURE: 'interactionFailure',
  INTERACTION_MODAL_CREATE: 'interactionModalCreate',
  ERROR: 'error',
  WARN: 'warn',
  DEBUG: 'debug',
  CACHE_SWEEP: 'cacheSweep',
  SHARD_DISCONNECT: 'shardDisconnect',
  SHARD_ERROR: 'shardError',
  SHARD_RECONNECTING: 'shardReconnecting',
  SHARD_READY: 'shardReady',
  SHARD_RESUME: 'shardResume',
  INVALIDATED: 'invalidated',
  RAW: 'raw',
  STAGE_INSTANCE_CREATE: 'stageInstanceCreate',
  STAGE_INSTANCE_UPDATE: 'stageInstanceUpdate',
  STAGE_INSTANCE_DELETE: 'stageInstanceDelete',
  GUILD_STICKER_CREATE: 'stickerCreate',
  GUILD_STICKER_DELETE: 'stickerDelete',
  GUILD_STICKER_UPDATE: 'stickerUpdate',
  GUILD_SCHEDULED_EVENT_CREATE: 'guildScheduledEventCreate',
  GUILD_SCHEDULED_EVENT_UPDATE: 'guildScheduledEventUpdate',
  GUILD_SCHEDULED_EVENT_DELETE: 'guildScheduledEventDelete',
  GUILD_SCHEDULED_EVENT_USER_ADD: 'guildScheduledEventUserAdd',
  GUILD_SCHEDULED_EVENT_USER_REMOVE: 'guildScheduledEventUserRemove',
  RELATIONSHIP_ADD: 'relationshipAdd',
  RELATIONSHIP_REMOVE: 'relationshipRemove',
  UNHANDLED_PACKET: 'unhandledPacket',
};

/**
 * The types of events emitted by a Shard:
 * * CLOSE: close
 * * DESTROYED: destroyed
 * * INVALID_SESSION: invalidSession
 * * READY: ready
 * * RESUMED: resumed
 * * ALL_READY: allReady
 * @typedef {Object<string, string>} ShardEvents
 */
exports.ShardEvents = {
  CLOSE: 'close',
  DESTROYED: 'destroyed',
  INVALID_SESSION: 'invalidSession',
  READY: 'ready',
  RESUMED: 'resumed',
  ALL_READY: 'allReady',
};

/**
 * The type of a WebSocket message event, e.g. `MESSAGE_CREATE`. Here are the available events:
 * * READY
 * * RESUMED
 * * APPLICATION_COMMAND_AUTOCOMPLETE_RESPONSE
 * * APPLICATION_COMMAND_CREATE (deprecated)
 * * APPLICATION_COMMAND_DELETE (deprecated)
 * * APPLICATION_COMMAND_UPDATE (deprecated)
 * * GUILD_CREATE
 * * GUILD_DELETE
 * * GUILD_UPDATE
 * * INVITE_CREATE
 * * INVITE_DELETE
 * * GUILD_MEMBER_ADD
 * * GUILD_MEMBER_REMOVE
 * * GUILD_MEMBER_UPDATE
 * * GUILD_MEMBERS_CHUNK
 * * GUILD_INTEGRATIONS_UPDATE
 * * GUILD_ROLE_CREATE
 * * GUILD_ROLE_DELETE
 * * GUILD_ROLE_UPDATE
 * * GUILD_BAN_ADD
 * * GUILD_BAN_REMOVE
 * * GUILD_EMOJIS_UPDATE
 * * CHANNEL_CREATE
 * * CHANNEL_DELETE
 * * CHANNEL_UPDATE
 * * CHANNEL_PINS_UPDATE
 * * MESSAGE_CREATE
 * * MESSAGE_DELETE
 * * MESSAGE_UPDATE
 * * MESSAGE_DELETE_BULK
 * * MESSAGE_REACTION_ADD
 * * MESSAGE_REACTION_REMOVE
 * * MESSAGE_REACTION_REMOVE_ALL
 * * MESSAGE_REACTION_REMOVE_EMOJI
 * * THREAD_CREATE
 * * THREAD_UPDATE
 * * THREAD_DELETE
 * * THREAD_LIST_SYNC
 * * THREAD_MEMBER_UPDATE
 * * THREAD_MEMBERS_UPDATE
 * * USER_UPDATE
 * * PRESENCE_UPDATE
 * * TYPING_START
 * * VOICE_STATE_UPDATE
 * * VOICE_SERVER_UPDATE
 * * WEBHOOKS_UPDATE
 * * INTERACTION_CREATE
 * * STAGE_INSTANCE_CREATE
 * * STAGE_INSTANCE_UPDATE
 * * STAGE_INSTANCE_DELETE
 * * GUILD_STICKERS_UPDATE
 * * GUILD_SCHEDULED_EVENT_CREATE
 * * GUILD_SCHEDULED_EVENT_UPDATE
 * * GUILD_SCHEDULED_EVENT_DELETE
 * * GUILD_SCHEDULED_EVENT_USER_ADD
 * * GUILD_SCHEDULED_EVENT_USER_REMOVE
 * @typedef {string} WSEventType
 * @see {@link https://discord.com/developers/docs/topics/gateway#commands-and-events-gateway-events}
 */
exports.WSEvents = keyMirror([
  'READY',
  'RESUMED',
  'APPLICATION_COMMAND_AUTOCOMPLETE_RESPONSE',
  'APPLICATION_COMMAND_CREATE',
  'APPLICATION_COMMAND_DELETE',
  'APPLICATION_COMMAND_UPDATE',
  'GUILD_CREATE',
  'GUILD_DELETE',
  'GUILD_UPDATE',
  'INVITE_CREATE',
  'INVITE_DELETE',
  'GUILD_MEMBER_ADD',
  'GUILD_MEMBER_REMOVE',
  'GUILD_MEMBER_UPDATE',
  'GUILD_MEMBERS_CHUNK',
  'GUILD_INTEGRATIONS_UPDATE',
  'GUILD_ROLE_CREATE',
  'GUILD_ROLE_DELETE',
  'GUILD_ROLE_UPDATE',
  'GUILD_BAN_ADD',
  'GUILD_BAN_REMOVE',
  'GUILD_EMOJIS_UPDATE',
  'CHANNEL_CREATE',
  'CHANNEL_DELETE',
  'CHANNEL_UPDATE',
  'CHANNEL_PINS_UPDATE',
  'MESSAGE_CREATE',
  'MESSAGE_DELETE',
  'MESSAGE_UPDATE',
  'MESSAGE_DELETE_BULK',
  'MESSAGE_REACTION_ADD',
  'MESSAGE_REACTION_REMOVE',
  'MESSAGE_REACTION_REMOVE_ALL',
  'MESSAGE_REACTION_REMOVE_EMOJI',
  'THREAD_CREATE',
  'THREAD_UPDATE',
  'THREAD_DELETE',
  'THREAD_LIST_SYNC',
  'THREAD_MEMBER_UPDATE',
  'THREAD_MEMBERS_UPDATE',
  'USER_UPDATE',
  'PRESENCE_UPDATE',
  'TYPING_START',
  'VOICE_STATE_UPDATE',
  'VOICE_SERVER_UPDATE',
  'WEBHOOKS_UPDATE',
  'INTERACTION_CREATE',
  'STAGE_INSTANCE_CREATE',
  'STAGE_INSTANCE_UPDATE',
  'STAGE_INSTANCE_DELETE',
  'GUILD_STICKERS_UPDATE',
  'GUILD_SCHEDULED_EVENT_CREATE',
  'GUILD_SCHEDULED_EVENT_UPDATE',
  'GUILD_SCHEDULED_EVENT_DELETE',
  'GUILD_SCHEDULED_EVENT_USER_ADD',
  'GUILD_SCHEDULED_EVENT_USER_REMOVE',
]);

/**
 * An error encountered while performing an API request. Here are the potential errors:
 * * UNKNOWN_ACCOUNT
 * * UNKNOWN_APPLICATION
 * * UNKNOWN_CHANNEL
 * * UNKNOWN_GUILD
 * * UNKNOWN_INTEGRATION
 * * UNKNOWN_INVITE
 * * UNKNOWN_MEMBER
 * * UNKNOWN_MESSAGE
 * * UNKNOWN_OVERWRITE
 * * UNKNOWN_PROVIDER
 * * UNKNOWN_ROLE
 * * UNKNOWN_TOKEN
 * * UNKNOWN_USER
 * * UNKNOWN_EMOJI
 * * UNKNOWN_WEBHOOK
 * * UNKNOWN_WEBHOOK_SERVICE
 * * UNKNOWN_SESSION
 * * UNKNOWN_BAN
 * * UNKNOWN_SKU
 * * UNKNOWN_STORE_LISTING
 * * UNKNOWN_ENTITLEMENT
 * * UNKNOWN_BUILD
 * * UNKNOWN_LOBBY
 * * UNKNOWN_BRANCH
 * * UNKNOWN_STORE_DIRECTORY_LAYOUT
 * * UNKNOWN_REDISTRIBUTABLE
 * * UNKNOWN_GIFT_CODE
 * * UNKNOWN_STREAM
 * * UNKNOWN_PREMIUM_SERVER_SUBSCRIBE_COOLDOWN
 * * UNKNOWN_GUILD_TEMPLATE
 * * UNKNOWN_DISCOVERABLE_SERVER_CATEGORY
 * * UNKNOWN_STICKER
 * * UNKNOWN_INTERACTION
 * * UNKNOWN_APPLICATION_COMMAND
 * * UNKNOWN_APPLICATION_COMMAND_PERMISSIONS
 * * UNKNOWN_STAGE_INSTANCE
 * * UNKNOWN_GUILD_MEMBER_VERIFICATION_FORM
 * * UNKNOWN_GUILD_WELCOME_SCREEN
 * * UNKNOWN_GUILD_SCHEDULED_EVENT
 * * UNKNOWN_GUILD_SCHEDULED_EVENT_USER
 * * BOT_PROHIBITED_ENDPOINT
 * * BOT_ONLY_ENDPOINT
 * * CANNOT_SEND_EXPLICIT_CONTENT
 * * NOT_AUTHORIZED
 * * SLOWMODE_RATE_LIMIT
 * * ACCOUNT_OWNER_ONLY
 * * ANNOUNCEMENT_EDIT_LIMIT_EXCEEDED
 * * CHANNEL_HIT_WRITE_RATELIMIT
 * * SERVER_HIT_WRITE_RATELIMIT
 * * CONTENT_NOT_ALLOWED
 * * GUILD_PREMIUM_LEVEL_TOO_LOW
 * * MAXIMUM_GUILDS
 * * MAXIMUM_FRIENDS
 * * MAXIMUM_PINS
 * * MAXIMUM_RECIPIENTS
 * * MAXIMUM_ROLES
 * * MAXIMUM_USERNAMES
 * * MAXIMUM_WEBHOOKS
 * * MAXIMUM_EMOJIS
 * * MAXIMUM_REACTIONS
 * * MAXIMUM_CHANNELS
 * * MAXIMUM_ATTACHMENTS
 * * MAXIMUM_INVITES
 * * MAXIMUM_ANIMATED_EMOJIS
 * * MAXIMUM_SERVER_MEMBERS
 * * MAXIMUM_NUMBER_OF_SERVER_CATEGORIES
 * * GUILD_ALREADY_HAS_TEMPLATE
 * * MAXIMUM_THREAD_PARTICIPANTS
 * * MAXIMUM_NON_GUILD_MEMBERS_BANS
 * * MAXIMUM_BAN_FETCHES
 * * MAXIMUM_NUMBER_OF_UNCOMPLETED_GUILD_SCHEDULED_EVENTS_REACHED
 * * MAXIMUM_NUMBER_OF_STICKERS_REACHED
 * * MAXIMUM_PRUNE_REQUESTS
 * * MAXIMUM_GUILD_WIDGET_SETTINGS_UPDATE
 * * UNAUTHORIZED
 * * ACCOUNT_VERIFICATION_REQUIRED
 * * DIRECT_MESSAGES_TOO_FAST
 * * REQUEST_ENTITY_TOO_LARGE
 * * FEATURE_TEMPORARILY_DISABLED
 * * USER_BANNED
 * * TARGET_USER_NOT_CONNECTED_TO_VOICE
 * * ALREADY_CROSSPOSTED
 * * MISSING_ACCESS
 * * INVALID_ACCOUNT_TYPE
 * * CANNOT_EXECUTE_ON_DM
 * * EMBED_DISABLED
 * * CANNOT_EDIT_MESSAGE_BY_OTHER
 * * CANNOT_SEND_EMPTY_MESSAGE
 * * CANNOT_MESSAGE_USER
 * * CANNOT_SEND_MESSAGES_IN_VOICE_CHANNEL
 * * CHANNEL_VERIFICATION_LEVEL_TOO_HIGH
 * * OAUTH2_APPLICATION_BOT_ABSENT
 * * MAXIMUM_OAUTH2_APPLICATIONS
 * * INVALID_OAUTH_STATE
 * * MISSING_PERMISSIONS
 * * INVALID_AUTHENTICATION_TOKEN
 * * NOTE_TOO_LONG
 * * INVALID_BULK_DELETE_QUANTITY
 * * CANNOT_PIN_MESSAGE_IN_OTHER_CHANNEL
 * * INVALID_OR_TAKEN_INVITE_CODE
 * * CANNOT_EXECUTE_ON_SYSTEM_MESSAGE
 * * CANNOT_EXECUTE_ON_CHANNEL_TYPE
 * * INVALID_OAUTH_TOKEN
 * * MISSING_OAUTH_SCOPE
 * * INVALID_WEBHOOK_TOKEN
 * * INVALID_ROLE
 * * INVALID_RECIPIENTS
 * * BULK_DELETE_MESSAGE_TOO_OLD
 * * INVALID_FORM_BODY
 * * INVITE_ACCEPTED_TO_GUILD_NOT_CONTAINING_BOT
 * * INVALID_API_VERSION
 * * FILE_UPLOADED_EXCEEDS_MAXIMUM_SIZE
 * * INVALID_FILE_UPLOADED
 * * GIFT_CODE_CLAIMED
 * * CANNOT_SELF_REDEEM_GIFT
 * * INVALID_GUILD
 * * PAYMENT_SOURCE_REQUIRED
 * * CANNOT_DELETE_COMMUNITY_REQUIRED_CHANNEL
 * * INVALID_STICKER_SENT
 * * INVALID_OPERATION_ON_ARCHIVED_THREAD
 * * INVALID_THREAD_NOTIFICATION_SETTINGS
 * * PARAMETER_EARLIER_THAN_CREATION
 * * GUILD_NOT_AVAILABLE_IN_LOCATION
 * * GUILD_MONETIZATION_REQUIRED
 * * INSUFFICIENT_BOOSTS
 * * INVALID_JSON
 * * TWO_FACTOR_REQUIRED
 * * INVALID_TWO_FACTOR_CODE
 * * NO_USERS_WITH_DISCORDTAG_EXIST
 * * REACTION_BLOCKED
 * * RESOURCE_OVERLOADED
 * * STAGE_ALREADY_OPEN
 * * CANNOT_REPLY_WITHOUT_READ_MESSAGE_HISTORY_PERMISSION
 * * MESSAGE_ALREADY_HAS_THREAD
 * * THREAD_LOCKED
 * * MAXIMUM_ACTIVE_THREADS
 * * MAXIMUM_ACTIVE_ANNOUNCEMENT_THREADS
 * * INVALID_JSON_FOR_UPLOADED_LOTTIE_FILE
 * * UPLOADED_LOTTIES_CANNOT_CONTAIN_RASTERIZED_IMAGES
 * * STICKER_MAXIMUM_FRAMERATE_EXCEEDED
 * * STICKER_FRAME_COUNT_EXCEEDS_MAXIMUM_OF_1000_FRAMES
 * * LOTTIE_ANIMATION_MAXIMUM_DIMENSIONS_EXCEEDED
 * * STICKER_FRAME_RATE_IS_TOO_SMALL_OR_TOO_LARGE
 * * STICKER_ANIMATION_DURATION_EXCEEDS_MAXIMUM_OF_5_SECONDS
 * * CANNOT_UPDATE_A_FINISHED_EVENT
 * * FAILED_TO_CREATE_STAGE_NEEDED_FOR_STAGE_EVENT
 * @typedef {string} APIError
 * @see {@link https://discord.com/developers/docs/topics/opcodes-and-status-codes#json-json-error-codes}
 */
exports.APIErrors = {
  UNKNOWN_ACCOUNT: 10001,
  UNKNOWN_APPLICATION: 10002,
  UNKNOWN_CHANNEL: 10003,
  UNKNOWN_GUILD: 10004,
  UNKNOWN_INTEGRATION: 10005,
  UNKNOWN_INVITE: 10006,
  UNKNOWN_MEMBER: 10007,
  UNKNOWN_MESSAGE: 10008,
  UNKNOWN_OVERWRITE: 10009,
  UNKNOWN_PROVIDER: 10010,
  UNKNOWN_ROLE: 10011,
  UNKNOWN_TOKEN: 10012,
  UNKNOWN_USER: 10013,
  UNKNOWN_EMOJI: 10014,
  UNKNOWN_WEBHOOK: 10015,
  UNKNOWN_WEBHOOK_SERVICE: 10016,
  UNKNOWN_SESSION: 10020,
  UNKNOWN_BAN: 10026,
  UNKNOWN_SKU: 10027,
  UNKNOWN_STORE_LISTING: 10028,
  UNKNOWN_ENTITLEMENT: 10029,
  UNKNOWN_BUILD: 10030,
  UNKNOWN_LOBBY: 10031,
  UNKNOWN_BRANCH: 10032,
  UNKNOWN_STORE_DIRECTORY_LAYOUT: 10033,
  UNKNOWN_REDISTRIBUTABLE: 10036,
  UNKNOWN_GIFT_CODE: 10038,
  UNKNOWN_STREAM: 10049,
  UNKNOWN_PREMIUM_SERVER_SUBSCRIBE_COOLDOWN: 10050,
  UNKNOWN_GUILD_TEMPLATE: 10057,
  UNKNOWN_DISCOVERABLE_SERVER_CATEGORY: 10059,
  UNKNOWN_STICKER: 10060,
  UNKNOWN_INTERACTION: 10062,
  UNKNOWN_APPLICATION_COMMAND: 10063,
  UNKNOWN_APPLICATION_COMMAND_PERMISSIONS: 10066,
  UNKNOWN_STAGE_INSTANCE: 10067,
  UNKNOWN_GUILD_MEMBER_VERIFICATION_FORM: 10068,
  UNKNOWN_GUILD_WELCOME_SCREEN: 10069,
  UNKNOWN_GUILD_SCHEDULED_EVENT: 10070,
  UNKNOWN_GUILD_SCHEDULED_EVENT_USER: 10071,
  BOT_PROHIBITED_ENDPOINT: 20001,
  BOT_ONLY_ENDPOINT: 20002,
  CANNOT_SEND_EXPLICIT_CONTENT: 20009,
  NOT_AUTHORIZED: 20012,
  SLOWMODE_RATE_LIMIT: 20016,
  ACCOUNT_OWNER_ONLY: 20018,
  ANNOUNCEMENT_EDIT_LIMIT_EXCEEDED: 20022,
  CHANNEL_HIT_WRITE_RATELIMIT: 20028,
  SERVER_HIT_WRITE_RATELIMIT: 20029,
  CONTENT_NOT_ALLOWED: 20031,
  GUILD_PREMIUM_LEVEL_TOO_LOW: 20035,
  MAXIMUM_GUILDS: 30001,
  MAXIMUM_FRIENDS: 30002,
  MAXIMUM_PINS: 30003,
  MAXIMUM_RECIPIENTS: 30004,
  MAXIMUM_ROLES: 30005,
  MAXIMUN_USERNAMES: 30006,
  MAXIMUM_WEBHOOKS: 30007,
  MAXIMUM_EMOJIS: 30008,
  MAXIMUM_REACTIONS: 30010,
  MAXIMUM_CHANNELS: 30013,
  MAXIMUM_ATTACHMENTS: 30015,
  MAXIMUM_INVITES: 30016,
  MAXIMUM_ANIMATED_EMOJIS: 30018,
  MAXIMUM_SERVER_MEMBERS: 30019,
  MAXIMUM_NUMBER_OF_SERVER_CATEGORIES: 30030,
  GUILD_ALREADY_HAS_TEMPLATE: 30031,
  MAXIMUM_THREAD_PARTICIPANTS: 30033,
  MAXIMUM_NON_GUILD_MEMBERS_BANS: 30035,
  MAXIMUM_BAN_FETCHES: 30037,
  MAXIMUM_NUMBER_OF_UNCOMPLETED_GUILD_SCHEDULED_EVENTS_REACHED: 30038,
  MAXIMUM_NUMBER_OF_STICKERS_REACHED: 30039,
  MAXIMUM_PRUNE_REQUESTS: 30040,
  MAXIMUM_GUILD_WIDGET_SETTINGS_UPDATE: 30042,
  UNAUTHORIZED: 40001,
  ACCOUNT_VERIFICATION_REQUIRED: 40002,
  DIRECT_MESSAGES_TOO_FAST: 40003,
  REQUEST_ENTITY_TOO_LARGE: 40005,
  FEATURE_TEMPORARILY_DISABLED: 40006,
  USER_BANNED: 40007,
  TARGET_USER_NOT_CONNECTED_TO_VOICE: 40032,
  ALREADY_CROSSPOSTED: 40033,
  MISSING_ACCESS: 50001,
  INVALID_ACCOUNT_TYPE: 50002,
  CANNOT_EXECUTE_ON_DM: 50003,
  EMBED_DISABLED: 50004,
  CANNOT_EDIT_MESSAGE_BY_OTHER: 50005,
  CANNOT_SEND_EMPTY_MESSAGE: 50006,
  CANNOT_MESSAGE_USER: 50007,
  CANNOT_SEND_MESSAGES_IN_VOICE_CHANNEL: 50008,
  CHANNEL_VERIFICATION_LEVEL_TOO_HIGH: 50009,
  OAUTH2_APPLICATION_BOT_ABSENT: 50010,
  MAXIMUM_OAUTH2_APPLICATIONS: 50011,
  INVALID_OAUTH_STATE: 50012,
  MISSING_PERMISSIONS: 50013,
  INVALID_AUTHENTICATION_TOKEN: 50014,
  NOTE_TOO_LONG: 50015,
  INVALID_BULK_DELETE_QUANTITY: 50016,
  INVALID_MFA_LEVEL: 50017,
  CANNOT_PIN_MESSAGE_IN_OTHER_CHANNEL: 50019,
  INVALID_OR_TAKEN_INVITE_CODE: 50020,
  CANNOT_EXECUTE_ON_SYSTEM_MESSAGE: 50021,
  CANNOT_EXECUTE_ON_CHANNEL_TYPE: 50024,
  INVALID_OAUTH_TOKEN: 50025,
  MISSING_OAUTH_SCOPE: 50026,
  INVALID_WEBHOOK_TOKEN: 50027,
  INVALID_ROLE: 50028,
  INVALID_RECIPIENTS: 50033,
  BULK_DELETE_MESSAGE_TOO_OLD: 50034,
  INVALID_FORM_BODY: 50035,
  INVITE_ACCEPTED_TO_GUILD_NOT_CONTAINING_BOT: 50036,
  INVALID_API_VERSION: 50041,
  FILE_UPLOADED_EXCEEDS_MAXIMUM_SIZE: 50045,
  INVALID_FILE_UPLOADED: 50046,
  GIFT_CODE_CLAIMED: 50050,
  CANNOT_SELF_REDEEM_GIFT: 50054,
  INVALID_GUILD: 50055,
  PAYMENT_SOURCE_REQUIRED: 50070,
  CANNOT_DELETE_COMMUNITY_REQUIRED_CHANNEL: 50074,
  INVALID_STICKER_SENT: 50081,
  INVALID_OPERATION_ON_ARCHIVED_THREAD: 50083,
  INVALID_THREAD_NOTIFICATION_SETTINGS: 50084,
  PARAMETER_EARLIER_THAN_CREATION: 50085,
  GUILD_NOT_AVAILABLE_IN_LOCATION: 50095,
  GUILD_MONETIZATION_REQUIRED: 50097,
  INSUFFICIENT_BOOSTS: 50101,
  INVALID_JSON: 50109,
  TWO_FACTOR_REQUIRED: 60003,
  INVALID_TWO_FACTOR_CODE: 60008,
  NO_USERS_WITH_DISCORDTAG_EXIST: 80004,
  REACTION_BLOCKED: 90001,
  RESOURCE_OVERLOADED: 130000,
  STAGE_ALREADY_OPEN: 150006,
  CANNOT_REPLY_WITHOUT_READ_MESSAGE_HISTORY_PERMISSION: 160002,
  MESSAGE_ALREADY_HAS_THREAD: 160004,
  THREAD_LOCKED: 160005,
  MAXIMUM_ACTIVE_THREADS: 160006,
  MAXIMUM_ACTIVE_ANNOUNCEMENT_THREADS: 160007,
  INVALID_JSON_FOR_UPLOADED_LOTTIE_FILE: 170001,
  UPLOADED_LOTTIES_CANNOT_CONTAIN_RASTERIZED_IMAGES: 170002,
  STICKER_MAXIMUM_FRAMERATE_EXCEEDED: 170003,
  STICKER_FRAME_COUNT_EXCEEDS_MAXIMUM_OF_1000_FRAMES: 170004,
  LOTTIE_ANIMATION_MAXIMUM_DIMENSIONS_EXCEEDED: 170005,
  STICKER_FRAME_RATE_IS_TOO_SMALL_OR_TOO_LARGE: 170006,
  STICKER_ANIMATION_DURATION_EXCEEDS_MAXIMUM_OF_5_SECONDS: 170007,
  CANNOT_UPDATE_A_FINISHED_EVENT: 180000,
  FAILED_TO_CREATE_STAGE_NEEDED_FOR_STAGE_EVENT: 180002,
};

function keyMirror(arr) {
  const tmp = Object.create(null);
  for (const value of arr) tmp[value] = value;
  return tmp;
}

// Function createEnum(keys) {
//   const obj = {};
//   for (const [index, key] of keys.entries()) {
//     if (key === null) continue;
//     obj[key] = index;
//     obj[index] = key;
//   }
//   return obj;
// }
