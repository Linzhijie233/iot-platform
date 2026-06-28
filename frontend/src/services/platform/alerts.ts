import { request } from '@umijs/max';

/** 告警/风控（后端 /api/alerts）。统一返回 { success, data, total }。 */

export interface AlertItem {
  id: string;
  time: string;
  target: string;
  operator: string;
  type: '流量超额' | '设备离线' | '欠费停机' | '异常位置' | '风控拦截';
  level: '高' | '中' | '低';
  desc: string;
  status: '待处理' | '已处理' | '已忽略';
  [key: string]: unknown;
}

export interface AlertStats {
  total: number;
  pending: number;
  handled: number;
  high: number;
}

export interface ListAlertsParams {
  current?: number;
  pageSize?: number;
  keyword?: string;
  type?: string;
  level?: string;
  status?: string;
}

interface ListEnvelope {
  success: boolean;
  data: AlertItem[];
  total: number;
}
interface ItemEnvelope<T> {
  success: boolean;
  data: T;
}

export async function listAlerts(params: ListAlertsParams) {
  const res = await request<ListEnvelope>('/api/alerts', {
    method: 'GET',
    params: {
      page: params.current ?? 1,
      pageSize: params.pageSize ?? 20,
      keyword: params.keyword,
      type: params.type,
      level: params.level,
      status: params.status,
    },
  });
  return { data: res.data, total: res.total, success: res.success };
}

export async function alertStats(): Promise<AlertStats> {
  const res = await request<ItemEnvelope<AlertStats>>('/api/alerts/stats', { method: 'GET' });
  return res.data;
}

export async function createAlert(data: Partial<AlertItem>) {
  return request<ItemEnvelope<AlertItem>>('/api/alerts', { method: 'POST', data });
}
export async function removeAlert(id: string) {
  return request(`/api/alerts/${id}`, { method: 'DELETE' });
}
export async function handleAlert(id: string) {
  return request<ItemEnvelope<AlertItem>>(`/api/alerts/${id}/handle`, { method: 'POST' });
}
export async function ignoreAlert(id: string) {
  return request<ItemEnvelope<AlertItem>>(`/api/alerts/${id}/ignore`, { method: 'POST' });
}
export async function batchAlerts(ids: (string | number)[], action: 'handle' | 'ignore') {
  return request('/api/alerts/batch', { method: 'POST', data: { ids, action } });
}
