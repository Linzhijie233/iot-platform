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

export interface OrderSettlementRecord {
  id: string;
  orderNo: string;
  customerName: string;
  iccid: string;
  msisdn: string;
  packageName: string;
  packageType: string;
  orderAmount: number;
  costAmount: number;
  marginAmount: number;
  commissionAmount: number;
  consumeTime: string;
  statementMonth: string;
  remark: string;
}

const SEED: Omit<OrderSettlementRecord, never>[] = [
  { id: 'ord-seed-1', orderNo: '20260319100849248902', customerName: '智联物流', iccid: '898604D5192290320478', msisdn: '1441354220478', packageName: '移动专业500MB续期1月', packageType: '基础套餐', orderAmount: 0.1, costAmount: 12.1, marginAmount: -12.0, commissionAmount: 0, consumeTime: '2026-03-19 10:08:49', statementMonth: '202603', remark: '续期' },
  { id: 'ord-seed-2', orderNo: '20251215095915098977', customerName: '智联物流', iccid: '898604D5192290320478', msisdn: '1441354220478', packageName: '移动专业500MB续期1月', packageType: '基础套餐', orderAmount: 0.1, costAmount: 12.1, marginAmount: -12.0, commissionAmount: 0, consumeTime: '2025-12-15 09:59:15', statementMonth: '202512', remark: '续期' },
  { id: 'ord-seed-3', orderNo: '20251213184833540213', customerName: '城市水务集团', iccid: '898604D5192270879709', msisdn: '1441352879709', packageName: '移动专业30MB续期12月', packageType: '基础套餐', orderAmount: 43.2, costAmount: 33.15, marginAmount: 10.05, commissionAmount: 3.06, consumeTime: '2025-12-13 18:45:27', statementMonth: '202512', remark: '续期' },
  { id: 'ord-seed-4', orderNo: '20260627105234301741', customerName: '顺运冷链', iccid: '898604D5192290321565', msisdn: '1441354221565', packageName: '移动专业100GB x12月', packageType: '周期套餐', orderAmount: 199.0, costAmount: 120.0, marginAmount: 79.0, commissionAmount: 23.7, consumeTime: '2026-06-20 10:52:35', statementMonth: '202606', remark: '新购' },
];

@Injectable()
export class OrdersService extends BaseCrudService implements OnModuleInit {
  protected readonly collection = 'orders';
  protected readonly searchFields = ['orderNo', 'customerName', 'iccid', 'msisdn', 'packageName'];
  constructor(store: StoreService) {
    super(store);
  }
  async onModuleInit(): Promise<void> {
    await this.store.seedIfEmpty(this.collection, SEED);
  }
}

@ApiTags('订单结算')
@Controller('orders')
export class OrdersController {
  constructor(private readonly svc: OrdersService) {}

  @Get()
  @ApiOperation({ summary: '订单结算分页列表（keyword/customerName/statementMonth 筛选）' })
  async list(@Query() q: Record<string, string>) {
    const { data, total } = await this.svc.list<OrderSettlementRecord>({
      page: Number(q.page) || 1,
      pageSize: Number(q.pageSize) || 500,
      keyword: q.keyword,
      filter: pickFilter(q, ['customerName', 'statementMonth', 'packageType']),
    });
    return okList(data, total);
  }

  @Post()
  @ApiOperation({ summary: '新增订单' })
  async create(@Body() body: Partial<OrderSettlementRecord>) {
    return okItem(await this.svc.create<OrderSettlementRecord>(body));
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑订单' })
  async update(@Param('id') id: string, @Body() body: Partial<OrderSettlementRecord>) {
    const updated = await this.svc.update<OrderSettlementRecord>(id, body);
    if (!updated) throw new NotFoundException('订单不存在');
    return okItem(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除订单' })
  async remove(@Param('id') id: string) {
    const ok = await this.svc.remove(id);
    if (!ok) throw new NotFoundException('订单不存在');
    return okItem({ id, removed: true });
  }
}

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
