import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

/** 天翼物联 5GCMP 统一 API 网关鉴权（文档 1.2.3 / 1.2.3.1） */
export type ChinaTelecomGatewayAuthHeaders = {
  AppKey: string;
  Sign: string;
  Timestamp: string;
};

const CONFIG_APP_KEY = 'TELECOM_CMP_APP_KEY';
const CONFIG_SECRET_KEY = 'TELECOM_CMP_SECRET_KEY';

@Injectable()
export class ChinaTelecomService {
  constructor(private readonly config: ConfigService) {}

  /**
   * 生成调用 `https://cmp-api.ctwing.cn:20164` 等网关接口时所需的鉴权请求头。
   * @param requestUrl 完整请求 URL（用于取出 query；与 body 拼接规则见官方「签名规则」）
   * @param rawBody 请求体原始字符串；GET 或无 body 传 `''` 或不传
   */
  createAuthHeaders(input: {
    requestUrl: string;
    rawBody?: string;
  }): ChinaTelecomGatewayAuthHeaders {
    const appKey = this.config.get<string>(CONFIG_APP_KEY);
    const secretKey = this.config.get<string>(CONFIG_SECRET_KEY);
    if (!appKey?.trim() || !secretKey?.trim()) {
      throw new Error(
        `请在环境变量中配置 ${CONFIG_APP_KEY} 与 ${CONFIG_SECRET_KEY}（5G 连接管理平台—能力开放—API 网关账号管理）`,
      );
    }
    const timestamp = this.formatGmtTimestamp();
    const sortedQuery = ChinaTelecomService.sortQueryString(
      ChinaTelecomService.extractQueryString(input.requestUrl),
    );
    const body = input.rawBody ?? '';
    const plain = `${sortedQuery}${body}${secretKey}${timestamp}`;
    return {
      AppKey: appKey,
      Sign: ChinaTelecomService.signMd5Gateway(plain),
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
      lowerHex += hexDigits[byte >>> 4 & 0xf];
      lowerHex += hexDigits[byte & 0xf];
    }
    return ChinaTelecomService.bytesToHex(Buffer.from(lowerHex, 'utf8')).toUpperCase();
  }

  private static bytesToHex(buf: Buffer): string {
    return [...buf].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /** GMT 时间戳，格式 `yyyyMMddHHmmss` */
  formatGmtTimestamp(date: Date = new Date()): string {
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
