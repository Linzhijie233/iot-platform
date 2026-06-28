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

export interface ServiceOperationRecord {
  id: string;
  orderNo: string;
  customerName: string;
  productName: string;
  operationType: '续费' | '升级' | '停服' | '恢复';
  status: 'pending' | 'processing' | 'completed' | 'blocked';
  submitTime: string;
  targetDate: string;
  owner: string;
  impactScope: string;
  remark: string;
}

const SEED: Omit<ServiceOperationRecord, never>[] = [
  { id: 'op-seed-1', orderNo: 'OPS-2026-0001', customerName: '顺运冷链', productName: '设备在线监测服务', operationType: '续费', status: 'pending', submitTime: '2026-06-22 09:10', targetDate: '2026-06-25', owner: '服务运营组', impactScope: '冷链监测标准版', remark: '客户要求续费 1 年并保留现有 SLA。' },
  { id: 'op-seed-2', orderNo: 'OPS-2026-0002', customerName: '新零售事业部', productName: '设备异常告警服务', operationType: '升级', status: 'processing', submitTime: '2026-06-21 14:20', targetDate: '2026-06-24', owner: '客户成功组', impactScope: '门店告警协同版', remark: '升级到增强告警版本并追加短信通知能力。' },
  { id: 'op-seed-3', orderNo: 'OPS-2026-0003', customerName: '城市水务', productName: '守护码映射服务', operationType: '恢复', status: 'completed', submitTime: '2026-06-20 11:05', targetDate: '2026-06-20', owner: '平台产品组', impactScope: '映射能力试运行', remark: '环境配置完成，已恢复实例调用。' },
  { id: 'op-seed-4', orderNo: 'OPS-2026-0004', customerName: '车联网项目组', productName: '客服协同服务', operationType: '停服', status: 'blocked', submitTime: '2026-06-19 16:30', targetDate: '2026-06-23', owner: '客服支持组', impactScope: '车辆售后支撑版', remark: '存在未关闭工单，暂不允许直接停服。' },
];

@Injectable()
export class ServiceOperationsService extends BaseCrudService implements OnModuleInit {
  protected readonly collection = 'serviceOperations';
  protected readonly searchFields = ['orderNo', 'customerName', 'productName', 'impactScope', 'owner'];
  constructor(store: StoreService) {
    super(store);
  }
  async onModuleInit(): Promise<void> {
    await this.store.seedIfEmpty(this.collection, SEED);
  }
}

@ApiTags('服务运营')
@Controller('service-operations')
export class ServiceOperationsController {
  constructor(private readonly svc: ServiceOperationsService) {}

  @Get()
  @ApiOperation({ summary: '服务运营单分页列表（keyword/status/operationType 筛选）' })
  async list(@Query() q: Record<string, string>) {
    const { data, total } = await this.svc.list<ServiceOperationRecord>({
      page: Number(q.page) || 1,
      pageSize: Number(q.pageSize) || 500,
      keyword: q.keyword,
      filter: pickFilter(q, ['status', 'operationType']),
    });
    return okList(data, total);
  }

  @Post()
  @ApiOperation({ summary: '新增运营单' })
  async create(@Body() body: Partial<ServiceOperationRecord>) {
    return okItem(await this.svc.create<ServiceOperationRecord>(body));
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑运营单（含转派/关闭状态）' })
  async update(@Param('id') id: string, @Body() body: Partial<ServiceOperationRecord>) {
    const updated = await this.svc.update<ServiceOperationRecord>(id, body);
    if (!updated) throw new NotFoundException('运营单不存在');
    return okItem(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除运营单' })
  async remove(@Param('id') id: string) {
    const ok = await this.svc.remove(id);
    if (!ok) throw new NotFoundException('运营单不存在');
    return okItem({ id, removed: true });
  }
}

@Module({
  controllers: [ServiceOperationsController],
  providers: [ServiceOperationsService],
  exports: [ServiceOperationsService],
})
export class ServiceOperationsModule {}
