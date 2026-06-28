import { request } from '@umijs/max';

/** 流量池 / 语音池（后端 /api/flow-pools、/api/voice-pools）。统一 { success, data, total }。 */

export interface FlowPoolItem {
  id: string;
  poolNo: string;
  category: string;
  operator: string;
  basePackage: string;
  totalTraffic: string;
  giftedTraffic: string;
  fuelPackage: string;
  usedTraffic: string;
  remainingTraffic: string;
  remainingRatio: string;
  simCount: number;
  [key: string]: unknown;
}

export interface VoicePoolItem {
  id: string;
  poolNo: string;
  category: string;
  operator: string;
  basePackage: string;
  totalMinutes: string;
  giftedMinutes: string;
  addOnPackage: string;
  usedMinutes: string;
  remainingMinutes: string;
  remainingRatio: string;
  simCount: number;
  [key: string]: unknown;
}

interface ListEnvelope<T> {
  success: boolean;
  data: T[];
  total: number;
}

interface PoolListParams {
  current?: number;
  pageSize?: number;
  keyword?: string;
  category?: string;
  operator?: string;
}

function buildParams(p: PoolListParams) {
  return {
    page: p.current ?? 1,
    pageSize: p.pageSize ?? 20,
    keyword: p.keyword,
    category: p.category,
    operator: p.operator,
  };
}

export async function listFlowPools(params: PoolListParams) {
  const res = await request<ListEnvelope<FlowPoolItem>>('/api/flow-pools', {
    method: 'GET',
    params: buildParams(params),
  });
  return { data: res.data, total: res.total, success: res.success };
}
export async function createFlowPool(data: Partial<FlowPoolItem>) {
  return request('/api/flow-pools', { method: 'POST', data });
}
export async function updateFlowPool(id: string, data: Partial<FlowPoolItem>) {
  return request(`/api/flow-pools/${id}`, { method: 'PATCH', data });
}
export async function removeFlowPool(id: string) {
  return request(`/api/flow-pools/${id}`, { method: 'DELETE' });
}

export async function listVoicePools(params: PoolListParams) {
  const res = await request<ListEnvelope<VoicePoolItem>>('/api/voice-pools', {
    method: 'GET',
    params: buildParams(params),
  });
  return { data: res.data, total: res.total, success: res.success };
}
export async function createVoicePool(data: Partial<VoicePoolItem>) {
  return request('/api/voice-pools', { method: 'POST', data });
}
export async function updateVoicePool(id: string, data: Partial<VoicePoolItem>) {
  return request(`/api/voice-pools/${id}`, { method: 'PATCH', data });
}
export async function removeVoicePool(id: string) {
  return request(`/api/voice-pools/${id}`, { method: 'DELETE' });
}
