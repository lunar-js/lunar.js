'use strict';

const Buffer = require('node:buffer').Buffer;
const json = require('json-bigint');

class Options extends null {
  static createDefault() {
    return {
      ws: {
        large_threshold: 50,
        compress: false,
        properties: {
          os: 'Windows',
          browser: 'Discord Client',
          device: '',
          os_version: '10',
          referrer: '',
          referrer_current: '',
          referring_domain: '',
          referring_domain_current: '',
          release_channel: 'stable',
          client_build_number: 127546,
          client_build_source: null,
        },
        capibilities: 4093,
        version: 9,
        client_state: {
          api_code_version: 0,
          guild_versions: {},
          highest_last_message_id: '0',
          read_state_version: 0,
          user_guild_settings_version: -1,
          user_settings_version: -1,
          private_channels_version: '0',
        },
      },
      http: {
        headers: {
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          'Sec-Ch-Ua': '"Not A;Brand";v="99", "Chromium";v="100", "Google Chrome";v="100',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'X-Debug-Options': 'bugReporterEnabled',
          'X-Super-Properties': `${Buffer.from(
            json.stringify({
              os: 'Windows',
              browser: 'Discord Client',
              release_channel: 'stable',
              client_version: '1.0.9004',
              os_version: '10.0.22000',
              os_arch: 'x64',
              system_locale: 'en-US',
              client_build_number: 127546,
              client_event_source: null,
            }),
            'ascii',
          ).toString('base64')}`,
          'X-Discord-Locale': 'en-US',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9004 Chrome/91.0.4472.164 Electron/13.6.6 Safari/537.36',
        },
        agent: {},
        version: 9,
        api: 'https://discord.com/api',
        cdn: 'https://cdn.discordapp.com',
      },
      restRequestTimeout: 15_000,
    };
  }
}

module.exports = Options;
