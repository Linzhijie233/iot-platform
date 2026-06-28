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

export interface LifecycleEvent {
  time: string;
  title: string;
  description: string;
  color?: 'blue' | 'green' | 'red' | 'gray' | 'orange';
}

export interface PackageLifecycleRecord {
  id: string;
  iccid: string;
  cardNo: string;
  operator: string;
  packageName: string;
  packageType: string;
  deviceName: string;
  customerName: string;
  lifecycleStage: 'pending' | 'active' | 'expiring' | 'grace' | 'suspended' | 'expired';
  effectiveDate: string;
  expireDate: string;
  remainingDays: number;
  autoRenewStatus: 'enabled' | 'disabled';
  serviceStatus: 'running' | 'suspended';
  lastActionTime: string;
  riskNote: string;
  timeline: LifecycleEvent[];
}

const SEED: Omit<PackageLifecycleRecord, never>[] = [
  {
    id: 'pkg-seed-1', iccid: '898604A4192191902141', cardNo: 'CARD-2024-0001', operator: '中国移动',
    packageName: '移动专业100GB x12月', packageType: '周期套餐', deviceName: '冷链终端 A-17', customerName: '顺运冷链',
    lifecycleStage: 'active', effectiveDate: '2026-03-01', expireDate: '2027-02-28', remainingDays: 249,
    autoRenewStatus: 'enabled', serviceStatus: 'running', lastActionTime: '2026-03-01 08:30',
    riskNote: '当前服务稳定，已开启自动续费。',
    timeline: [
      { time: '2026-02-26 15:10', title: '套餐绑定成功', description: '套餐已关联到卡片，等待生效。', color: 'blue' },
      { time: '2026-03-01 08:30', title: '套餐正式生效', description: '系统切换到生效中阶段。', color: 'green' },
    ],
  },
  {
    id: 'pkg-seed-2', iccid: '898604A4192280313034', cardNo: 'CARD-2024-0002', operator: '中国联通',
    packageName: '联通共享流量池 20GB', packageType: '共享池套餐', deviceName: '零售机终端 B-03', customerName: '新零售事业部',
    lifecycleStage: 'expiring', effectiveDate: '2025-05-01', expireDate: '2026-07-10', remainingDays: 16,
    autoRenewStatus: 'disabled', serviceStatus: 'running', lastActionTime: '2026-06-20 14:20',
    riskNote: '16 天后到期，尚未开启自动续费。',
    timeline: [
      { time: '2025-05-01 00:00', title: '套餐生效', description: '进入生效中阶段。', color: 'green' },
      { time: '2026-06-20 14:20', title: '临期预警生成', description: '剩余天数偏低，建议及时处理。', color: 'orange' },
    ],
  },
  {
    id: 'pkg-seed-3', iccid: '898604D5192270879709', cardNo: 'CARD-2024-0003', operator: '中国电信',
    packageName: 'NB 按量套餐 3年', packageType: 'NB 套餐', deviceName: '水表采集器 N-08', customerName: '城市水务',
    lifecycleStage: 'pending', effectiveDate: '2026-07-01', expireDate: '2029-06-30', remainingDays: 1100,
    autoRenewStatus: 'enabled', serviceStatus: 'running', lastActionTime: '2026-06-09 11:00',
    riskNote: '套餐已购买，等待设备批量启用后自动生效。',
    timeline: [{ time: '2026-06-09 11:00', title: '套餐已创建', description: '等待统一生效时间到达。', color: 'blue' }],
  },
  {
    id: 'pkg-seed-4', iccid: '898604D5192270879708', cardNo: 'CARD-2024-0004', operator: '中国移动',
    packageName: '移动专业1GB x1月', packageType: '周期套餐', deviceName: '车载终端 C-11', customerName: '车联网项目组',
    lifecycleStage: 'grace', effectiveDate: '2026-05-01', expireDate: '2026-06-18', remainingDays: -6,
    autoRenewStatus: 'disabled', serviceStatus: 'running', lastActionTime: '2026-06-20 09:40',
    riskNote: '已进入宽限期，需要续费或切换套餐。',
    timeline: [
      { time: '2026-05-01 09:00', title: '套餐生效', description: '按月套餐开始计费。', color: 'green' },
      { time: '2026-06-19 00:05', title: '进入宽限期', description: '套餐到期后进入宽限处理窗口。', color: 'orange' },
    ],
  },
  {
    id: 'pkg-seed-5', iccid: '898604A4192280313048', cardNo: 'CARD-2024-0005', operator: '中国联通',
    packageName: '联通视频监控 5GB', packageType: '定向套餐', deviceName: '监控终端 M-02', customerName: '安防事业部',
    lifecycleStage: 'suspended', effectiveDate: '2026-02-01', expireDate: '2026-05-31', remainingDays: -24,
    autoRenewStatus: 'disabled', serviceStatus: 'suspended', lastActionTime: '2026-06-08 18:10',
    riskNote: '套餐过期且已停机，需先续费或切换资费。',
    timeline: [
      { time: '2026-02-01 08:00', title: '套餐生效', description: '监控套餐开始服务。', color: 'green' },
      { time: '2026-06-08 18:10', title: '停机执行', description: '当前记录进入已停机阶段。', color: 'red' },
    ],
  },
  {
    id: 'pkg-seed-6', iccid: '8986032400000001202', cardNo: 'CARD-2024-0006', operator: '中国电信',
    packageName: '电信基础定位 100MB', packageType: '周期套餐', deviceName: '定位器 L-20', customerName: '资产定位组',
    lifecycleStage: 'expired', effectiveDate: '2025-01-01', expireDate: '2026-03-15', remainingDays: -101,
    autoRenewStatus: 'disabled', serviceStatus: 'suspended', lastActionTime: '2026-04-01 10:00',
    riskNote: '生命周期已结束，建议归档或重新订购。',
    timeline: [
      { time: '2025-01-01 09:00', title: '套餐生效', description: '套餐开始使用。', color: 'green' },
      { time: '2026-04-01 10:00', title: '生命周期归档', description: '记录进入已失效阶段。', color: 'gray' },
    ],
  },
];

@Injectable()
export class PackagesService extends BaseCrudService implements OnModuleInit {
  protected readonly collection = 'packages';
  protected readonly searchFields = ['iccid', 'cardNo', 'deviceName', 'customerName', 'packageName'];
  constructor(store: StoreService) {
    super(store);
  }
  async onModuleInit(): Promise<void> {
    await this.store.seedIfEmpty(this.collection, SEED);
  }
}

@ApiTags('套餐生命周期')
@Controller('packages')
export class PackagesController {
  constructor(private readonly svc: PackagesService) {}

  @Get()
  @ApiOperation({ summary: '套餐分页列表（keyword/operator/packageType/lifecycleStage 筛选）' })
  async list(@Query() q: Record<string, string>) {
    const { data, total } = await this.svc.list<PackageLifecycleRecord>({
      page: Number(q.page) || 1,
      pageSize: Number(q.pageSize) || 500,
      keyword: q.keyword,
      filter: pickFilter(q, ['operator', 'packageType', 'lifecycleStage', 'autoRenewStatus']),
    });
    return okList(data, total);
  }

  @Post()
  @ApiOperation({ summary: '新增套餐（界面手动录入）' })
  async create(@Body() body: Partial<PackageLifecycleRecord>) {
    return okItem(await this.svc.create<PackageLifecycleRecord>(body));
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑套餐' })
  async update(@Param('id') id: string, @Body() body: Partial<PackageLifecycleRecord>) {
    const updated = await this.svc.update<PackageLifecycleRecord>(id, body);
    if (!updated) throw new NotFoundException('套餐不存在');
    return okItem(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除套餐' })
  async remove(@Param('id') id: string) {
    const ok = await this.svc.remove(id);
    if (!ok) throw new NotFoundException('套餐不存在');
    return okItem({ id, removed: true });
  }
}

@Module({
  controllers: [PackagesController],
  providers: [PackagesService],
  exports: [PackagesService],
})
export class PackagesModule {}
