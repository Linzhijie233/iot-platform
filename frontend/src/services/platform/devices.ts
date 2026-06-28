import { request } from '@umijs/max';

/** 设备管理（后端 /api/devices）。统一返回 { success, data, total }。 */

export interface DeviceItem {
  id: string;
  deviceNo: string;
  deviceName: string;
  productModel: string;
  projectName: string;
  customerName: string;
  status: 'online' | 'offline' | 'alarm' | 'pending';
  onlineRate: string;
  cardNo: string;
  iccid: string;
  imei: string;
  installArea: string;
  shipStatus: '待发货' | '已发货' | '已签收';
  activateStatus: '未激活' | '激活中' | '已激活';
  lastHeartbeat: string;
  alertCount: number;
  firmwareVersion: string;
  guardianCode: string;
  remark: string;
  [key: string]: unknown;
}

export interface ListDevicesParams {
  current?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  productModel?: string;
  projectName?: string;
  shipStatus?: string;
}

interface ListEnvelope {
  success: boolean;
  data: DeviceItem[];
  total: number;
}
interface ItemEnvelope {
  success: boolean;
  data: DeviceItem;
}

export async function listDevices(params: ListDevicesParams) {
  const res = await request<ListEnvelope>('/api/devices', {
    method: 'GET',
    params: {
      page: params.current ?? 1,
      pageSize: params.pageSize ?? 20,
      keyword: params.keyword,
      status: params.status,
      productModel: params.productModel,
      projectName: params.projectName,
      shipStatus: params.shipStatus,
    },
  });
  return { data: res.data, total: res.total, success: res.success };
}

export async function createDevice(data: Partial<DeviceItem>) {
  return request<ItemEnvelope>('/api/devices', { method: 'POST', data });
}
export async function updateDevice(id: string, data: Partial<DeviceItem>) {
  return request<ItemEnvelope>(`/api/devices/${id}`, { method: 'PATCH', data });
}
export async function removeDevice(id: string) {
  return request(`/api/devices/${id}`, { method: 'DELETE' });
}
export async function shipDevice(id: string) {
  return request<ItemEnvelope>(`/api/devices/${id}/ship`, { method: 'POST' });
}
export async function activateDevice(id: string) {
  return request<ItemEnvelope>(`/api/devices/${id}/activate`, { method: 'POST' });
}
export async function clearDeviceAlarm(id: string) {
  return request<ItemEnvelope>(`/api/devices/${id}/clear-alarm`, { method: 'POST' });
}
export async function bindDeviceCard(
  id: string,
  data: { cardNo?: string; iccid?: string; imei?: string },
) {
  return request<ItemEnvelope>(`/api/devices/${id}/bind-card`, { method: 'POST', data });
}
export async function unbindDeviceCard(id: string) {
  return request<ItemEnvelope>(`/api/devices/${id}/unbind-card`, { method: 'POST' });
}
export async function dispatchDeviceParams(id: string, data: { firmwareVersion?: string }) {
  return request<ItemEnvelope>(`/api/devices/${id}/dispatch-params`, { method: 'POST', data });
}
