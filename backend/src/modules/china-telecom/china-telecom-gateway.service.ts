import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

/** 天翼物联 5GCMP 统一 API 网关鉴权请求头（文档 1.2.3 / 1.2.3.1） */
export type ChinaTelecomGatewayHeaders = {
  AppKey: string;
  Sign: string;
  Timestamp: string;
};

/** `ConfigService.get` / 环境变量名 */
export const TELECOM_CMP_APP_KEY_ENV = 'TELECOM_CMP_APP_KEY';
/** `ConfigService.get` / 环境变量名 */
export const TELECOM_CMP_SECRET_KEY_ENV = 'TELECOM_CMP_SECRET_KEY';

/** 电信 CMP HTTP 网关支持的调用方式（按文档通常为 POST JSON；少数接口可能为 GET 等） */
export type ChinaTelecomGatewayHttpMethod =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE';

/** 电信 CMP HTTP 网关：签名、鉴权请求、统一错误处理 */
@Injectable()
export class ChinaTelecomGatewayService {
  private readonly logger = new Logger(ChinaTelecomGatewayService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * 带网关签名的 JSON 调用：可指定 HTTP 方法，统一处理网络异常、非 JSON、HTTP 非 2xx。
   * 签名仍为「排序后的 query + rawBody + secret + timestamp」（GET/HEAD 请传 `rawBody: ''`）。
   */
  async requestJsonAuthenticated<T = unknown>(input: {
    requestUrl: string;
    /** 日志与错误信息前缀，如 batchQrySimInfo */
    operationLabel: string;
    method?: ChinaTelecomGatewayHttpMethod;
    /** 参与签名的正文；GET/HEAD 一般为 `''`。有内容时仅在非 GET/HEAD 时作为 fetch body 发送 */
    rawBody?: string;
    /**
     * 有 body 时默认 `application/json;charset=utf-8`；
     * 传 `false` 表示不设置 Content-Type（罕见接口需要时再用）
     */
    contentType?: string | false;
    /** 附加请求头（不要覆盖 AppKey/Sign/Timestamp） */
    extraHeaders?: Record<string, string>;
  }): Promise<T> {
    const method = input.method ?? 'POST';
    const rawBody = input.rawBody ?? '';
    const auth = this.createAuthHeaders({
      requestUrl: input.requestUrl,
      rawBody,
    });

    const headers: Record<string, string> = {
      ...(input.extraHeaders ?? {}),
      AppKey: auth.AppKey,
      Sign: auth.Sign,
      Timestamp: auth.Timestamp,
    };

    const sendsBody = rawBody !== '' && method !== 'GET' && method !== 'HEAD';
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
      res = await fetch(input.requestUrl, {
        method,
        headers,
        ...(sendsBody ? { body: rawBody } : {}),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `${input.operationLabel} 网络异常 method=${method} url=${input.requestUrl} message=${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new Error(`${input.operationLabel} 请求失败（网络）：${message}`);
    }

    const text = await res.text();
    let json: T;
    try {
      json = JSON.parse(text) as T;
    } catch {
      this.logger.error(
        `${input.operationLabel} 返回非 JSON: HTTP ${res.status}, body=${text.slice(0, 800)}`,
      );
      throw new Error(
        `${input.operationLabel} 返回非 JSON（HTTP ${res.status}）：${text.slice(0, 200)}`,
      );
    }

    const envelope = json as { code?: unknown; message?: string; msg?: string };
    const msg = envelope.message ?? envelope.msg ?? '';
    const codeForLog = (() => {
      const c = envelope.code;
      if (c === undefined || c === null) return '';
      if (typeof c === 'string') return c;
      if (
        typeof c === 'number' ||
        typeof c === 'boolean' ||
        typeof c === 'bigint'
      )
        return String(c);
      return JSON.stringify(c);
    })();
    if (!res.ok) {
      this.logger.error(
        `${input.operationLabel} HTTP 错误: status=${res.status}, code=${codeForLog}, message=${msg || text.slice(0, 400)}`,
      );
      throw new Error(
        `${input.operationLabel} HTTP ${res.status}：${msg || text.slice(0, 200)}`,
      );
    }

    return json;
  }

  /** POST JSON，`rawBody` 参与签名并列在请求体（最常用）。 */
  postJsonAuthenticated<T = unknown>(input: {
    requestUrl: string;
    rawBody: string;
    operationLabel: string;
    contentType?: string | false;
    extraHeaders?: Record<string, string>;
  }): Promise<T> {
    return this.requestJsonAuthenticated<T>({
      ...input,
      method: 'POST',
    });
  }

  /**
   * 生成调用网关接口时所需的鉴权请求头。
   * @param requestUrl 完整请求 URL（用于取出 query；与 body 拼接规则见官方「签名规则」）
   * @param rawBody 请求体原始字符串；GET 或无 body 传 `''` 或不传
   */
  createAuthHeaders(input: {
    requestUrl: string;
    rawBody?: string;
  }): ChinaTelecomGatewayHeaders {
    const appKey = this.config.get<string>(TELECOM_CMP_APP_KEY_ENV);
    const secretKey = this.config.get<string>(TELECOM_CMP_SECRET_KEY_ENV);
    if (!appKey?.trim() || !secretKey?.trim()) {
      throw new Error(
        `请在环境变量中配置 ${TELECOM_CMP_APP_KEY_ENV} 与 ${TELECOM_CMP_SECRET_KEY_ENV}（5G 连接管理平台—能力开放—API 网关账号管理）`,
      );
    }
    const timestamp = this.formatGmtTimestamp();
    const sortedQuery = ChinaTelecomGatewayService.sortQueryString(
      ChinaTelecomGatewayService.extractQueryString(input.requestUrl),
    );
    const body = input.rawBody ?? '';
    const plain = `${sortedQuery}${body}${secretKey}${timestamp}`;
    return {
      AppKey: appKey,
      Sign: ChinaTelecomGatewayService.signMd5Gateway(plain),
      Timestamp: timestamp,
    };
  }

  /** 将 URL 中的 query 段（不含 `?`）按 key 字典序重排为 `a=1&b=2` 形式 */
  static sortQueryString(queryWithoutQuestionMark: string): string {
    const raw = queryWithoutQuestionMark?.trim() ?? '';
    if (!raw) return '';

    const pairs: Array<[string, string]> = [];
    for (const segment of raw.split('&')) {
      if (segment === '') continue;
      const eq = segment.indexOf('=');
      if (eq === -1) {
        throw new Error('URL 参数不规范：缺少 =');
      }
      pairs.push([segment.slice(0, eq), segment.slice(eq + 1)]);
    }
    pairs.sort((a, b) => a[0].localeCompare(b[0]));
    return pairs.map(([k, v]) => `${k}=${v}`).join('&');
  }

  /**
   * 网关 Sign 算法：MD5(plain) → 小写十六进制字符串 → UTF-8 字节 → 再十六进制编码 → 大写
   *（与文档 Java `SignUtil.signMD5` 一致）
   */
  static signMd5Gateway(plain: string): string {
    const md = createHash('md5').update(plain, 'utf8').digest();
    const hexDigits = '0123456789abcdef';
    let lowerHex = '';
    for (const byte of md) {
      lowerHex += hexDigits[(byte >>> 4) & 0xf];
      lowerHex += hexDigits[byte & 0xf];
    }
    return ChinaTelecomGatewayService.bytesToHex(
      Buffer.from(lowerHex, 'utf8'),
    ).toUpperCase();
  }

  private static bytesToHex(buf: Buffer): string {
    return [...buf].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /** GMT 时间戳，格式 `yyyyMMddHHmmss` */
  private formatGmtTimestamp(date: Date = new Date()): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const h = String(date.getUTCHours()).padStart(2, '0');
    const min = String(date.getUTCMinutes()).padStart(2, '0');
    const s = String(date.getUTCSeconds()).padStart(2, '0');
    return `${y}${m}${d}${h}${min}${s}`;
  }

  private static extractQueryString(requestUrl: string): string {
    let url: URL;
    try {
      url = new URL(requestUrl);
    } catch {
      throw new Error(`无效的 requestUrl: ${requestUrl}`);
    }
    const q = url.search;
    return q.startsWith('?') ? q.slice(1) : q;
  }
}
