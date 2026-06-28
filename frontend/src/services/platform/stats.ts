import { request } from '@umijs/max';

/** 数据看板聚合（后端 /api/stats/overview）。 */

export interface StatsOverview {
  totalActive: number;
  online: number;
  offline: number;
  suspended: number;
  cancelled: number;
  renewed: number;
  arpu: number;
  alerts: number;
  monthNew: number;
  operatorDist: { label: string; value: number }[];
  projectDist: { name: string; value: number }[];
  deviceTotal: number;
  deviceOnline: number;
  orderCount: number;
  orderAmount: number;
  commissionAmount: number;
}

export async function getOverview(): Promise<StatsOverview> {
  const res = await request<{ success: boolean; data: StatsOverview }>('/api/stats/overview', {
    method: 'GET',
  });
  return res.data;
}
