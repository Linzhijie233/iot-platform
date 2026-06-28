import { Injectable, OnModuleInit } from '@nestjs/common';
import { BaseCrudService } from '../../common/base-crud.service';
import { StoreService } from '../../persistence/store.service';
import { CARD_SEED } from './cards.seed';
import type { CardRecord } from './cards.types';

@Injectable()
export class CardsService extends BaseCrudService implements OnModuleInit {
  protected readonly collection = 'cards';
  protected readonly searchFields = [
    'iccid',
    'msisdn',
    'orderNo',
    'remark',
    'imei',
    'esim',
    'owner',
    'project',
  ];

  constructor(store: StoreService) {
    super(store);
  }

  async onModuleInit(): Promise<void> {
    await this.store.seedIfEmpty(this.collection, CARD_SEED);
  }

  /** 停机保号 */
  suspend(id: string): Promise<CardRecord | null> {
    return this.update<CardRecord>(id, {
      status: 'suspended',
      cardStatusText: '停机保号',
      serviceStatus: false,
    });
  }

  /** 复机 / 开机 */
  resume(id: string): Promise<CardRecord | null> {
    return this.update<CardRecord>(id, {
      status: 'online',
      cardStatusText: '已激活',
      serviceStatus: true,
    });
  }

  /** 注销 */
  cancel(id: string): Promise<CardRecord | null> {
    return this.update<CardRecord>(id, {
      status: 'cancelled',
      cardStatusText: '已注销',
      serviceStatus: false,
    });
  }
}
