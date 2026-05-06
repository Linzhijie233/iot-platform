import { Injectable, Logger } from '@nestjs/common';
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

/** 《移动.pdf》OneLink 能力：默认 `https://api.iot.10086.cn` */
const CONFIG_ONELINK_BASE_URL = 'MOBILE_ONELINK_BASE_URL';
const DEFAULT_ONELINK_BASE_URL = 'https://api.iot.10086.cn';

/** 连接管理平台「客户信息 → 接入信息」中的 appid / password（非 AIoT HMAC 的 AK/SK） */
const CONFIG_ONELINK_APPID = 'MOBILE_ONELINK_APPID';
const CONFIG_ONELINK_PASSWORD = 'MOBILE_ONELINK_PASSWORD';

/** 文档 4.1.1：获取 token */
export const ONELINK_GET_TOKEN_PATH = '/v5/ec/get/token';

/**
 * 文档 5.1.7 CMIOT_API25S05：`GET .../v5/ec/query/sim-card-info/batch`（transid、token、msisdns|iccids|imsis）
 */
export const BATCH_QUERY_SIM_CARD_INFO_PATH =
  '/v5/ec/query/sim-card-info/batch';

const BATCH_SIM_CARD_MAX_COUNT = 100;

export type BatchQuerySimCardInfoParams = {
  /**
   * 《移动.pdf》5.1.7：msisdns、iccids、imsis（本字段对应 IMSI 列表）必须有且仅填一类。
   * 支持英文逗号分隔，将转换为平台要求的下划线分隔。
   */
  msisdns?: string;
  iccids?: string;
  imeis?: string;
};

export type SimCardInfoBatchItem = {
  status: string;
  message: string;
  msisdn?: string;
  iccid?: string;
  /** 《移动.pdf》应答字段为 imsi；与 DTO 中 imeis 入参含义一致（国际移动用户识别码） */
  imsi?: string;
  imei?: string;
};

type OneLinkTokenEnvelope = {
  status: string;
  message: string;
  result?: Array<{ token?: string; ttl?: string }>;
};

type OneLinkBatchSimCardRow = {
  status: string;
  message: string;
  imsi?: string;
  msisdn?: string;
  iccid?: string;
};

type OneLinkBatchSimCardEnvelope = {
  status: string;
  message: string;
  result?: OneLinkBatchSimCardRow[];
};

@Injectable()
export class ChinaMobileV2Service {
  private readonly logger = new Logger(ChinaMobileV2Service.name);

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
    const sign = ChinaMobileV2Service.signStringToSign(
      ChinaMobileV2Service.buildStringToSign(input),
      sk.trim(),
    );
    return ChinaMobileV2Service.formatAuthorizationHeader(sign);
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
    const qs = ChinaMobileV2Service.canonicalQueryString(
      input.queryParams ?? {},
    );
    const body =
      input.bodyObject === undefined
        ? ''
        : ChinaMobileV2Service.canonicalJsonBody(input.bodyObject);
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
      const encName = ChinaMobileV2Service.rfc3986Quote(k);
      const encVal =
        rawKey !== undefined && rawKey !== ''
          ? ChinaMobileV2Service.rfc3986Quote(String(rawKey))
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

  private getOnelinkBaseUrl(): string {
    const raw = this.config.get<string>(CONFIG_ONELINK_BASE_URL)?.trim();
    return raw || DEFAULT_ONELINK_BASE_URL;
  }

  /** 文档：APPID + YYYYMMDDHHMISS（中国时区）+ 8 位流水 */
  private static buildOneLinkTransId(appid: string, at: Date): string {
    const pad = (n: number, w: number) => String(n).padStart(w, '0');
    const s = at.toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
    const [datePart, timePart] = s.split(' ');
    const [y, mo, d] = datePart.split('-');
    const [hh, mm, ss] = timePart.split(':');
    const ts = `${y}${mo}${d}${hh}${mm}${ss}`;
    const seq = pad(Math.floor(Math.random() * 1e8), 8);
    return `${appid}${ts}${seq}`;
  }

  private static parseList(raw: string | undefined): string[] {
    if (!raw?.trim()) return [];
    return raw
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /** 《移动.pdf》批量码号用下划线拼接 */
  private static toOnelinkBatchParam(values: string[]): string {
    return values.join('_');
  }

  private async fetchOnelinkToken(at: Date): Promise<string> {
    const appid = this.config.get<string>(CONFIG_ONELINK_APPID)?.trim();
    const password = this.config.get<string>(CONFIG_ONELINK_PASSWORD)?.trim();
    if (!appid) {
      throw new Error(`请配置 ${CONFIG_ONELINK_APPID}（OneLink 接入 appid）`);
    }
    if (!password) {
      throw new Error(
        `请配置 ${CONFIG_ONELINK_PASSWORD}（OneLink 接入 password）`,
      );
    }
    const transid = ChinaMobileV2Service.buildOneLinkTransId(appid, at);
    const base = this.getOnelinkBaseUrl();
    const q = new URLSearchParams({
      appid,
      password,
      transid,
    });
    const url = `${base}${ONELINK_GET_TOKEN_PATH}?${q}`;
    let res: Response;
    try {
      res = await fetch(url, { method: 'GET' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `OneLink 获取 token 网络异常 url=${url} message=${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new Error(`OneLink 获取 token 失败（网络）：${message}`);
    }
    const text = await res.text();
    let json: OneLinkTokenEnvelope;
    try {
      json = JSON.parse(text) as OneLinkTokenEnvelope;
    } catch {
      this.logger.error(
        `OneLink token 接口返回非 JSON: HTTP ${res.status}, body=${text.slice(0, 500)}`,
      );
      throw new Error(`OneLink token 接口返回非 JSON（HTTP ${res.status}）`);
    }
    if (!res.ok) {
      throw new Error(
        `OneLink token HTTP ${res.status}：${json.message ?? text.slice(0, 200)}`,
      );
    }
    if (json.status !== '0') {
      throw new Error(
        `OneLink token 失败 [${json.status}] ${json.message ?? ''}`.trim(),
      );
    }
    const token = json.result?.[0]?.token?.trim();
    if (!token) {
      throw new Error('OneLink token 成功但 result[0].token 为空');
    }
    return token;
  }

  /**
   * 《移动.pdf》5.1.7 码号信息批量查询（CMIOT_API25S05）：
   * `GET {MOBILE_ONELINK_BASE_URL}/v5/ec/query/sim-card-info/batch`
   * 公共参数 transid、token（先调 `/v5/ec/get/token`）；msisdns / iccids / imsis 三选一，多值下划线分隔。
   */
  async batchQuerySimCardInfo(
    params: BatchQuerySimCardInfoParams,
    at: Date = new Date(),
  ): Promise<{ traceId: string; msg: string; data: SimCardInfoBatchItem[] }> {
    console.log('batchQuerySimCardInfo...');
    const msisdnList = ChinaMobileV2Service.parseList(params.msisdns);
    const iccidList = ChinaMobileV2Service.parseList(params.iccids);
    const imsiList = ChinaMobileV2Service.parseList(params.imeis);

    const filled = [
      msisdnList.length ? 'msisdns' : '',
      iccidList.length ? 'iccids' : '',
      imsiList.length ? 'imsis' : '',
    ].filter(Boolean);
    if (filled.length === 0) {
      throw new Error(
        'batchQuerySimCardInfo 需且仅需填写 msisdns、iccids、imeis（IMSI）之一',
      );
    }
    if (filled.length > 1) {
      throw new Error(
        `《移动.pdf》5.1.7 要求 msisdns、iccids、imsis 有且仅有一项：当前同时包含 ${filled.join('、')}`,
      );
    }

    const list =
      msisdnList.length > 0
        ? msisdnList
        : iccidList.length > 0
          ? iccidList
          : imsiList;
    if (list.length > BATCH_SIM_CARD_MAX_COUNT) {
      throw new Error(
        `batchQuerySimCardInfo 单次最多 ${BATCH_SIM_CARD_MAX_COUNT} 张，当前 ${list.length}`,
      );
    }

    const appid = this.config.get<string>(CONFIG_ONELINK_APPID)?.trim();
    if (!appid) {
      throw new Error(`请配置 ${CONFIG_ONELINK_APPID}（OneLink 接入 appid）`);
    }

    const token = await this.fetchOnelinkToken(at);
    const batchTransid = ChinaMobileV2Service.buildOneLinkTransId(appid, at);
    const batchVal = ChinaMobileV2Service.toOnelinkBatchParam(list);
    const q = new URLSearchParams({
      transid: batchTransid,
      token,
    });
    if (msisdnList.length) q.set('msisdns', batchVal);
    else if (iccidList.length) q.set('iccids', batchVal);
    else q.set('imsis', batchVal);

    const base = this.getOnelinkBaseUrl();
    const url = `${base}${BATCH_QUERY_SIM_CARD_INFO_PATH}?${q}`;

    let res: Response;
    try {
      res = await fetch(url, { method: 'GET' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `码号批量查询网络异常 url=${url} message=${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new Error(`码号批量查询失败（网络）：${message}`);
    }

    const text = await res.text();
    let json: OneLinkBatchSimCardEnvelope;
    try {
      json = JSON.parse(text) as OneLinkBatchSimCardEnvelope;
    } catch {
      this.logger.error(
        `码号批量查询返回非 JSON: HTTP ${res.status}, body=${text.slice(0, 800)}`,
      );
      throw new Error(
        `码号批量查询返回非 JSON（HTTP ${res.status}）：${text.slice(0, 200)}`,
      );
    }

    if (!res.ok) {
      this.logger.error(
        `码号批量查询 HTTP 错误: status=${res.status}, msg=${json.message ?? text.slice(0, 500)}`,
      );
      throw new Error(
        `码号批量查询 HTTP ${res.status}：${json.message ?? text.slice(0, 200)}`,
      );
    }

    if (json.status !== '0') {
      this.logger.warn(
        `码号批量查询平台失败: status=${json.status}, msg=${json.message ?? ''}`,
      );
      throw new Error(
        `码号批量查询失败 [${json.status}] ${json.message ?? ''}`.trim(),
      );
    }

    const rows = Array.isArray(json.result) ? json.result : [];
    const data: SimCardInfoBatchItem[] = rows.map((row) => ({
      status: row.status,
      message: row.message,
      msisdn: row.msisdn,
      iccid: row.iccid,
      imsi: row.imsi,
    }));

    return {
      traceId: batchTransid,
      msg: json.message ?? '',
      data,
    };
  }
}
