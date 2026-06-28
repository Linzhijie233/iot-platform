/** 设备记录（与前端 DeviceRecord 字段对齐） */
export type DeviceStatus = 'online' | 'offline' | 'alarm' | 'pending';
export type ShipStatus = '待发货' | '已发货' | '已签收';
export type ActivateStatus = '未激活' | '激活中' | '已激活';

export interface DeviceRecord {
  id: string;
  deviceNo: string;
  deviceName: string;
  productModel: string;
  projectName: string;
  customerName: string;
  status: DeviceStatus;
  onlineRate: string;
  cardNo: string;
  iccid: string;
  imei: string;
  installArea: string;
  shipStatus: ShipStatus;
  activateStatus: ActivateStatus;
  lastHeartbeat: string;
  alertCount: number;
  firmwareVersion: string;
  guardianCode: string;
  remark: string;
  createdAt?: string;
  updatedAt?: string;
}
