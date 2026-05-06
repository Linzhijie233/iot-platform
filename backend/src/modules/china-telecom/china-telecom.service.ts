import { Injectable, Logger } from '@nestjs/common';
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

/** 可选，默认 `https://cmp-api.ctwing.cn:20164`（《电信.pdf》2.1.18） */
const CONFIG_CMP_BASE_URL = 'TELECOM_CMP_BASE_URL';
const DEFAULT_CMP_BASE_URL = 'https://cmp-api.ctwing.cn:20164';

/**
 * CTIOT_5GCMP_BQ018 批量 SIM 卡资料查询
 * @see `/api/v1/prod/batchQrySimInfo`
 */
export const BATCH_QRY_SIM_INFO_PATH = '/api/v1/prod/batchQrySimInfo';

/** 文档：一次最多 100 张 */
export const BATCH_QRY_SIM_INFO_MAX_ACCESS_NUMBERS = 100;

export type BatchQrySimInfoParams = {
  custNumber: string;
  /** 接入号码列表（MSISDN 等），单次 1～100 条 */
  accessNumbers: string[];
  groupId?: string;
  /** 1-可激活 … 6-运营商管理状态；不传则按文档示例送空串 */
  simStatus?: string;
};

/** 响应 data.qrySimInfoList 单项（字段以线上为准，此处为文档常见项） */
export type QrySimInfoItem = Record<string, string | undefined>;

type BatchQrySimInfoApiResponse = {
  code?: string | number;
  message?: string;
  msg?: string;
  data?: {
    qrySimInfoList?: QrySimInfoItem[];
  };
};

@Injectable()
export class ChinaTelecomService {
  private readonly logger = new Logger(ChinaTelecomService.name);

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
      lowerHex += hexDigits[(byte >>> 4) & 0xf];
      lowerHex += hexDigits[byte & 0xf];
    }
    return ChinaTelecomService.bytesToHex(
      Buffer.from(lowerHex, 'utf8'),
    ).toUpperCase();
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

  private getCmpBaseUrl(): string {
    const raw = this.config.get<string>(CONFIG_CMP_BASE_URL)?.trim();
    return raw || DEFAULT_CMP_BASE_URL;
  }

  /**
   * CTIOT_5GCMP_BQ018 批量 SIM 卡资料查询（POST JSON + 网关 AppKey/Sign/Timestamp）
   */
  async batchQrySimInfo(params: BatchQrySimInfoParams): Promise<{
    code: string;
    message: string;
    list: QrySimInfoItem[];
  }> {
    const custNumber = params.custNumber?.trim();
    if (!custNumber) {
      throw new Error('batchQrySimInfo 需提供 custNumber（客户编码）');
    }
    const nums = params.accessNumbers
      .map((s) => String(s).trim())
      .filter(Boolean);
    if (nums.length === 0) {
      throw new Error('batchQrySimInfo 需提供至少一个 accessNumbers');
    }
    if (nums.length > BATCH_QRY_SIM_INFO_MAX_ACCESS_NUMBERS) {
      throw new Error(
        `batchQrySimInfo 单次最多 ${BATCH_QRY_SIM_INFO_MAX_ACCESS_NUMBERS} 个接入号，当前 ${nums.length}`,
      );
    }

    const bodyObject: Record<string, unknown> = {
      accessNumbers: nums,
      custNumber,
      groupId: params.groupId?.trim() ?? '',
      simStatus: params.simStatus?.trim() ?? '',
    };
    const rawBody = JSON.stringify(bodyObject);
    const base = this.getCmpBaseUrl().replace(/\/+$/, '');
    const requestUrl = `${base}${BATCH_QRY_SIM_INFO_PATH}`;
    const auth = this.createAuthHeaders({ requestUrl, rawBody });

    let res: Response;
    try {
      res = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          AppKey: auth.AppKey,
          Sign: auth.Sign,
          Timestamp: auth.Timestamp,
        },
        body: rawBody,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `batchQrySimInfo 网络异常 url=${requestUrl} message=${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new Error(`batchQrySimInfo 请求失败（网络）：${message}`);
    }

    const text = await res.text();
    let json: BatchQrySimInfoApiResponse;
    try {
      json = JSON.parse(text) as BatchQrySimInfoApiResponse;
    } catch {
      this.logger.error(
        `batchQrySimInfo 返回非 JSON: HTTP ${res.status}, body=${text.slice(0, 800)}`,
      );
      throw new Error(
        `batchQrySimInfo 返回非 JSON（HTTP ${res.status}）：${text.slice(0, 200)}`,
      );
    }

    const msg = json.message ?? json.msg ?? '';
    if (!res.ok) {
      this.logger.error(
        `batchQrySimInfo HTTP 错误: status=${res.status}, code=${json.code}, message=${msg || text.slice(0, 400)}`,
      );
      throw new Error(
        `batchQrySimInfo HTTP ${res.status}：${msg || text.slice(0, 200)}`,
      );
    }

    const codeStr =
      json.code !== undefined && json.code !== null ? String(json.code) : '';
    if (codeStr !== '0') {
      this.logger.warn(
        `batchQrySimInfo 业务非成功: code=${codeStr}, message=${msg}`,
      );
      throw new Error(`batchQrySimInfo 失败 [${codeStr}] ${msg}`.trim());
    }

    const rawList = json.data?.qrySimInfoList;
    const list = Array.isArray(rawList) ? rawList : [];

    return {
      code: codeStr,
      message: msg,
      list,
    };
  }
}
