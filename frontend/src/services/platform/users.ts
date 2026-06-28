import { request } from '@umijs/max';

/** 用户管理（后端 /api/v1/users）。统一 { success, data, total }。 */

export interface UserItem {
  id: string;
  username: string;
  name: string;
  email: string;
  role: '超级管理员' | '运营' | '财务' | '只读';
  status: '启用' | '停用';
  phone: string;
  lastLoginTime: string;
  remark: string;
  [key: string]: unknown;
}

interface ListEnvelope {
  success: boolean;
  data: UserItem[];
  total: number;
}

export async function listUsers() {
  const res = await request<ListEnvelope>('/api/v1/users', {
    method: 'GET',
    params: { page: 1, pageSize: 500 },
  });
  return { data: res.data, total: res.total, success: res.success };
}
export async function createUser(data: Partial<UserItem>) {
  return request('/api/v1/users', { method: 'POST', data });
}
export async function updateUser(id: string, data: Partial<UserItem>) {
  return request(`/api/v1/users/${id}`, { method: 'PATCH', data });
}
export async function removeUser(id: string) {
  return request(`/api/v1/users/${id}`, { method: 'DELETE' });
}
