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

/** CMP BQ018 网关 JSON 外层（节选） */
export type BatchQrySimInfoApiResponse = {
  code?: string | number;
  message?: string;
  msg?: string;
  data?: {
    qrySimInfoList?: QrySimInfoItem[];
  };
};

export type BatchQrySimInfoResult = {
  code: string;
  message: string;
  list: QrySimInfoItem[];
};
