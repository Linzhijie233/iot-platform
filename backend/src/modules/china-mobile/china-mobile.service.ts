import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'crypto';

/**
 * 中国移动 AIoT 开放 API 鉴权（文档「3.1 签名机制」）。
 * @see https://iot.10086.cn/doc/aiot/a/detail/3072
 */
export type ChinaMobileAiotSignInput = {
  /** host 之后、查询串之前的 Path，如 `/cmp/v1/ec/query-sim-status` */
  path: string;
  /**
   * 参与签名的查询参数（含公共参数 ak/timestamp/nonce 及业务 query）。
   * GET/DELETE 时公共参数建议放此对象；不传或 `{}` 时 pathParams 段为空字符串。
   */
  queryParams?: Record<string, string>;
  /**
   * 参与签名的 JSON 对象（紧凑序列化、键名升序）。
   * POST/PUT 时公共参数建议与此对象一并传入。
   * **不传**表示无 Body（第三段为空字符串）；传入 `{}` 则第三段为 `{}`。
   */
  bodyObject?: Record<string, unknown>;
};

const CONFIG_AK = 'MOBILE_AIOT_AK';
const CONFIG_SK = 'MOBILE_AIOT_SK';

@Injectable()
export class ChinaMobileService {
  constructor(private readonly config: ConfigService) {}

  /** 文档要求秒级时间戳字符串 */
  createTimestampSeconds(date: Date = new Date()): string {
    return String(Math.floor(date.getTime() / 1000));
  }

  /** 文档：不超过 40 位随机串；使用无连字符 UUID（32 字符） */
  createNonce(): string {
    return randomUUID().replace(/-/g, '');
  }

  /**
   * 使用环境变量中的 AK/SK 计算 `Authorization` 头完整取值：
   * `Bearer method=HmacSHA256&sign=<base64_signature>`
   */
  buildAuthorizationHeader(input: ChinaMobileAiotSignInput): string {
    const sk = this.config.get<string>(CONFIG_SK);
    if (!sk?.trim()) {
      throw new Error(
        `请在环境变量中配置 ${CONFIG_SK}（AIoT API AccessKey 对应密钥 secretKey）`,
      );
    }
    const sign = ChinaMobileService.signStringToSign(
      ChinaMobileService.buildStringToSign(input),
      sk.trim(),
    );
    return ChinaMobileService.formatAuthorizationHeader(sign);
  }

  /**
   * 生成文档要求的公共参数，便于调用方并入 query 或 body 后再签名。
   */
  createPublicParams(at: Date = new Date()): {
    ak: string;
    timestamp: string;
    nonce: string;
  } {
    const ak = this.config.get<string>(CONFIG_AK);
    if (!ak?.trim()) {
      throw new Error(`请在环境变量中配置 ${CONFIG_AK}（API 访问账号名 ak）`);
    }
    return {
      ak: ak.trim(),
      timestamp: this.createTimestampSeconds(at),
      nonce: this.createNonce(),
    };
  }

  static formatAuthorizationHeader(base64Signature: string): string {
    return `Bearer method=HmacSHA256&sign=${base64Signature}`;
  }

  static signStringToSign(stringToSign: string, secretKey: string): string {
    return createHmac('sha256', secretKey)
      .update(stringToSign, 'utf8')
      .digest('base64');
  }

  /**
   * stringToSign = path + '\\n' + pathParams + '\\n' + requestBody
   * pathParams：参数名升序，名称与值按 RFC3986 做百分号编码后 `k=v` 以 `&` 连接；无 query 时为 **空字符串**（文档 Python 示例）。
   * requestBody：application/json，参数名升序后紧凑 JSON；无 body 时为 **空字符串**。
   */
  static buildStringToSign(input: ChinaMobileAiotSignInput): string {
    const path = input.path?.trim();
    if (!path?.startsWith('/')) {
      throw new Error(`path 必须以 / 开头，收到: ${input.path}`);
    }
    const qs = ChinaMobileService.canonicalQueryString(input.queryParams ?? {});
    const body =
      input.bodyObject === undefined
        ? ''
        : ChinaMobileService.canonicalJsonBody(input.bodyObject);
    return `${path}\n${qs}\n${body}`;
  }

  /** 与文档 Python `urllib.parse.quote(s, safe='')` 对齐（除未保留字符外一律编码） */
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
      const encName = ChinaMobileService.rfc3986Quote(k);
      const encVal =
        rawKey !== undefined && rawKey !== ''
          ? ChinaMobileService.rfc3986Quote(String(rawKey))
          : '';
      parts.push(`${encName}=${encVal}`);
    }
    return parts.join('&');
  }

  /** 仅对第一层 key 排序；与文档示例 TreeMap + JSON 一致 */
  static canonicalJsonBody(obj: Record<string, unknown>): string {
    const sortedKeys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
    const sorted: Record<string, unknown> = {};
    for (const k of sortedKeys) {
      sorted[k] = obj[k];
    }
    return JSON.stringify(sorted);
  }
}
