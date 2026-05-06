import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { HttpGatewayJsonRequestInput } from '../../http-gateway-request.types';

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

export type {
  HttpGatewayJsonRequestInput,
  HttpGatewayMethod,
} from '../../http-gateway-request.types';

/** OneLink：`fetch` + JSON，与电信网关对齐 `request()` 入参；默认 GET */
@Injectable()
export class ChinaMobileGatewayService {
  private readonly logger = new Logger(ChinaMobileGatewayService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * 将配置中的 OneLink base 与 path、query 组成完整 `url`（供 `request()` 使用）。
   */
  resolveOnelinkUrl(path: string, query?: Record<string, string>): string {
    const base = this.getOnelinkBaseUrl().replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    const q = query ?? {};
    const qs = new URLSearchParams(q).toString();
    return qs ? `${base}${p}?${qs}` : `${base}${p}`;
  }

  /**
   * OneLink JSON 调用：校验 HTTP 与业务 `status === "0"`。
   * GET/HEAD 不发送 body；其余方法在 `rawBody` 非空时带 body。
   */
  async request<T = unknown>(
    input: HttpGatewayJsonRequestInput,
  ): Promise<OneLinkBaseEnvelope<T>> {
    const method = input.method ?? 'GET';

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
      res = await fetch(input.url, {
        method,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        ...(sendsBody ? { body: input.rawBody as string } : {}),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `${input.operationLabel} 网络异常 method=${method} url=${input.url} message=${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new BadGatewayException(
        `${input.operationLabel} 失败（网络）：${message}`,
      );
    }
    const text = await res.text();
    let json: OneLinkBaseEnvelope<T>;
    try {
      json = JSON.parse(text) as OneLinkBaseEnvelope<T>;
    } catch {
      this.logger.error(
        `${input.operationLabel} 返回非 JSON: HTTP ${res.status}, body=${text.slice(0, 800)}`,
      );
      throw new BadGatewayException(
        `${input.operationLabel} 返回非 JSON（HTTP ${res.status}）：${text.slice(0, 200)}`,
      );
    }
    if (!res.ok) {
      this.logger.error(
        `${input.operationLabel} HTTP 错误: status=${res.status}, msg=${json.message ?? text.slice(0, 500)}`,
      );
      throw new BadGatewayException(
        `${input.operationLabel} HTTP ${res.status}：${json.message ?? text.slice(0, 200)}`,
      );
    }
    if (json.status !== '0') {
      this.logger.warn(
        `${input.operationLabel} 平台失败: status=${json.status}, msg=${json.message ?? ''}`,
      );
      throw new BadGatewayException(
        `${input.operationLabel} 失败 [${json.status}] ${json.message ?? ''}`.trim(),
      );
    }
    return json;
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
    const json = await this.request<Array<{ token?: string; ttl?: string }>>({
      url: this.resolveOnelinkUrl(ONELINK_GET_TOKEN_PATH, {
        appid,
        password,
        transid,
      }),
      operationLabel: 'OneLink 获取 token',
      method: 'GET',
    });
    const token = json.result?.[0]?.token?.trim();
    if (!token) {
      throw new BadGatewayException(
        'OneLink token 成功但 result[0].token 为空',
      );
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
      throw new InternalServerErrorException(
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
      throw new InternalServerErrorException(
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
      throw new InternalServerErrorException(
        `请配置 ${key}（OneLink 接入 password${sandbox ? '，沙箱' : ''}）`,
      );
    }
    return password;
  }
}
