import { Controller, Injectable, Module, Post } from '@nestjs/common';
import { DiscoveryModule, DiscoveryService } from '@nestjs/core';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { okItem } from '../../common/api-response';
import { BaseCrudService } from '../../common/base-crud.service';
import { StoreService } from '../../persistence/store.service';

/** 所有业务集合（重置时清空并重灌种子） */
const COLLECTIONS = [
  'users',
  'cards',
  'devices',
  'alerts',
  'flowPools',
  'voicePools',
  'packages',
  'serviceProducts',
  'serviceSubscriptions',
  'serviceOperations',
  'serviceAssurances',
  'orders',
  'commissions',
  'withdrawals',
  'merchantRisks',
  'riskWhitelist',
  'riskRules',
  'riskHits',
];

@Injectable()
export class AdminService {
  constructor(
    private readonly store: StoreService,
    private readonly discovery: DiscoveryService,
  ) {}

  /** 清空全部业务集合并重灌种子（恢复到初始状态） */
  async resetDemo(): Promise<{ cleared: number; reseeded: number; backend: string }> {
    for (const name of COLLECTIONS) {
      await this.store.clear(name);
    }
    // 重新触发各 seed 服务的 onModuleInit（集合已空，seedIfEmpty 会重灌）
    let reseeded = 0;
    for (const wrapper of this.discovery.getProviders()) {
      const instance = wrapper.instance as
        | (BaseCrudService & { onModuleInit?: () => Promise<void> })
        | { onModuleInit?: () => Promise<void>; constructor: { name: string } };
      if (!instance) continue;
      const isSeeder =
        instance instanceof BaseCrudService ||
        instance.constructor?.name === 'RiskService';
      if (isSeeder && typeof instance.onModuleInit === 'function') {
        await instance.onModuleInit();
        reseeded += 1;
      }
    }
    return { cleared: COLLECTIONS.length, reseeded, backend: this.store.backend };
  }
}

@ApiTags('系统管理')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Post('reset-demo')
  @ApiOperation({ summary: '一键重置数据（清空所有业务集合并重灌种子）' })
  async resetDemo() {
    return okItem(await this.admin.resetDemo());
  }
}

@Module({
  imports: [DiscoveryModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
