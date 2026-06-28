import { request } from '@umijs/max';

/** 财务版块（后端 /api/orders、/api/commissions、/api/withdrawals、/api/merchant-risks）。统一 { success, data, total }。 */

export interface OrderItem {
  id: string;
  orderNo: string;
  customerName: string;
  iccid: string;
  msisdn: string;
  packageName: string;
  packageType: string;
  orderAmount: number;
  costAmount: number;
  marginAmount: number;
  commissionAmount: number;
  consumeTime: string;
  statementMonth: string;
  remark: string;
  [key: string]: unknown;
}

export interface CommissionItem {
  id: string;
  settlementType: string;
  period: string;
  orderTotalAmount: number;
  costTotalAmount: number;
  marginTotalAmount: number;
  commissionRatio: string;
  commissionAmount: number;
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

export const listOrders = () => listOf<OrderItem>('/api/orders');
export const createOrder = (data: Partial<OrderItem>) => request('/api/orders', { method: 'POST', data });
export const updateOrder = (id: string, data: Partial<OrderItem>) => request(`/api/orders/${id}`, { method: 'PATCH', data });
export const removeOrder = (id: string) => request(`/api/orders/${id}`, { method: 'DELETE' });

export const listCommissions = () => listOf<CommissionItem>('/api/commissions');
export const createCommission = (data: Partial<CommissionItem>) => request('/api/commissions', { method: 'POST', data });
export const updateCommission = (id: string, data: Partial<CommissionItem>) => request(`/api/commissions/${id}`, { method: 'PATCH', data });
export const removeCommission = (id: string) => request(`/api/commissions/${id}`, { method: 'DELETE' });

export interface WithdrawItem {
  id: string;
  orderNo: string;
  withdrawAccount: string;
  amount: number;
  applyTime: string;
  processTime: string;
  status: '待审核' | '处理中' | '已到账';
  [key: string]: unknown;
}

export interface MerchantRiskItem {
  id: string;
  merchantName: string;
  merchantNo: string;
  registerStatus: string;
  payMethodStatus: string;
  alipayStatus: string;
  wechatStatus: string;
  serviceValidity: string;
  promotionPeriod: string;
  priceStrategy: string;
  riskControl: string;
  remark: string;
  [key: string]: unknown;
}

export const listWithdrawals = () => listOf<WithdrawItem>('/api/withdrawals');
export const createWithdrawal = (data: Partial<WithdrawItem>) => request('/api/withdrawals', { method: 'POST', data });
export const updateWithdrawal = (id: string, data: Partial<WithdrawItem>) => request(`/api/withdrawals/${id}`, { method: 'PATCH', data });
export const removeWithdrawal = (id: string) => request(`/api/withdrawals/${id}`, { method: 'DELETE' });

export const listMerchants = () => listOf<MerchantRiskItem>('/api/merchant-risks');
export const createMerchant = (data: Partial<MerchantRiskItem>) => request('/api/merchant-risks', { method: 'POST', data });
export const updateMerchant = (id: string, data: Partial<MerchantRiskItem>) => request(`/api/merchant-risks/${id}`, { method: 'PATCH', data });
export const removeMerchant = (id: string) => request(`/api/merchant-risks/${id}`, { method: 'DELETE' });
