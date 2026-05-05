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

const CONFIG_AK = '572f816984e741de910714523bac1146';
const CONFIG_SK = 'eb24c75947254e788816dabbe4a7999a';
/** 可选；默认 `https://cmp.api.cmiot.cn` */
const CONFIG_BASE_URL = 'MOBILE_AIOT_BASE_URL';

const DEFAULT_AIOT_BASE_URL = 'https://cmp.api.cmaiot.cn';

/** 与文档「请求示例」JSON 中 `url` 字段对应（非网关 Host） */
const CONFIG_CAP_BODY_URL = 'MOBILE_CAP_BODY_URL';
const CONFIG_CAP_BASE_URL = 'MOBILE_CAP_BASE_URL';

const DEFAULT_CAP_BASE_URL = 'https://cas.api.cmmiot.com';

/** GPRS 用量（KB）— 文档：`POST /cap/v5/ec/query/sim-data-usage` */
export const QUERY_SIM_DATA_USAGE_PATH = '/cap/v5/ec/query/sim-data-usage';

/** SIM 停机原因查询接口 Path（与签名 path 一致） */
export const SIM_STOP_REASON_PATH = '/cmp/v5/ec/query/sim-stop-reason';

export type QuerySimStopReasonParams = {
  msisdn?: string;
  iccid?: string;
  imsi?: string;
};

export type SimStopReasonItem = {
  platformType: string;
  stopReason: string;
  shutdownReasonDesc?: string;
};

type SimStopReasonApiEnvelope = {
  traceId: string;
  code: string;
  msg: string;
  data?: SimStopReasonItem[];
};

export type QuerySimDataUsageParams = {
  msisdn?: string;
  iccid?: string;
  imsi?: string;
};

export type PccCodeUseAmountItem = {
  pccCode: string;
  pccCodeUseAmount: string;
};

export type ApnUseAmountItem = {
  apnName: string;
  apnUseAmount: string;
  pccCodeUseAmountList?: PccCodeUseAmountItem[];
};

export type SimDataUsagePayload = {
  dataAmount: string;
  apnUseAmountList: ApnUseAmountItem[];
};

type SimDataUsageApiEnvelope = {
  traceId: string;
  code: string;
  msg: string;
  data?: SimDataUsagePayload;
};

@Injectable()
export class ChinaMobileService {
  private readonly logger = new Logger(ChinaMobileService.name);

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
    const sk = CONFIG_SK;
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
    const ak = CONFIG_AK;
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

  private getAiotBaseUrl(): string {
    const raw = this.config.get<string>(CONFIG_BASE_URL)?.trim();
    return raw || DEFAULT_AIOT_BASE_URL;
  }

  private getCapBaseUrl(): string {
    const raw = this.config.get<string>(CONFIG_CAP_BASE_URL)?.trim();
    return raw || DEFAULT_CAP_BASE_URL;
  }

  /**
   * GPRS 用量（KB）。按文档请求示例组包：`timestamp`、`url`、`nonce` 及 msisdn/iccid/imsi 至少其一。
   * `POST /cap/v5/ec/query/sim-data-usage`
   */
  async querySimDataUsage(
    params: QuerySimDataUsageParams,
    at: Date = new Date(),
  ): Promise<{ traceId: string; msg: string; data: SimDataUsagePayload }> {
    const msisdn = params.msisdn?.trim();
    const iccid = params.iccid?.trim();
    const imsi = params.imsi?.trim();
    if (!msisdn && !iccid && !imsi) {
      throw new Error('querySimDataUsage 需至少提供 msisdn、iccid、imsi 之一');
    }

    const bodyUrl = this.config.get<string>(CONFIG_CAP_BODY_URL)?.trim();
    if (!bodyUrl) {
      throw new Error(
        `请在环境变量中配置 ${CONFIG_CAP_BODY_URL}（请求体 JSON 字段 url，与文档示例一致）`,
      );
    }

    const bodyObject: Record<string, string> = {
      timestamp: this.createTimestampSeconds(at),
      url: bodyUrl,
      nonce: this.createNonce(),
    };
    if (msisdn) bodyObject.msisdn = msisdn;
    if (iccid) bodyObject.iccid = iccid;
    if (imsi) bodyObject.imsi = imsi;

    const body = JSON.stringify(bodyObject);

    const url = `${this.getCapBaseUrl()}${QUERY_SIM_DATA_USAGE_PATH}`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `SIM 流量查询请求网络/传输异常 url=${url} message=${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new Error(`SIM 流量查询请求失败（网络）: ${message}`);
    }

    const text = await res.text();
    let json: SimDataUsageApiEnvelope;
    try {
      json = JSON.parse(text) as SimDataUsageApiEnvelope;
    } catch {
      this.logger.error(
        `SIM 流量查询接口返回非 JSON: HTTP ${res.status}, body=${text.slice(0, 800)}`,
      );
      throw new Error(
        `SIM 流量查询接口返回非 JSON（HTTP ${res.status}）：${text.slice(0, 200)}`,
      );
    }

    if (!res.ok) {
      this.logger.error(
        `SIM 流量查询接口 HTTP 错误: status=${res.status}, traceId=${json.traceId ?? '—'}, code=${json.code ?? '—'}, msg=${json.msg ?? text.slice(0, 500)}`,
      );
      throw new Error(
        `SIM 流量查询接口 HTTP ${res.status}：${json.msg ?? text.slice(0, 200)}`,
      );
    }

    if (json.code !== '0') {
      this.logger.warn(
        `SIM 流量查询业务失败: traceId=${json.traceId}, code=${json.code}, msg=${json.msg ?? ''}`,
      );
      throw new Error(
        `SIM 流量查询接口失败 [${json.code}] ${json.msg ?? ''}`.trim(),
      );
    }

    const data = json.data;
    if (!data || !Array.isArray(data.apnUseAmountList)) {
      throw new Error('SIM 流量查询成功但 data 结构异常');
    }

    return {
      traceId: json.traceId,
      msg: json.msg,
      data: {
        dataAmount: String(data.dataAmount ?? ''),
        apnUseAmountList: data.apnUseAmountList,
      },
    };
  }

  /**
   * 集团客户 SIM 停机原因查询（文档：POST `/cmp/v5/ec/query/sim-stop-reason`）
   * @throws 未配置 AK/SK、缺少卡标识、`code !== "0"`、HTTP 非 2xx 或响应非 JSON
   */
  async querySimStopReason(
    params: QuerySimStopReasonParams,
    at: Date = new Date(),
  ): Promise<{ traceId: string; msg: string; data: SimStopReasonItem[] }> {
    const msisdn = params.msisdn?.trim();
    const iccid = params.iccid?.trim();
    const imsi = params.imsi?.trim();
    if (!msisdn && !iccid && !imsi) {
      throw new Error('querySimStopReason 需至少提供 msisdn、iccid、imsi 之一');
    }

    const pub = this.createPublicParams(at);
    const bodyObject: Record<string, unknown> = {
      ak: pub.ak,
      nonce: pub.nonce,
      timestamp: pub.timestamp,
    };
    if (msisdn) bodyObject.msisdn = msisdn;
    if (iccid) bodyObject.iccid = iccid;
    if (imsi) bodyObject.imsi = imsi;

    const body = ChinaMobileService.canonicalJsonBody(bodyObject);
    const auth = this.buildAuthorizationHeader({
      path: SIM_STOP_REASON_PATH,
      bodyObject,
    });

    const url = `${this.getAiotBaseUrl()}${SIM_STOP_REASON_PATH}`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: auth,
        },
        body,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `SIM 停机原因请求网络/传输异常 url=${url} message=${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new Error(`SIM 停机原因请求失败（网络）: ${message}`);
    }

    const text = await res.text();
    let json: SimStopReasonApiEnvelope;
    try {
      json = JSON.parse(text) as SimStopReasonApiEnvelope;
    } catch {
      this.logger.error(
        `SIM 停机原因接口返回非 JSON: HTTP ${res.status}, body=${text.slice(0, 800)}`,
      );
      throw new Error(
        `SIM 停机原因接口返回非 JSON（HTTP ${res.status}）：${text.slice(0, 200)}`,
      );
    }

    if (!res.ok) {
      this.logger.error(
        `SIM 停机原因接口 HTTP 错误: status=${res.status}, traceId=${json.traceId ?? '—'}, code=${json.code ?? '—'}, msg=${json.msg ?? text.slice(0, 500)}`,
      );
      throw new Error(
        `SIM 停机原因接口 HTTP ${res.status}：${json.msg ?? text.slice(0, 200)}`,
      );
    }

    if (json.code !== '0') {
      this.logger.warn(
        `SIM 停机原因业务失败: traceId=${json.traceId}, code=${json.code}, msg=${json.msg ?? ''}`,
      );
      throw new Error(
        `SIM 停机原因接口失败 [${json.code}] ${json.msg ?? ''}`.trim(),
      );
    }

    return {
      traceId: json.traceId,
      msg: json.msg,
      data: Array.isArray(json.data) ? json.data : [],
    };
  }
}
