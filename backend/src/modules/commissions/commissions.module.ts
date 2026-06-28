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

export interface CommissionSummaryRecord {
  id: string;
  settlementType: string;
  period: string;
  orderTotalAmount: number;
  costTotalAmount: number;
  marginTotalAmount: number;
  commissionRatio: string;
  commissionAmount: number;
}

const SEED: Omit<CommissionSummaryRecord, never>[] = [
  { id: 'com-seed-1', settlementType: '每 1 个月/次', period: '202606', orderTotalAmount: 199.0, costTotalAmount: 120.0, marginTotalAmount: 79.0, commissionRatio: '30%', commissionAmount: 23.7 },
  { id: 'com-seed-2', settlementType: '每 1 个月/次', period: '202603', orderTotalAmount: 12.14, costTotalAmount: 9.14, marginTotalAmount: 3.0, commissionRatio: '70%', commissionAmount: 2.85 },
  { id: 'com-seed-3', settlementType: '每 1 个月/次', period: '202512', orderTotalAmount: 44.22, costTotalAmount: 34.17, marginTotalAmount: 10.05, commissionRatio: '30%', commissionAmount: 3.06 },
];

@Injectable()
export class CommissionsService extends BaseCrudService implements OnModuleInit {
  protected readonly collection = 'commissions';
  protected readonly searchFields = ['settlementType', 'period'];
  constructor(store: StoreService) {
    super(store);
  }
  async onModuleInit(): Promise<void> {
    await this.store.seedIfEmpty(this.collection, SEED);
  }
}

@ApiTags('分佣管理')
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly svc: CommissionsService) {}

  @Get()
  @ApiOperation({ summary: '分佣汇总分页列表（keyword/period 筛选）' })
  async list(@Query() q: Record<string, string>) {
    const { data, total } = await this.svc.list<CommissionSummaryRecord>({
      page: Number(q.page) || 1,
      pageSize: Number(q.pageSize) || 500,
      keyword: q.keyword,
      filter: pickFilter(q, ['period', 'settlementType']),
    });
    return okList(data, total);
  }

  @Post()
  @ApiOperation({ summary: '新增分佣记录' })
  async create(@Body() body: Partial<CommissionSummaryRecord>) {
    return okItem(await this.svc.create<CommissionSummaryRecord>(body));
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑分佣记录' })
  async update(@Param('id') id: string, @Body() body: Partial<CommissionSummaryRecord>) {
    const updated = await this.svc.update<CommissionSummaryRecord>(id, body);
    if (!updated) throw new NotFoundException('分佣记录不存在');
    return okItem(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除分佣记录' })
  async remove(@Param('id') id: string) {
    const ok = await this.svc.remove(id);
    if (!ok) throw new NotFoundException('分佣记录不存在');
    return okItem({ id, removed: true });
  }
}

@Module({
  controllers: [CommissionsController],
  providers: [CommissionsService],
  exports: [CommissionsService],
})
export class CommissionsModule {}
