import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

export type ChinaMobileOneLinkHttpMethod =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE';

/** OneLink 网关：`fetch` + JSON 响应，支持多 HTTP 方法 */
@Injectable()
export class ChinaMobileGatewayService {
  private readonly logger = new Logger(ChinaMobileGatewayService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * OneLink 调用：组 URL（可选 query）、`fetch`、解析 JSON，校验 HTTP 与 `status === "0"`。
   * GET/HEAD **不发送 body**；其余方法在 `rawBody` 非空时带 body，默认 `Content-Type: application/json;charset=utf-8`。
   */
  async onelinkRequestJson<T = unknown>(input: {
    path: string;
    operationLabel: string;
    method?: ChinaMobileOneLinkHttpMethod;
    query?: Record<string, string>;
    rawBody?: string;
    contentType?: string | false;
    extraHeaders?: Record<string, string>;
  }): Promise<OneLinkBaseEnvelope<T>> {
    const method = input.method ?? 'GET';
    const base = this.getOnelinkBaseUrl();
    const q = input.query ?? {};
    const qs = new URLSearchParams(q).toString();
    const url = qs ? `${base}${input.path}?${qs}` : `${base}${input.path}`;

    const headers: Record<string, string> = {
      ...(input.extraHeaders ?? {}),
    };
    const sendsBody =
      (input.rawBody ?? '') !== '' && method !== 'GET' && method !== 'HEAD';
    if (
      sendsBody &&
      input.contentType !== false &&
      headers['Content-Type'] === undefined
    ) {
      headers['Content-Type'] =
        input.contentType ?? 'application/json;charset=utf-8';
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        ...(sendsBody ? { body: input.rawBody as string } : {}),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `${input.operationLabel} 网络异常 method=${method} url=${url} message=${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new Error(`${input.operationLabel} 失败（网络）：${message}`);
    }
    const text = await res.text();
    let json: OneLinkBaseEnvelope<T>;
    try {
      json = JSON.parse(text) as OneLinkBaseEnvelope<T>;
    } catch {
      this.logger.error(
        `${input.operationLabel} 返回非 JSON: HTTP ${res.status}, body=${text.slice(0, 800)}`,
      );
      throw new Error(
        `${input.operationLabel} 返回非 JSON（HTTP ${res.status}）：${text.slice(0, 200)}`,
      );
    }
    if (!res.ok) {
      this.logger.error(
        `${input.operationLabel} HTTP 错误: status=${res.status}, msg=${json.message ?? text.slice(0, 500)}`,
      );
      throw new Error(
        `${input.operationLabel} HTTP ${res.status}：${json.message ?? text.slice(0, 200)}`,
      );
    }
    if (json.status !== '0') {
      this.logger.warn(
        `${input.operationLabel} 平台失败: status=${json.status}, msg=${json.message ?? ''}`,
      );
      throw new Error(
        `${input.operationLabel} 失败 [${json.status}] ${json.message ?? ''}`.trim(),
      );
    }
    return json;
  }

  /** GET + query，等价于 `onelinkRequestJson({ method: 'GET', ... })`。 */
  async onelinkGetJson<T = unknown>(
    path: string,
    query: Record<string, string>,
    operationLabel: string,
  ): Promise<OneLinkBaseEnvelope<T>> {
    return this.onelinkRequestJson<T>({
      path,
      query,
      operationLabel,
      method: 'GET',
    });
  }

  buildOneLinkTransId(at: Date): string {
    return ChinaMobileGatewayService.makeOneLinkTransId(
      this.getOnelinkAppid(),
      at,
    );
  }

  async fetchOnelinkToken(at: Date): Promise<string> {
    const appid = this.getOnelinkAppid();
    const password = this.getOnelinkPassword();
    const transid = ChinaMobileGatewayService.makeOneLinkTransId(appid, at);
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
