import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChinaTelecomGatewayService } from './china-telecom-gateway.service';
import type {
  BatchQrySimInfoApiResponse,
  BatchQrySimInfoParams,
  BatchQrySimInfoResult,
} from './china-telecom.types';

/**
 * CTIOT_5GCMP_BQ018 批量 SIM 卡资料查询
 * @see `/api/v1/prod/batchQrySimInfo`
 */
export const BATCH_QRY_SIM_INFO_PATH = '/api/v1/prod/batchQrySimInfo';

/** 文档：一次最多 100 张 */
export const BATCH_QRY_SIM_INFO_MAX_ACCESS_NUMBERS = 100;

export type {
  BatchQrySimInfoParams,
  BatchQrySimInfoResult,
  QrySimInfoItem,
} from './china-telecom.types';

/** 可选，默认 `https://cmp-api.ctwing.cn:20164`（《电信.pdf》2.1.18） */
const CONFIG_CMP_BASE_URL = 'TELECOM_CMP_BASE_URL';
const DEFAULT_CMP_BASE_URL = 'https://cmp-api.ctwing.cn:20164';

@Injectable()
export class ChinaTelecomService {
  private readonly logger = new Logger(ChinaTelecomService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly gateway: ChinaTelecomGatewayService,
  ) {}

  /**
   * CTIOT_5GCMP_BQ018 批量 SIM 卡资料查询（POST JSON + 网关 AppKey/Sign/Timestamp）
   */
  async batchQrySimInfo(
    params: BatchQrySimInfoParams,
  ): Promise<BatchQrySimInfoResult> {
    const custNumber =
      params.custNumber?.trim() ||
      this.config.get<string>('TELECOM_CUST_NUMBER')?.trim();
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
    const json = await this.gateway.request<BatchQrySimInfoApiResponse>({
      url: requestUrl,
      rawBody,
      operationLabel: 'batchQrySimInfo',
    });

    const msg = json.message ?? json.msg ?? '';

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

  private getCmpBaseUrl(): string {
    const raw = this.config.get<string>(CONFIG_CMP_BASE_URL)?.trim();
    return raw || DEFAULT_CMP_BASE_URL;
  }
}
