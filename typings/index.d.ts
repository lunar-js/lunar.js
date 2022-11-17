import { Collection } from '@discordjs/collection';
import { Snowflake } from 'discord-api-types/v9';
import { EventEmitter } from 'node:events';
import * as WebSocket from 'ws';
import { NitroType } from './enums';

export interface ClientOptions {
  ws: {
    large_threshold: number;
    compress: boolean;
    properties: {
      os: string;
      browser: string;
      device: string;
      os_version: string;
      referrer: string;
      referrer_current: string;
      reffering_domain: string;
      referring_domain_current: string;
      release_channel: string;
      client_build_number: number;
      client_build_source: null | number;
    };
    compatibilities: number;
    version: number;
    client_state: {
      api_code_version: number;
      guild_versions: Object;
      highest_last_message_id: string;
      read_state_value: string;
      user_guild_settings_version: number;
      user_settings_version: number;
      private_channels_version: string;
    };
  };
  http: {
    headers: {
      Accept: string;
      'Accept-Language': string;
      'Cache-Control': string;
      Pragma: string;
      'Sec-Ch-Ua': string;
      'Sec-Ch-Ua-Mobile': string;
      'Sec-Ch-Ua-Platform': string;
      'Sec-Fetch-Dest': string;
      'Sec-Fetch-Mode': string;
      'Sec-Fetch-Site': string;
      'X-Debug-Options': string;
      'X-Super-Properties': string;
      'X-Discord-Locale': string;
      'User-Agent': string;
    };
    agent: Object;
    version: number;
    api: string;
    cdn: string;
  };
  restRequestTimeout: number;
}

interface RequestOptions {
  reason?: string;
  files?: Array<{ file: any; key: string; name: string }>;
  data?: Object;
  body?: Object;
  dontUsePayloadJSON?: boolean;
}

export class Gateway extends WebSocket {
  public constructor(client: Client, phone: boolean);
  public options: ClientOptions;
  public sequence: number;
  public sessionId: null | string;
  public connectedAt: number;
  public closeSequence: number;
  public helloTimeout: null | number;
  public wsping: number;
  public lastPingTimestamp: number;
  public lastHeartbeatAcked: boolean;

  public onOpen(): void;
  public onMessage({ data }): void;
  public onPacket(packet: Object): void;
  public sendOpcode(code: number, data: Object): void;
  public identify(): void;
  public identifyNew(): void;
  public identifyResume(): void;
  public setHelloTimeout(time: number): void;
  public setHeartbeatTimer(time: number): void;
  public sendHeartbeat(tag: string, ignoreHeartbeatAck: boolean): void;
  public ackHeartbeat(): void;
  public debug(text: string): void;
  public destroy({ closeCode: number, reset: boolean }): void;
}

export class RestWrapper {
  public constructor(client: Client);
  public get auth(): string;
  public makeRequest(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    path: string,
    auth?: boolean,
    versioned?: string,
    options?: RequestOptions,
  ): Promise<Object>;
}

export class Client extends EventEmitter {
  public constructor(token: string, phone?: boolean);
  public options: ClientOptions;
  public token: string;
  public api: RestWrapper;
  public ws: Gateway;
  public user: ClientUser;
}

export class ClientUser {
  constructor(client: Client, data: Object);
  public verified: boolean;
  public mfaEnabled?: boolean;
  public nitroType: NitroType;
  public purchasedFlags: string;
  public phoneNumber: string;
  public nsfwAllowed: boolean;
  public emailAddress: string;
  public bio: string;
  public friendNicknames: Collection<Snowflake, string>;
  public notes: Collection<Snowflake, string>;
  public getRelationships(): Promise<Object>;
  public getGuildAffinities(): Promise<Object[]>;
  public getMentions(limit: number, roleMentions: boolean, everyoneMentions: boolean): Promise<Object>;
  public removeMention(messageID: Snowflake): Promise<Object>;
  public getStickers(): Promise<Object>;
  public setEmail(email: string, password: string): Promise<Object>;
  public setPassword(newPassword: string, password: string): Promise<Object>;
}
