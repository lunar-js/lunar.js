'use strict';

const { Collection } = require('@discordjs/collection');
// eslint-disable-next-line no-unused-vars
const Client = require('../Client/Client');

const PurchasedFlags = {
  NITRO_BASIC: 1 << 0,
  NITRO: 1 << 1,
  GUILD_BOOST: 1 << 2,
};

const NitroType = ['None', 'Nitro Classic', 'Nitro', 'Nitro Basic'];

class ClientUser {
  /**
   * @param {Client} client the client
   * @param {Object} data the client data
   */
  constructor(client, data) {
    this.client = client;

    if ('verified' in data) {
      /**
       * Whether or not this account has been verified
       * @type {boolean}
       */
      this.verified = data.verified;
    }

    if ('mfa_enabled' in data) {
      /**
       * If the bot's {@link ClientApplication#owner Owner} has MFA enabled on their account
       * @type {?boolean}
       */
      this.mfaEnabled = typeof data.mfa_enabled === 'boolean' ? data.mfa_enabled : null;
    } else {
      this.mfaEnabled ??= null;
    }

    // Todo: Add (Selfbot)
    if ('premium_type' in data) {
      const nitro = NitroType[data.premium_type ?? 0];
      /**
       * Nitro type of the client user.
       * @type {NitroType}
       */
      this.nitroType = nitro ?? `UNKNOWN_TYPE_${data.premium_type}`;
    }
    if ('purchased_flags' in data) {
      /**
       * Purchased state of the client user.
       * @type {?PurchasedFlags}
       */
      this.purchasedFlags = new PurchasedFlags(data.purchased_flags || 0);
    }
    // Key: premium = boolean;
    if ('phone' in data) {
      /**
       * Phone number of the client user.
       * @type {?string}
       */
      this.phoneNumber = data.phone;
    }
    if ('nsfw_allowed' in data) {
      /**
       * Whether or not the client user is allowed to send NSFW messages [iOS device].
       * @type {?boolean}
       */
      this.nsfwAllowed = data.nsfw_allowed;
    }
    if ('email' in data) {
      /**
       * Email address of the client user.
       * @type {?string}
       */
      this.emailAddress = data.email;
    }
    if ('bio' in data) {
      this.bio = data.bio;
    }

    /**
     * The friend nicknames cache of the client user.
     * @type {Collection<Snowflake, string>}
     */
    this.friendNicknames = new Collection();

    /**
     * The notes cache for the client
     * @type {Collection<Snowflake, string>}
     */
    this.notes = data.notes ? new Collection(Object.entries(data.notes)) : new Collection();
  }

  async getRelationships() {
    const data = await this.client.api.makeRequest('GET', 'users/@me/relationships', true, true);
    return data;
  }

  async getGuildAffinities() {
    const data = await this.client.api.makeRequest('GET', 'users/@me/affinities/guilds', true, true);
    return data;
  }

  async getMentions(limit, roleMentions, everyoneMentions) {
    const role = String(roleMentions).toLowerCase();
    const everyone = String(everyoneMentions).toLowerCase();
    const data = await this.client.api.makeRequest(
      'get',
      `users/@me/mentions?limit=${limit}&roles=${role}&everyone=${everyone}`,
      true,
      true,
    );
    return data;
  }

  async removeMention(messageID) {
    const data = await this.client.api.makeRequest('DELETE', `users/@me/mentions/${messageID}`, true, true);
    return data;
  }

  async getStickers() {
    const data = await this.client.api.makeRequest('GET', 'users/@me/sticker-packs', true, true);
    return data;
  }

  async setUsername(username, password) {
    const data = await this.client.api.makeRequest('PATCH', 'users/@me', true, true, {
      username,
      password,
    });
    return data;
  }

  async setEmail(email, password) {
    const data = await this.client.api.makeRequest('PATCH', 'users/@me', true, true, {
      email,
      password,
    });
    return data;
  }

  async setPassword(newPassword, password) {
    const data = await this.client.api.makeRequest('PATCH', 'users/@me', true, true, {
      newPassword,
      password,
    });
    return data;
  }
}

module.exports = ClientUser;
