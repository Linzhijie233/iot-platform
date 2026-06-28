/** 卡片台账记录（与前端 CardRecord 字段对齐；新增 tab 区分 普通/NB/池） */
export type CardStatus = 'online' | 'offline' | 'suspended' | 'cancelled';
export type CardTab = 'normal' | 'nb' | 'pool';

export interface CardRecord {
  id: string;
  tab: CardTab;
  iccid: string;
  msisdn: string;
  orderNo: string;
  renewCode: string;
  packageName: string;
  giftTraffic: string;
  usedTraffic: string;
  remainTraffic: string;
  owner: string;
  status: CardStatus;
  cardStatusText: string;
  apn: string;
  apnType: string;
  mode: string;
  cardType: string;
  poolName: string;
  cardAttr: string;
  effectiveDate: string;
  expireDate: string;
  guaranteedKeepNo: string;
  guaranteedExpireDate: string;
  resource: string;
  region: string;
  smsStatus: string;
  remark: string;
  operator: string;
  project: string;
  esim: string;
  imei: string;
  deviceName: string;
  serviceStatus: boolean;
  createdAt?: string;
  updatedAt?: string;
}
