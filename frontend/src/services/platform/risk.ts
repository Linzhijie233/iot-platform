import { request } from '@umijs/max';

/** 风控（后端 /api/risk/{whitelist|rules|hits}）。统一 { success, data, total }。 */

export type RiskResource = 'whitelist' | 'rules' | 'hits';
export type RiskObjectType = 'card' | 'device' | 'customer';
export type EntryStatus = 'enabled' | 'disabled';

export interface WhiteListItem {
  id: string;
  name: string;
  objectName: string;
  objectType: RiskObjectType;
  scope: string;
  validPeriod: string;
  status: EntryStatus;
  creator: string;
  remark: string;
  [key: string]: unknown;
}
export interface RuleItem {
  id: string;
  ruleName: string;
  riskType: string;
  objectType: RiskObjectType;
  conditionSummary: string;
  action: 'alert' | 'suspend' | 'review' | 'limit';
  status: EntryStatus;
  lastHitTime: string;
  hitCount: number;
  remark: string;
  [key: string]: unknown;
}
export interface HitItem {
  id: string;
  objectName: string;
  objectType: RiskObjectType;
  matchedRule: string;
  riskLevel: 'high' | 'medium' | 'low';
  eventTime: string;
  handlingStatus: string;
  suggestion: string;
  remark: string;
  [key: string]: unknown;
}

interface ListEnvelope<T> {
  success: boolean;
  data: T[];
  total: number;
}

export async function listRisk<T>(resource: RiskResource, params?: { pageSize?: number }) {
  const res = await request<ListEnvelope<T>>(`/api/risk/${resource}`, {
    method: 'GET',
    params: { page: 1, pageSize: params?.pageSize ?? 500 },
  });
  return { data: res.data, total: res.total, success: res.success };
}
export async function createRisk(resource: RiskResource, data: Record<string, unknown>) {
  return request(`/api/risk/${resource}`, { method: 'POST', data });
}
export async function updateRisk(resource: RiskResource, id: string, data: Record<string, unknown>) {
  return request(`/api/risk/${resource}/${id}`, { method: 'PATCH', data });
}
export async function removeRisk(resource: RiskResource, id: string) {
  return request(`/api/risk/${resource}/${id}`, { method: 'DELETE' });
}
