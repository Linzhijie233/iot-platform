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

export interface ServiceSubscriptionRecord {
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
}

const SEED: Omit<ServiceSubscriptionRecord, never>[] = [
  { id: 'sub-seed-1', subscriptionNo: 'SUB-2026-0001', customerName: '顺运冷链', productName: '设备在线监测服务', instanceName: '冷链监测标准版', billingMode: '包年', status: 'active', startDate: '2026-01-01', expireDate: '2026-12-31', remainingDays: 190, renewStatus: '已开启', serviceOwner: '客户成功组', latestActionTime: '2026-06-20 10:20', description: '用于冷链设备在线率监测和离线预警。' },
  { id: 'sub-seed-2', subscriptionNo: 'SUB-2026-0002', customerName: '新零售事业部', productName: '设备异常告警服务', instanceName: '门店告警协同版', billingMode: '包月', status: 'expiring', startDate: '2026-06-01', expireDate: '2026-07-05', remainingDays: 11, renewStatus: '未开启', serviceOwner: '客服支持组', latestActionTime: '2026-06-22 17:40', description: '用于售货设备异常告警和客服协同跟进。' },
  { id: 'sub-seed-3', subscriptionNo: 'SUB-2026-0003', customerName: '城市水务', productName: '守护码映射服务', instanceName: '水务映射能力试运行', billingMode: '按量', status: 'paused', startDate: '2026-02-15', expireDate: '2026-08-14', remainingDays: 51, renewStatus: '未开启', serviceOwner: '平台产品组', latestActionTime: '2026-06-10 14:05', description: '用于设备编号、ICCID 和守护码映射的内部能力实例。' },
  { id: 'sub-seed-4', subscriptionNo: 'SUB-2026-0004', customerName: '车联网项目组', productName: '客服协同服务', instanceName: '车辆售后支撑版', billingMode: '包季', status: 'expired', startDate: '2025-12-01', expireDate: '2026-03-31', remainingDays: -85, renewStatus: '未开启', serviceOwner: '客服支持组', latestActionTime: '2026-04-01 09:30', description: '用于服务异常流转、客服协同和升级处理。' },
];

@Injectable()
export class ServiceSubscriptionsService extends BaseCrudService implements OnModuleInit {
  protected readonly collection = 'serviceSubscriptions';
  protected readonly searchFields = ['subscriptionNo', 'customerName', 'productName', 'instanceName', 'serviceOwner'];
  constructor(store: StoreService) {
    super(store);
  }
  async onModuleInit(): Promise<void> {
    await this.store.seedIfEmpty(this.collection, SEED);
  }
}

@ApiTags('服务订阅')
@Controller('service-subscriptions')
export class ServiceSubscriptionsController {
  constructor(private readonly svc: ServiceSubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: '服务订阅分页列表（keyword/status/billingMode/customerName 筛选）' })
  async list(@Query() q: Record<string, string>) {
    const { data, total } = await this.svc.list<ServiceSubscriptionRecord>({
      page: Number(q.page) || 1,
      pageSize: Number(q.pageSize) || 500,
      keyword: q.keyword,
      filter: pickFilter(q, ['status', 'billingMode', 'customerName']),
    });
    return okList(data, total);
  }

  @Post()
  @ApiOperation({ summary: '新增服务订阅' })
  async create(@Body() body: Partial<ServiceSubscriptionRecord>) {
    return okItem(await this.svc.create<ServiceSubscriptionRecord>(body));
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑服务订阅（含停服/恢复切换）' })
  async update(@Param('id') id: string, @Body() body: Partial<ServiceSubscriptionRecord>) {
    const updated = await this.svc.update<ServiceSubscriptionRecord>(id, body);
    if (!updated) throw new NotFoundException('服务订阅不存在');
    return okItem(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除服务订阅' })
  async remove(@Param('id') id: string) {
    const ok = await this.svc.remove(id);
    if (!ok) throw new NotFoundException('服务订阅不存在');
    return okItem({ id, removed: true });
  }
}

@Module({
  controllers: [ServiceSubscriptionsController],
  providers: [ServiceSubscriptionsService],
  exports: [ServiceSubscriptionsService],
})
export class ServiceSubscriptionsModule {}
