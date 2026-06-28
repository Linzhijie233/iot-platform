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

export interface VoicePoolRecord {
  id: string;
  poolNo: string;
  category: string;
  operator: string;
  basePackage: string;
  totalMinutes: string;
  giftedMinutes: string;
  addOnPackage: string;
  usedMinutes: string;
  remainingMinutes: string;
  remainingRatio: string;
  simCount: number;
}

const SEED: Omit<VoicePoolRecord, never>[] = [
  {
    id: 'voicepool-seed-1',
    poolNo: 'C000003-CMPS100M-01',
    category: '共享池',
    operator: '中国移动',
    basePackage: '移动专业100分钟',
    totalMinutes: '1000分钟',
    giftedMinutes: '2.92分钟',
    addOnPackage: '0分钟',
    usedMinutes: '320分钟',
    remainingMinutes: '680分钟',
    remainingRatio: '68%',
    simCount: 12,
  },
  {
    id: 'voicepool-seed-2',
    poolNo: 'C000003-CMPS1M-01',
    category: '共享池',
    operator: '中国移动',
    basePackage: '移动专业1分钟',
    totalMinutes: '500分钟',
    giftedMinutes: '100.58分钟',
    addOnPackage: '200分钟',
    usedMinutes: '120分钟',
    remainingMinutes: '380分钟',
    remainingRatio: '76%',
    simCount: 30,
  },
];

@Injectable()
export class VoicePoolsService extends BaseCrudService implements OnModuleInit {
  protected readonly collection = 'voicePools';
  protected readonly searchFields = ['poolNo', 'operator', 'basePackage', 'category'];
  constructor(store: StoreService) {
    super(store);
  }
  async onModuleInit(): Promise<void> {
    await this.store.seedIfEmpty(this.collection, SEED);
  }
}

@ApiTags('语音池')
@Controller('voice-pools')
export class VoicePoolsController {
  constructor(private readonly svc: VoicePoolsService) {}

  @Get()
  @ApiOperation({ summary: '语音池分页列表（keyword/category/operator 筛选）' })
  async list(@Query() q: Record<string, string>) {
    const { data, total } = await this.svc.list<VoicePoolRecord>({
      page: Number(q.page) || 1,
      pageSize: Number(q.pageSize) || 20,
      keyword: q.keyword,
      filter: pickFilter(q, ['category', 'operator']),
    });
    return okList(data, total);
  }

  @Post()
  @ApiOperation({ summary: '新增语音池' })
  async create(@Body() body: Partial<VoicePoolRecord>) {
    return okItem(await this.svc.create<VoicePoolRecord>(body));
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑语音池' })
  async update(@Param('id') id: string, @Body() body: Partial<VoicePoolRecord>) {
    const updated = await this.svc.update<VoicePoolRecord>(id, body);
    if (!updated) throw new NotFoundException('语音池不存在');
    return okItem(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除语音池' })
  async remove(@Param('id') id: string) {
    const ok = await this.svc.remove(id);
    if (!ok) throw new NotFoundException('语音池不存在');
    return okItem({ id, removed: true });
  }
}

@Module({
  controllers: [VoicePoolsController],
  providers: [VoicePoolsService],
  exports: [VoicePoolsService],
})
export class VoicePoolsModule {}
