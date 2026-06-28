import { request } from '@umijs/max';

/** 卡片台账（后端 /api/cards）。后端统一返回 { success, data, total }。 */

export interface CardItem {
  id: string;
  tab: 'normal' | 'nb' | 'pool';
  iccid: string;
  msisdn: string;
  orderNo: string;
  packageName: string;
  status: 'online' | 'offline' | 'suspended' | 'cancelled';
  cardStatusText: string;
  operator: string;
  project: string;
  region: string;
  remainTraffic: string;
  effectiveDate: string;
  expireDate: string;
  remark: string;
  serviceStatus: boolean;
  [key: string]: unknown;
}

export interface ListCardsParams {
  current?: number;
  pageSize?: number;
  keyword?: string;
  tab?: string;
  status?: string;
  operator?: string;
  project?: string;
}

interface ListEnvelope {
  success: boolean;
  data: CardItem[];
  total: number;
}

interface ItemEnvelope {
  success: boolean;
  data: CardItem;
}

/** ProTable 友好的列表请求（返回 {data,total,success}） */
export async function listCards(params: ListCardsParams) {
  const res = await request<ListEnvelope>('/api/cards', {
    method: 'GET',
    params: {
      page: params.current ?? 1,
      pageSize: params.pageSize ?? 20,
      keyword: params.keyword,
      tab: params.tab,
      status: params.status,
      operator: params.operator,
      project: params.project,
    },
  });
  return { data: res.data, total: res.total, success: res.success };
}

export async function createCard(data: Partial<CardItem>) {
  return request<ItemEnvelope>('/api/cards', { method: 'POST', data });
}

export async function updateCard(id: string, data: Partial<CardItem>) {
  return request<ItemEnvelope>(`/api/cards/${id}`, { method: 'PATCH', data });
}

export async function removeCard(id: string) {
  return request(`/api/cards/${id}`, { method: 'DELETE' });
}

/** 生命周期动作：suspend(停机) / resume(复机) / cancel(注销) */
export async function cardAction(id: string, action: 'suspend' | 'resume' | 'cancel') {
  return request<ItemEnvelope>(`/api/cards/${id}/${action}`, { method: 'POST' });
}
