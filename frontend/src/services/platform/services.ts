import { request } from '@umijs/max';

/** 服务版块（后端 /api/service-products、/api/service-subscriptions）。统一 { success, data, total }。 */

export interface ServiceProductItem {
  id: string;
  productCode: string;
  productName: string;
  productType: string;
  targetCustomer: string;
  billingMode: string;
  status: 'enabled' | 'draft' | 'paused' | 'expiring';
  price: string;
  validPeriod: string;
  activeSubscriptions: number;
  renewRate: string;
  latestUpdateTime: string;
  owner: string;
  slaLevel: string;
  description: string;
  [key: string]: unknown;
}

export interface ServiceSubscriptionItem {
  id: string;
  subscriptionNo: string;
  customerName: string;
  productName: string;
  instanceName: string;
  billingMode: string;
  status: 'active' | 'expiring' | 'paused' | 'expired';
  startDate: string;
  expireDate: string;
  remainingDays: number;
  renewStatus: string;
  serviceOwner: string;
  latestActionTime: string;
  description: string;
  [key: string]: unknown;
}

interface ListEnvelope<T> {
  success: boolean;
  data: T[];
  total: number;
}

async function listOf<T>(path: string) {
  const res = await request<ListEnvelope<T>>(path, { method: 'GET', params: { page: 1, pageSize: 500 } });
  return { data: res.data, total: res.total, success: res.success };
}

export const listProducts = () => listOf<ServiceProductItem>('/api/service-products');
export const createProduct = (data: Partial<ServiceProductItem>) => request('/api/service-products', { method: 'POST', data });
export const updateProduct = (id: string, data: Partial<ServiceProductItem>) => request(`/api/service-products/${id}`, { method: 'PATCH', data });
export const removeProduct = (id: string) => request(`/api/service-products/${id}`, { method: 'DELETE' });

export const listSubscriptions = () => listOf<ServiceSubscriptionItem>('/api/service-subscriptions');
export const createSubscription = (data: Partial<ServiceSubscriptionItem>) => request('/api/service-subscriptions', { method: 'POST', data });
export const updateSubscription = (id: string, data: Partial<ServiceSubscriptionItem>) => request(`/api/service-subscriptions/${id}`, { method: 'PATCH', data });
export const removeSubscription = (id: string) => request(`/api/service-subscriptions/${id}`, { method: 'DELETE' });

export interface ServiceOperationItem {
  id: string;
  orderNo: string;
  customerName: string;
  productName: string;
  operationType: '续费' | '升级' | '停服' | '恢复';
  status: 'pending' | 'processing' | 'completed' | 'blocked';
  submitTime: string;
  targetDate: string;
  owner: string;
  impactScope: string;
  remark: string;
  [key: string]: unknown;
}

export interface AssuranceItem {
  id: string;
  ticketNo: string;
  customerName: string;
  productName: string;
  assuranceType: '异常通知' | '客服协同' | 'SLA跟踪';
  status: 'open' | 'responding' | 'resolved' | 'breach-risk';
  priority: '高' | '中' | '低';
  createTime: string;
  deadline: string;
  owner: string;
  channel: string;
  remark: string;
  [key: string]: unknown;
}

export const listOperations = () => listOf<ServiceOperationItem>('/api/service-operations');
export const createOperation = (data: Partial<ServiceOperationItem>) => request('/api/service-operations', { method: 'POST', data });
export const updateOperation = (id: string, data: Partial<ServiceOperationItem>) => request(`/api/service-operations/${id}`, { method: 'PATCH', data });
export const removeOperation = (id: string) => request(`/api/service-operations/${id}`, { method: 'DELETE' });

export const listAssurances = () => listOf<AssuranceItem>('/api/service-assurances');
export const createAssurance = (data: Partial<AssuranceItem>) => request('/api/service-assurances', { method: 'POST', data });
export const updateAssurance = (id: string, data: Partial<AssuranceItem>) => request(`/api/service-assurances/${id}`, { method: 'PATCH', data });
export const removeAssurance = (id: string) => request(`/api/service-assurances/${id}`, { method: 'DELETE' });
