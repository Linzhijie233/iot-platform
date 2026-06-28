import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  NotFoundException,
  OnModuleInit,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseCrudService } from '../../common/base-crud.service';
import { okItem, okList, pickFilter } from '../../common/api-response';
import { StoreService } from '../../persistence/store.service';

export interface ServiceProductRecord {
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
}

const SEED: Omit<ServiceProductRecord, never>[] = [
  { id: 'svc-seed-1', productCode: 'SVP-IOT-MONITOR-001', productName: '设备在线监测服务', productType: '监控服务', targetCustomer: '企业客户', billingMode: '包年', status: 'enabled', price: '199 元/年', validPeriod: '12 个月', activeSubscriptions: 128, renewRate: '81%', latestUpdateTime: '2026-06-20 16:20', owner: '服务运营组', slaLevel: 'SLA-L2', description: '提供设备在线率统计、离线预警和基础报表能力。' },
  { id: 'svc-seed-2', productCode: 'SVP-IOT-ALERT-003', productName: '设备异常告警服务', productType: '告警服务', targetCustomer: '企业客户', billingMode: '包月', status: 'enabled', price: '39 元/月', validPeriod: '1 个月', activeSubscriptions: 246, renewRate: '74%', latestUpdateTime: '2026-06-20 09:40', owner: '服务运营组', slaLevel: 'SLA-L1', description: '提供多阈值规则告警、通知触达和异常跟踪。' },
  { id: 'svc-seed-3', productCode: 'SVP-IOT-GUARD-008', productName: '守护码映射服务', productType: '基础服务', targetCustomer: '平台内部', billingMode: '按量', status: 'draft', price: '0.08 元/次', validPeriod: '按调用周期', activeSubscriptions: 0, renewRate: '--', latestUpdateTime: '2026-06-19 13:15', owner: '平台产品组', slaLevel: 'SLA-L3', description: '提供设备守护码、ICCID 和设备编号的映射能力。' },
  { id: 'svc-seed-4', productCode: 'SVP-IOT-CS-012', productName: '客服协同服务', productType: '协同服务', targetCustomer: '企业客户', billingMode: '包季', status: 'paused', price: '299 元/季', validPeriod: '3 个月', activeSubscriptions: 32, renewRate: '55%', latestUpdateTime: '2026-06-18 18:05', owner: '客服支持组', slaLevel: 'SLA-L2', description: '统一管理服务异常通知、客服工单协同和升级处理。' },
];

@Injectable()
export class ServiceProductsService extends BaseCrudService implements OnModuleInit {
  protected readonly collection = 'serviceProducts';
  protected readonly searchFields = ['productCode', 'productName', 'productType', 'targetCustomer', 'owner'];
  constructor(store: StoreService) {
    super(store);
  }
  async onModuleInit(): Promise<void> {
    await this.store.seedIfEmpty(this.collection, SEED);
  }
}

@ApiTags('服务产品')
@Controller('service-products')
export class ServiceProductsController {
  constructor(private readonly svc: ServiceProductsService) {}

  @Get()
  @ApiOperation({ summary: '服务产品分页列表（keyword/status/productType/billingMode 筛选）' })
  async list(@Query() q: Record<string, string>) {
    const { data, total } = await this.svc.list<ServiceProductRecord>({
      page: Number(q.page) || 1,
      pageSize: Number(q.pageSize) || 500,
      keyword: q.keyword,
      filter: pickFilter(q, ['status', 'productType', 'billingMode']),
    });
    return okList(data, total);
  }

  @Post()
  @ApiOperation({ summary: '新增服务产品' })
  async create(@Body() body: Partial<ServiceProductRecord>) {
    return okItem(await this.svc.create<ServiceProductRecord>(body));
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑服务产品（含上架/暂停切换）' })
  async update(@Param('id') id: string, @Body() body: Partial<ServiceProductRecord>) {
    const updated = await this.svc.update<ServiceProductRecord>(id, body);
    if (!updated) throw new NotFoundException('服务产品不存在');
    return okItem(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除服务产品' })
  async remove(@Param('id') id: string) {
    const ok = await this.svc.remove(id);
    if (!ok) throw new NotFoundException('服务产品不存在');
    return okItem({ id, removed: true });
  }
}

@Module({
  controllers: [ServiceProductsController],
  providers: [ServiceProductsService],
  exports: [ServiceProductsService],
})
export class ServiceProductsModule {}
