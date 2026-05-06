import { Injectable } from '@nestjs/common';
import {
  BATCH_QUERY_SIM_CARD_INFO_PATH,
  ChinaMobileV2GatewayService,
} from './china-mobile-v2-gateway.service';
import type {
  BatchQuerySimCardInfoParams,
  BatchQuerySimCardInfoResult,
  OneLinkBatchSimCardRow,
  SimCardInfoBatchItem,
} from './china-mobile-v2.types';

export type {
  BatchQuerySimCardInfoParams,
  BatchQuerySimCardInfoResult,
  SimCardInfoBatchItem,
} from './china-mobile-v2.types';
export type { ChinaMobileAiotSignInput } from './china-mobile-v2-gateway.service';
export {
  BATCH_QUERY_SIM_CARD_INFO_PATH,
  BATCH_SIM_CARD_MAX_COUNT,
  ONELINK_GET_TOKEN_PATH,
} from './china-mobile-v2-gateway.service';

@Injectable()
export class ChinaMobileV2Service {
  constructor(private readonly gateway: ChinaMobileV2GatewayService) {}

  private static parseList(raw: string | undefined): string[] {
    if (!raw?.trim()) return [];
    return raw
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private static toOnelinkBatchParam(values: string[]): string {
    return values.join('_');
  }

  /**
   * 《移动.pdf》5.1.7 码号信息批量查询（CMIOT_API25S05）：
   * `GET {MOBILE_ONELINK_BASE_URL 或 MOBILE_ONELINK_SANDBOX_BASE_URL}/v5/ec/query/sim-card-info/batch`（由 `MOBILE_ONELINK_USE_SANDBOX` 切换）
   * 公共参数 transid、token（先调 `/v5/ec/get/token`）；msisdns / iccids / imsis 三选一，多值下划线分隔。
   */
  async batchQuerySimCardInfo(
    params: BatchQuerySimCardInfoParams,
    at: Date = new Date(),
  ): Promise<BatchQuerySimCardInfoResult> {
    const msisdnList = ChinaMobileV2Service.parseList(params.msisdns);
    const iccidList = ChinaMobileV2Service.parseList(params.iccids);
    const imsiList = ChinaMobileV2Service.parseList(params.imeis);
    const list =
      msisdnList.length > 0
        ? msisdnList
        : iccidList.length > 0
          ? iccidList
          : imsiList;

    const token = await this.gateway.fetchOnelinkToken(at);
    const batchTransid = this.gateway.buildOneLinkTransId(at);
    const batchVal = ChinaMobileV2Service.toOnelinkBatchParam(list);
    const query: Record<string, string> = {
      transid: batchTransid,
      token,
      ...(msisdnList.length
        ? { msisdns: batchVal }
        : iccidList.length
          ? { iccids: batchVal }
          : { imsis: batchVal }),
    };
    const json = await this.gateway.onelinkGetJson<OneLinkBatchSimCardRow[]>(
      BATCH_QUERY_SIM_CARD_INFO_PATH,
      query,
      '码号批量查询',
    );

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
