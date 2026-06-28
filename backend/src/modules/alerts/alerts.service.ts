import { Injectable, OnModuleInit } from '@nestjs/common';
import { BaseCrudService } from '../../common/base-crud.service';
import { StoreService } from '../../persistence/store.service';
import { ALERT_SEED } from './alerts.seed';
import type { AlertRecord, AlertStats, AlertStatus } from './alerts.types';

@Injectable()
export class AlertsService extends BaseCrudService implements OnModuleInit {
  protected readonly collection = 'alerts';
  protected readonly searchFields = ['id', 'target', 'desc', 'operator'];

  constructor(store: StoreService) {
    super(store);
  }

  async onModuleInit(): Promise<void> {
    await this.store.seedIfEmpty(this.collection, ALERT_SEED);
  }

  handle(id: string): Promise<AlertRecord | null> {
    return this.update<AlertRecord>(id, { status: '已处理' });
  }

  ignore(id: string): Promise<AlertRecord | null> {
    return this.update<AlertRecord>(id, { status: '已忽略' });
  }

  /** 批量处理 / 忽略 */
  async batch(ids: string[], status: AlertStatus): Promise<number> {
    let n = 0;
    for (const id of ids) {
      const r = await this.update<AlertRecord>(id, { status });
      if (r) n += 1;
    }
    return n;
  }

  /** KPI 统计（供告警页与看板联动） */
  async stats(): Promise<AlertStats> {
    const all = await this.all<AlertRecord>();
    const pending = all.filter((a) => a.status === '待处理');
    return {
      total: all.length,
      pending: pending.length,
      handled: all.filter((a) => a.status !== '待处理').length,
      high: pending.filter((a) => a.level === '高').length,
    };
  }
}
