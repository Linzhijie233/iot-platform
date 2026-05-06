import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'crypto';

/**
 * 中国移动 AIoT 开放 API 鉴权（文档「3.1 签名机制」）。
 * @see https://iot.10086.cn/doc/aiot/a/detail/3072
 */
export type ChinaMobileAiotSignInput = {
  path: string;
  queryParams?: Record<string, string>;
  bodyObject?: Record<string, unknown>;
};

export const MOBILE_AIOT_AK_ENV = 'MOBILE_AIOT_AK';
export const MOBILE_AIOT_SK_ENV = 'MOBILE_AIOT_SK';

export const MOBILE_ONELINK_USE_SANDBOX_ENV = 'MOBILE_ONELINK_USE_SANDBOX';

export const MOBILE_ONELINK_BASE_URL_ENV = 'MOBILE_ONELINK_BASE_URL';
export const DEFAULT_ONELINK_BASE_URL = 'https://api.iot.10086.cn';

export const MOBILE_ONELINK_APPID_ENV = 'MOBILE_ONELINK_APPID';
export const MOBILE_ONELINK_PASSWORD_ENV = 'MOBILE_ONELINK_PASSWORD';

export const MOBILE_ONELINK_SANDBOX_BASE_URL_ENV =
  'MOBILE_ONELINK_SANDBOX_BASE_URL';
export const MOBILE_ONELINK_SANDBOX_APPID_ENV = 'MOBILE_ONELINK_SANDBOX_APPID';
export const MOBILE_ONELINK_SANDBOX_PASSWORD_ENV =
  'MOBILE_ONELINK_SANDBOX_PASSWORD';

export const ONELINK_GET_TOKEN_PATH = '/v5/ec/get/token';

export const BATCH_QUERY_SIM_CARD_INFO_PATH =
  '/v5/ec/query/sim-card-info/batch';

export const BATCH_SIM_CARD_MAX_COUNT = 100;

export type OneLinkBaseEnvelope<T = unknown> = {
  status: string;
  message: string;
  result?: T;
};

/** AIoT HMAC + OneLink 网关 GET（无 Bearer，query 明文） */
@Injectable()
export class ChinaMobileV2GatewayService {
  private readonly logger = new Logger(ChinaMobileV2GatewayService.name);

  constructor(private readonly config: ConfigService) {}

  createTimestampSeconds(date: Date = new Date()): string {
    return String(Math.floor(date.getTime() / 1000));
  }

  createNonce(): string {
    return randomUUID().replace(/-/g, '');
  }

  buildAuthorizationHeader(input: ChinaMobileAiotSignInput): string {
    const sk = this.config.get<string>(MOBILE_AIOT_SK_ENV);
    if (!sk?.trim()) {
      throw new Error(
        `请在环境变量中配置 ${MOBILE_AIOT_SK_ENV}（AIoT API AccessKey 对应密钥 secretKey）`,
      );
    }
    const sign = ChinaMobileV2GatewayService.signStringToSign(
      ChinaMobileV2GatewayService.buildStringToSign(input),
      sk.trim(),
    );
    return ChinaMobileV2GatewayService.formatAuthorizationHeader(sign);
  }

  createPublicParams(at: Date = new Date()): {
    ak: string;
    timestamp: string;
    nonce: string;
  } {
    const ak = this.config.get<string>(MOBILE_AIOT_AK_ENV);
    if (!ak?.trim()) {
      throw new Error(
        `请在环境变量中配置 ${MOBILE_AIOT_AK_ENV}（API 访问账号名 ak）`,
      );
    }
    return {
      ak: ak.trim(),
      timestamp: this.createTimestampSeconds(at),
      nonce: this.createNonce(),
    };
  }

  /**
   * OneLink GET：组 URL、`fetch`、解析 JSON，校验 HTTP 与 `status === "0"`。
   */
  async onelinkGetJson<T = unknown>(
    path: string,
    query: Record<string, string>,
    operationLabel: string,
  ): Promise<OneLinkBaseEnvelope<T>> {
    const base = this.getOnelinkBaseUrl();
    const url = `${base}${path}?${new URLSearchParams(query)}`;
    let res: Response;
    try {
      res = await fetch(url, { method: 'GET' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `${operationLabel} 网络异常 url=${url} message=${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new Error(`${operationLabel} 失败（网络）：${message}`);
    }
    const text = await res.text();
    let json: OneLinkBaseEnvelope<T>;
    try {
      json = JSON.parse(text) as OneLinkBaseEnvelope<T>;
    } catch {
      this.logger.error(
        `${operationLabel} 返回非 JSON: HTTP ${res.status}, body=${text.slice(0, 800)}`,
      );
      throw new Error(
        `${operationLabel} 返回非 JSON（HTTP ${res.status}）：${text.slice(0, 200)}`,
      );
    }
    if (!res.ok) {
      this.logger.error(
        `${operationLabel} HTTP 错误: status=${res.status}, msg=${json.message ?? text.slice(0, 500)}`,
      );
      throw new Error(
        `${operationLabel} HTTP ${res.status}：${json.message ?? text.slice(0, 200)}`,
      );
    }
    if (json.status !== '0') {
      this.logger.warn(
        `${operationLabel} 平台失败: status=${json.status}, msg=${json.message ?? ''}`,
      );
      throw new Error(
        `${operationLabel} 失败 [${json.status}] ${json.message ?? ''}`.trim(),
      );
    }
    return json;
  }

  buildOneLinkTransId(at: Date): string {
    return ChinaMobileV2GatewayService.makeOneLinkTransId(
      this.getOnelinkAppid(),
      at,
    );
  }

  async fetchOnelinkToken(at: Date): Promise<string> {
    const appid = this.getOnelinkAppid();
    const password = this.getOnelinkPassword();
    const transid = ChinaMobileV2GatewayService.makeOneLinkTransId(appid, at);
    const json = await this.onelinkGetJson<
      Array<{ token?: string; ttl?: string }>
    >(
      ONELINK_GET_TOKEN_PATH,
      { appid, password, transid },
      'OneLink 获取 token',
    );
    const token = json.result?.[0]?.token?.trim();
    if (!token) {
      throw new Error('OneLink token 成功但 result[0].token 为空');
    }
    return token;
  }

  static formatAuthorizationHeader(base64Signature: string): string {
    return `Bearer method=HmacSHA256&sign=${base64Signature}`;
  }

  static signStringToSign(stringToSign: string, secretKey: string): string {
    return createHmac('sha256', secretKey)
      .update(stringToSign, 'utf8')
      .digest('base64');
  }

  static buildStringToSign(input: ChinaMobileAiotSignInput): string {
    const path = input.path?.trim();
    if (!path?.startsWith('/')) {
      throw new Error(`path 必须以 / 开头，收到: ${input.path}`);
    }
    const qs = ChinaMobileV2GatewayService.canonicalQueryString(
      input.queryParams ?? {},
    );
    const body =
      input.bodyObject === undefined
        ? ''
        : ChinaMobileV2GatewayService.canonicalJsonBody(input.bodyObject);
    return `${path}\n${qs}\n${body}`;
  }

  static rfc3986Quote(component: string): string {
    let out = '';
    for (const ch of component) {
      const c = ch.charCodeAt(0);
      const unreserved =
        (c >= 0x41 && c <= 0x5a) ||
        (c >= 0x61 && c <= 0x7a) ||
        (c >= 0x30 && c <= 0x39) ||
        ch === '-' ||
        ch === '_' ||
        ch === '.' ||
        ch === '~';
      if (unreserved) {
        out += ch;
      } else {
        out += encodeURIComponent(ch);
      }
    }
    return out;
  }

  static canonicalQueryString(params: Record<string, string>): string {
    const keys = Object.keys(params).sort((a, b) => a.localeCompare(b));
    const parts: string[] = [];
    for (const k of keys) {
      const rawKey = params[k];
      const encName = ChinaMobileV2GatewayService.rfc3986Quote(k);
      const encVal =
        rawKey !== undefined && rawKey !== ''
          ? ChinaMobileV2GatewayService.rfc3986Quote(String(rawKey))
          : '';
      parts.push(`${encName}=${encVal}`);
    }
    return parts.join('&');
  }

  static canonicalJsonBody(obj: Record<string, unknown>): string {
    const sortedKeys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
    const sorted: Record<string, unknown> = {};
    for (const k of sortedKeys) {
      sorted[k] = obj[k];
    }
    return JSON.stringify(sorted);
  }

  private static makeOneLinkTransId(appid: string, at: Date): string {
    const pad = (n: number, w: number) => String(n).padStart(w, '0');
    const s = at.toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
    const [datePart, timePart] = s.split(' ');
    const [y, mo, d] = datePart.split('-');
    const [hh, mm, ss] = timePart.split(':');
    const ts = `${y}${mo}${d}${hh}${mm}${ss}`;
    const seq = pad(Math.floor(Math.random() * 1e8), 8);
    return `${appid}${ts}${seq}`;
  }

  private isOnelinkSandbox(): boolean {
    const raw = this.config
      .get<string>(MOBILE_ONELINK_USE_SANDBOX_ENV)
      ?.trim()
      .toLowerCase();
    return raw === '1' || raw === 'true' || raw === 'yes';
  }

  private getOnelinkBaseUrl(): string {
    if (this.isOnelinkSandbox()) {
      const raw = this.config
        .get<string>(MOBILE_ONELINK_SANDBOX_BASE_URL_ENV)
        ?.trim();
      if (raw) return raw;
      throw new Error(
        `已启用 OneLink 沙箱（${MOBILE_ONELINK_USE_SANDBOX_ENV}=true），请配置 ${MOBILE_ONELINK_SANDBOX_BASE_URL_ENV}`,
      );
    }
    const raw = this.config.get<string>(MOBILE_ONELINK_BASE_URL_ENV)?.trim();
    return raw || DEFAULT_ONELINK_BASE_URL;
  }

  private getOnelinkAppid(): string {
    const sandbox = this.isOnelinkSandbox();
    const key = sandbox
      ? MOBILE_ONELINK_SANDBOX_APPID_ENV
      : MOBILE_ONELINK_APPID_ENV;
    const appid = this.config.get<string>(key)?.trim();
    if (!appid) {
      throw new Error(
        `请配置 ${key}（OneLink 接入 appid${sandbox ? '，沙箱' : ''}）`,
      );
    }
    return appid;
  }

  private getOnelinkPassword(): string {
    const sandbox = this.isOnelinkSandbox();
    const key = sandbox
      ? MOBILE_ONELINK_SANDBOX_PASSWORD_ENV
      : MOBILE_ONELINK_PASSWORD_ENV;
    const password = this.config.get<string>(key)?.trim();
    if (!password) {
      throw new Error(
        `请配置 ${key}（OneLink 接入 password${sandbox ? '，沙箱' : ''}）`,
      );
    }
    return password;
  }
}
