import { Injectable, OnModuleInit, Module } from '@nestjs/common';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseCrudService } from '../../common/base-crud.service';
import { okItem, okList, pickFilter } from '../../common/api-response';
import { StoreService } from '../../persistence/store.service';

export interface FlowPoolRecord {
  id: string;
  poolNo: string;
  category: string;
  operator: string;
  basePackage: string;
  totalTraffic: string;
  giftedTraffic: string;
  fuelPackage: string;
  usedTraffic: string;
  remainingTraffic: string;
  remainingRatio: string;
  simCount: number;
}

const SEED: Omit<FlowPoolRecord, never>[] = [
  {
    id: 'flowpool-seed-1',
    poolNo: 'C000003-CMPS100G-01',
    category: '共享池',
    operator: '中国移动',
    basePackage: '移动专业100GB',
    totalTraffic: '100GB',
    giftedTraffic: '0.0292GB',
    fuelPackage: '0GB',
    usedTraffic: '3.5GB',
    remainingTraffic: '96.5GB',
    remainingRatio: '96%',
    simCount: 12,
  },
  {
    id: 'flowpool-seed-2',
    poolNo: 'C000003-CMPS1G-01',
    category: '共享池',
    operator: '中国移动',
    basePackage: '移动专业1GB',
    totalTraffic: '50GB',
    giftedTraffic: '1.0058GB',
    fuelPackage: '2GB',
    usedTraffic: '27GB',
    remainingTraffic: '23GB',
    remainingRatio: '46%',
    simCount: 50,
  },
];

@Injectable()
export class FlowPoolsService extends BaseCrudService implements OnModuleInit {
  protected readonly collection = 'flowPools';
  protected readonly searchFields = ['poolNo', 'operator', 'basePackage', 'category'];
  constructor(store: StoreService) {
    super(store);
  }
  async onModuleInit(): Promise<void> {
    await this.store.seedIfEmpty(this.collection, SEED);
  }
}

@ApiTags('流量池')
@Controller('flow-pools')
export class FlowPoolsController {
  constructor(private readonly svc: FlowPoolsService) {}

  @Get()
  @ApiOperation({ summary: '流量池分页列表（keyword/category/operator 筛选）' })
  async list(@Query() q: Record<string, string>) {
    const { data, total } = await this.svc.list<FlowPoolRecord>({
      page: Number(q.page) || 1,
      pageSize: Number(q.pageSize) || 20,
      keyword: q.keyword,
      filter: pickFilter(q, ['category', 'operator']),
    });
    return okList(data, total);
  }

  @Post()
  @ApiOperation({ summary: '新增流量池（界面手动录入）' })
  async create(@Body() body: Partial<FlowPoolRecord>) {
    return okItem(await this.svc.create<FlowPoolRecord>(body));
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑流量池' })
  async update(@Param('id') id: string, @Body() body: Partial<FlowPoolRecord>) {
    const updated = await this.svc.update<FlowPoolRecord>(id, body);
    if (!updated) throw new NotFoundException('流量池不存在');
    return okItem(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除流量池' })
  async remove(@Param('id') id: string) {
    const ok = await this.svc.remove(id);
    if (!ok) throw new NotFoundException('流量池不存在');
    return okItem({ id, removed: true });
  }
}

@Module({
  controllers: [FlowPoolsController],
  providers: [FlowPoolsService],
  exports: [FlowPoolsService],
})
export class FlowPoolsModule {}
