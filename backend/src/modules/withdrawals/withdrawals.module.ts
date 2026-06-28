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

export interface WithdrawRecord {
  id: string;
  orderNo: string;
  withdrawAccount: string;
  amount: number;
  applyTime: string;
  processTime: string;
  status: '待审核' | '处理中' | '已到账';
}

const SEED: Omit<WithdrawRecord, never>[] = [
  { id: 'wd-seed-1', orderNo: 'WD-2026-0001', withdrawAccount: '6224515245158888', amount: 100.0, applyTime: '2026-06-20 10:09', processTime: '--', status: '待审核' },
  { id: 'wd-seed-2', orderNo: 'WD-2026-0002', withdrawAccount: '6224515245158888', amount: 50.0, applyTime: '2026-06-18 14:30', processTime: '2026-06-19 09:00', status: '已到账' },
  { id: 'wd-seed-3', orderNo: 'WD-2026-0003', withdrawAccount: '6228480012345678', amount: 200.0, applyTime: '2026-06-22 16:00', processTime: '--', status: '处理中' },
];

@Injectable()
export class WithdrawalsService extends BaseCrudService implements OnModuleInit {
  protected readonly collection = 'withdrawals';
  protected readonly searchFields = ['orderNo', 'withdrawAccount'];
  constructor(store: StoreService) {
    super(store);
  }
  async onModuleInit(): Promise<void> {
    await this.store.seedIfEmpty(this.collection, SEED);
  }
}

@ApiTags('提现管理')
@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private readonly svc: WithdrawalsService) {}

  @Get()
  @ApiOperation({ summary: '提现记录分页列表（keyword/status 筛选）' })
  async list(@Query() q: Record<string, string>) {
    const { data, total } = await this.svc.list<WithdrawRecord>({
      page: Number(q.page) || 1,
      pageSize: Number(q.pageSize) || 500,
      keyword: q.keyword,
      filter: pickFilter(q, ['status']),
    });
    return okList(data, total);
  }

  @Post()
  @ApiOperation({ summary: '申请提现（界面手动录入）' })
  async create(@Body() body: Partial<WithdrawRecord>) {
    return okItem(await this.svc.create<WithdrawRecord>({ status: '待审核', processTime: '--', ...body }));
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑提现（含审核/到账状态切换）' })
  async update(@Param('id') id: string, @Body() body: Partial<WithdrawRecord>) {
    const updated = await this.svc.update<WithdrawRecord>(id, body);
    if (!updated) throw new NotFoundException('提现记录不存在');
    return okItem(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除提现记录' })
  async remove(@Param('id') id: string) {
    const ok = await this.svc.remove(id);
    if (!ok) throw new NotFoundException('提现记录不存在');
    return okItem({ id, removed: true });
  }
}

@Module({
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService],
  exports: [WithdrawalsService],
})
export class WithdrawalsModule {}
