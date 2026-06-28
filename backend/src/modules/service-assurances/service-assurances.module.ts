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

export interface AssuranceRecord {
  id: string;
  ticketNo: string;
  customerName: string;
  productName: string;
  assuranceType: '异常通知' | '客服协同' | 'SLA跟踪';
  status: 'open' | 'responding' | 'resolved' | 'breach-risk';
  priority: '高' | '中' | '低';
  createTime: string;
  deadline: string;
  owner: string;
  channel: string;
  remark: string;
}

const SEED: Omit<AssuranceRecord, never>[] = [
  { id: 'as-seed-1', ticketNo: 'AST-2026-0001', customerName: '顺运冷链', productName: '设备在线监测服务', assuranceType: '异常通知', status: 'open', priority: '高', createTime: '2026-06-24 08:40', deadline: '2026-06-24 10:40', owner: '客服支持组', channel: '短信 + 站内信', remark: '客户反馈批量离线告警未按约定发送。' },
  { id: 'as-seed-2', ticketNo: 'AST-2026-0002', customerName: '新零售事业部', productName: '设备异常告警服务', assuranceType: '客服协同', status: 'responding', priority: '中', createTime: '2026-06-23 15:20', deadline: '2026-06-24 15:20', owner: '客户成功组', channel: '工单系统', remark: '门店多次误报，需要客服协同确认阈值配置。' },
  { id: 'as-seed-3', ticketNo: 'AST-2026-0003', customerName: '城市水务', productName: '守护码映射服务', assuranceType: 'SLA跟踪', status: 'resolved', priority: '低', createTime: '2026-06-22 09:00', deadline: '2026-06-22 18:00', owner: '平台产品组', channel: '邮件', remark: '接口抖动已恢复，SLA记录已补齐。' },
  { id: 'as-seed-4', ticketNo: 'AST-2026-0004', customerName: '车联网项目组', productName: '客服协同服务', assuranceType: 'SLA跟踪', status: 'breach-risk', priority: '高', createTime: '2026-06-24 07:30', deadline: '2026-06-24 09:30', owner: '客服支持组', channel: '电话 + 工单', remark: '存在未在 SLA 时限内响应的风险，需要立即升级。' },
];

@Injectable()
export class ServiceAssurancesService extends BaseCrudService implements OnModuleInit {
  protected readonly collection = 'serviceAssurances';
  protected readonly searchFields = ['ticketNo', 'customerName', 'productName', 'owner', 'channel'];
  constructor(store: StoreService) {
    super(store);
  }
  async onModuleInit(): Promise<void> {
    await this.store.seedIfEmpty(this.collection, SEED);
  }
}

@ApiTags('服务保障')
@Controller('service-assurances')
export class ServiceAssurancesController {
  constructor(private readonly svc: ServiceAssurancesService) {}

  @Get()
  @ApiOperation({ summary: '服务保障单分页列表（keyword/status/assuranceType/priority 筛选）' })
  async list(@Query() q: Record<string, string>) {
    const { data, total } = await this.svc.list<AssuranceRecord>({
      page: Number(q.page) || 1,
      pageSize: Number(q.pageSize) || 500,
      keyword: q.keyword,
      filter: pickFilter(q, ['status', 'assuranceType', 'priority']),
    });
    return okList(data, total);
  }

  @Post()
  @ApiOperation({ summary: '新增保障单' })
  async create(@Body() body: Partial<AssuranceRecord>) {
    return okItem(await this.svc.create<AssuranceRecord>(body));
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑保障单（含升级/关闭状态）' })
  async update(@Param('id') id: string, @Body() body: Partial<AssuranceRecord>) {
    const updated = await this.svc.update<AssuranceRecord>(id, body);
    if (!updated) throw new NotFoundException('保障单不存在');
    return okItem(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除保障单' })
  async remove(@Param('id') id: string) {
    const ok = await this.svc.remove(id);
    if (!ok) throw new NotFoundException('保障单不存在');
    return okItem({ id, removed: true });
  }
}

@Module({
  controllers: [ServiceAssurancesController],
  providers: [ServiceAssurancesService],
  exports: [ServiceAssurancesService],
})
export class ServiceAssurancesModule {}
