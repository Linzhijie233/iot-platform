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

export interface MerchantRiskRecord {
  id: string;
  merchantName: string;
  merchantNo: string;
  registerStatus: string;
  payMethodStatus: string;
  alipayStatus: string;
  wechatStatus: string;
  serviceValidity: string;
  promotionPeriod: string;
  priceStrategy: string;
  riskControl: string;
  remark: string;
}

const SEED: Omit<MerchantRiskRecord, never>[] = [
  { id: 'mch-seed-1', merchantName: '广东聚晨晋力通信设备科技有限公司', merchantNo: 'QRY250716863113', registerStatus: '已注册', payMethodStatus: '等待开通', alipayStatus: '未开通', wechatStatus: '未开通', serviceValidity: '未开通', promotionPeriod: '未开通', priceStrategy: '标准价格策略（待确认）', riskControl: '正常，无高风险交易拦截', remark: '独立支付认证审核中。' },
  { id: 'mch-seed-2', merchantName: '顺运冷链物流有限公司', merchantNo: 'QRY250716900221', registerStatus: '已注册', payMethodStatus: '已开通', alipayStatus: '已开通', wechatStatus: '已开通', serviceValidity: '2026-12-31', promotionPeriod: '2026-06-01 至 2026-08-31', priceStrategy: '标准价格策略', riskControl: '正常', remark: '渠道分佣按 30% 结算。' },
];

@Injectable()
export class MerchantRisksService extends BaseCrudService implements OnModuleInit {
  protected readonly collection = 'merchantRisks';
  protected readonly searchFields = ['merchantName', 'merchantNo', 'priceStrategy'];
  constructor(store: StoreService) {
    super(store);
  }
  async onModuleInit(): Promise<void> {
    await this.store.seedIfEmpty(this.collection, SEED);
  }
}

@ApiTags('商户与风控')
@Controller('merchant-risks')
export class MerchantRisksController {
  constructor(private readonly svc: MerchantRisksService) {}

  @Get()
  @ApiOperation({ summary: '商户风控分页列表（keyword/registerStatus 筛选）' })
  async list(@Query() q: Record<string, string>) {
    const { data, total } = await this.svc.list<MerchantRiskRecord>({
      page: Number(q.page) || 1,
      pageSize: Number(q.pageSize) || 500,
      keyword: q.keyword,
      filter: pickFilter(q, ['registerStatus']),
    });
    return okList(data, total);
  }

  @Post()
  @ApiOperation({ summary: '新增商户' })
  async create(@Body() body: Partial<MerchantRiskRecord>) {
    return okItem(await this.svc.create<MerchantRiskRecord>(body));
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑商户' })
  async update(@Param('id') id: string, @Body() body: Partial<MerchantRiskRecord>) {
    const updated = await this.svc.update<MerchantRiskRecord>(id, body);
    if (!updated) throw new NotFoundException('商户不存在');
    return okItem(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除商户' })
  async remove(@Param('id') id: string) {
    const ok = await this.svc.remove(id);
    if (!ok) throw new NotFoundException('商户不存在');
    return okItem({ id, removed: true });
  }
}

@Module({
  controllers: [MerchantRisksController],
  providers: [MerchantRisksService],
  exports: [MerchantRisksService],
})
export class MerchantRisksModule {}
