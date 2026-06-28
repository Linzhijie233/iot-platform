import { Injectable, OnModuleInit } from '@nestjs/common';
import { BaseCrudService } from '../../common/base-crud.service';
import { StoreService } from '../../persistence/store.service';

export interface PlatformUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: '超级管理员' | '运营' | '财务' | '只读';
  status: '启用' | '停用';
  phone: string;
  lastLoginTime: string;
  remark: string;
}

const USER_SEED: Omit<PlatformUser, never>[] = [
  { id: 'user-1', username: 'admin', name: '系统管理员', email: 'admin@iot-platform.local', role: '超级管理员', status: '启用', phone: '13800000001', lastLoginTime: '2026-06-26 09:00', remark: '平台超级管理员，拥有全部权限' },
  { id: 'user-2', username: 'operator', name: '运营专员', email: 'operator@iot-platform.local', role: '运营', status: '启用', phone: '13800000002', lastLoginTime: '2026-06-25 18:20', remark: '负责卡/设备/服务运营' },
  { id: 'user-3', username: 'finance', name: '财务专员', email: 'finance@iot-platform.local', role: '财务', status: '启用', phone: '13800000003', lastLoginTime: '2026-06-24 14:05', remark: '负责订单/分佣/提现/对账' },
  { id: 'user-4', username: 'viewer', name: '只读访客', email: 'viewer@iot-platform.local', role: '只读', status: '停用', phone: '13800000004', lastLoginTime: '--', remark: '仅查看权限（当前已停用）' },
];

@Injectable()
export class UserService extends BaseCrudService implements OnModuleInit {
  protected readonly collection = 'users';
  protected readonly searchFields = ['username', 'name', 'email', 'role', 'phone'];

  constructor(store: StoreService) {
    super(store);
  }

  async onModuleInit(): Promise<void> {
    await this.store.seedIfEmpty(this.collection, USER_SEED);
  }

  /** 启用 / 停用 */
  setStatus(id: string, status: '启用' | '停用') {
    return this.update<PlatformUser>(id, { status });
  }
}
