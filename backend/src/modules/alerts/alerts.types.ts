/** 告警记录（与前端 AlertRow 字段对齐） */
export type AlertLevel = '高' | '中' | '低';
export type AlertStatus = '待处理' | '已处理' | '已忽略';
export type AlertType = '流量超额' | '设备离线' | '欠费停机' | '异常位置' | '风控拦截';

export interface AlertRecord {
  id: string;
  time: string;
  target: string;
  operator: string;
  type: AlertType;
  level: AlertLevel;
  desc: string;
  status: AlertStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface AlertStats {
  total: number;
  pending: number;
  handled: number;
  high: number;
}
