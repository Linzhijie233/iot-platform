import { request } from '@umijs/max';

/** 套餐生命周期（后端 /api/packages）。统一 { success, data, total }。 */

export interface LifecycleEvent {
  time: string;
  title: string;
  description: string;
  color?: 'blue' | 'green' | 'red' | 'gray' | 'orange';
}

export interface PackageItem {
  id: string;
  iccid: string;
  cardNo: string;
  operator: string;
  packageName: string;
  packageType: string;
  deviceName: string;
  customerName: string;
  lifecycleStage: 'pending' | 'active' | 'expiring' | 'grace' | 'suspended' | 'expired';
  effectiveDate: string;
  expireDate: string;
  remainingDays: number;
  autoRenewStatus: 'enabled' | 'disabled';
  serviceStatus: 'running' | 'suspended';
  lastActionTime: string;
  riskNote: string;
  timeline: LifecycleEvent[];
  [key: string]: unknown;
}

interface ListEnvelope {
  success: boolean;
  data: PackageItem[];
  total: number;
}

export async function listPackages(params: { current?: number; pageSize?: number; keyword?: string }) {
  const res = await request<ListEnvelope>('/api/packages', {
    method: 'GET',
    params: { page: params.current ?? 1, pageSize: params.pageSize ?? 500, keyword: params.keyword },
  });
  return { data: res.data, total: res.total, success: res.success };
}

export async function createPackage(data: Partial<PackageItem>) {
  return request('/api/packages', { method: 'POST', data });
}
export async function updatePackage(id: string, data: Partial<PackageItem>) {
  return request(`/api/packages/${id}`, { method: 'PATCH', data });
}
export async function removePackage(id: string) {
  return request(`/api/packages/${id}`, { method: 'DELETE' });
}
