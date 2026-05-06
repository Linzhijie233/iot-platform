export type BatchQuerySimCardInfoParams = {
  /**
   * 入参约束由 HTTP 层 DTO（`BatchQuerySimCardInfoDto`）校验；
   * 直接调用本方法时需自行保证仅一类有值且条数不超过 BATCH_SIM_CARD_MAX_COUNT。
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

export type BatchQuerySimCardInfoResult = {
  traceId: string;
  msg: string;
  data: SimCardInfoBatchItem[];
};

/** OneLink 批量码号行（网关 result 数组项） */
export type OneLinkBatchSimCardRow = {
  status: string;
  message: string;
  imsi?: string;
  msisdn?: string;
  iccid?: string;
};
