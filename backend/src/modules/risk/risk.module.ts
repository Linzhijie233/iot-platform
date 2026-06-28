import {
  BadRequestException,
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
import { okItem, okList, pickFilter } from '../../common/api-response';
import { StoreService } from '../../persistence/store.service';

type RiskResource = 'whitelist' | 'rules' | 'hits';

const RESOURCES: Record<RiskResource, { coll: string; search: string[] }> = {
  whitelist: { coll: 'riskWhitelist', search: ['name', 'objectName', 'scope', 'remark'] },
  rules: { coll: 'riskRules', search: ['ruleName', 'riskType', 'conditionSummary', 'remark'] },
  hits: { coll: 'riskHits', search: ['objectName', 'matchedRule', 'suggestion', 'remark'] },
};

const FILTER_KEYS = ['objectType', 'status', 'riskLevel', 'riskType', 'handlingStatus'];

const WHITELIST_SEED = [
  { id: 'wl-seed-1', name: '重点客户卡放行', objectName: '898604A4192191902141', objectType: 'card', scope: '忽略高频上下线与异常流量预警', validPeriod: '2026-04-01 至 2026-06-30', status: 'enabled', creator: '运营主管', remark: '客户联调期内放行' },
  { id: 'wl-seed-2', name: '巡检设备白名单', objectName: '巡检终端 A-17', objectType: 'device', scope: '忽略夜间位置漂移风险', validPeriod: '长期有效', status: 'enabled', creator: '风控专员', remark: '设备在跨区域作业场景中使用' },
  { id: 'wl-seed-3', name: '战略客户临时放行', objectName: '顺运冷链', objectType: 'customer', scope: '忽略批量换卡 7 日内触发规则', validPeriod: '2026-04-01 至 2026-04-20', status: 'disabled', creator: '客户经理', remark: '项目切换已完成，待确认是否恢复' },
];

const RULES_SEED = [
  { id: 'rule-seed-1', ruleName: '单卡短时高频上下线', riskType: '连接异常', objectType: 'card', conditionSummary: '30分钟内离在线切换超过10次', action: 'alert', status: 'enabled', lastHitTime: '2026-06-24 09:20', hitCount: 38, remark: '用于发现疑似信号异常或设备抖动' },
  { id: 'rule-seed-2', ruleName: '设备跨省异常迁移', riskType: '位置异常', objectType: 'device', conditionSummary: '24小时内跨省上线且设备未报备', action: 'review', status: 'enabled', lastHitTime: '2026-06-24 10:05', hitCount: 12, remark: '用于识别非计划迁移或被盗风险' },
  { id: 'rule-seed-3', ruleName: '客户批量停机风险', riskType: '经营风险', objectType: 'customer', conditionSummary: '同一客户24小时内停机卡数超过20张', action: 'suspend', status: 'disabled', lastHitTime: '2026-06-23 18:30', hitCount: 4, remark: '当前暂停，等待策略复核' },
];

const HITS_SEED = [
  { id: 'hit-seed-1', objectName: '898604A4192280313048', objectType: 'card', matchedRule: '单卡短时高频上下线', riskLevel: 'high', eventTime: '2026-06-24 09:20', handlingStatus: '待处理', suggestion: '建议立即排查设备供电与信号环境', remark: '已连续 3 次重复命中' },
  { id: 'hit-seed-2', objectName: '水表采集器 N-08', objectType: 'device', matchedRule: '设备跨省异常迁移', riskLevel: 'medium', eventTime: '2026-06-24 10:05', handlingStatus: '人工复核中', suggestion: '建议联系项目负责人确认是否跨区施工', remark: '轨迹变化发生在凌晨 2 点' },
  { id: 'hit-seed-3', objectName: '顺运冷链', objectType: 'customer', matchedRule: '客户批量停机风险', riskLevel: 'low', eventTime: '2026-06-23 18:30', handlingStatus: '已忽略', suggestion: '建议核对白名单是否仍在有效期内', remark: '历史项目切换导致批量停机' },
];

@Injectable()
export class RiskService implements OnModuleInit {
  constructor(private readonly store: StoreService) {}

  async onModuleInit(): Promise<void> {
    await this.store.seedIfEmpty(RESOURCES.whitelist.coll, WHITELIST_SEED);
    await this.store.seedIfEmpty(RESOURCES.rules.coll, RULES_SEED);
    await this.store.seedIfEmpty(RESOURCES.hits.coll, HITS_SEED);
  }

  private resolve(resource: string) {
    const r = RESOURCES[resource as RiskResource];
    if (!r) throw new BadRequestException(`未知风控资源：${resource}`);
    return r;
  }

  list(resource: string, q: Record<string, string>) {
    const { coll, search } = this.resolve(resource);
    return this.store.list(coll, {
      page: Number(q.page) || 1,
      pageSize: Number(q.pageSize) || 500,
      search: q.keyword ? { keyword: q.keyword, fields: search } : undefined,
      filter: pickFilter(q, FILTER_KEYS),
    });
  }
  create(resource: string, body: Record<string, unknown>) {
    return this.store.create(this.resolve(resource).coll, body);
  }
  update(resource: string, id: string, body: Record<string, unknown>) {
    return this.store.update(this.resolve(resource).coll, id, body);
  }
  remove(resource: string, id: string) {
    return this.store.remove(this.resolve(resource).coll, id);
  }
}

@ApiTags('风控管理')
@Controller('risk')
export class RiskController {
  constructor(private readonly risk: RiskService) {}

  @Get(':resource')
  @ApiOperation({ summary: '风控资源列表（resource=whitelist|rules|hits）' })
  async list(@Param('resource') resource: string, @Query() q: Record<string, string>) {
    const { data, total } = await this.risk.list(resource, q);
    return okList(data, total);
  }

  @Post(':resource')
  @ApiOperation({ summary: '新增风控资源（界面手动录入）' })
  async create(@Param('resource') resource: string, @Body() body: Record<string, unknown>) {
    return okItem(await this.risk.create(resource, body));
  }

  @Patch(':resource/:id')
  @ApiOperation({ summary: '编辑风控资源（启用/停用、标记处理等）' })
  async update(
    @Param('resource') resource: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const updated = await this.risk.update(resource, id, body);
    if (!updated) throw new NotFoundException('记录不存在');
    return okItem(updated);
  }

  @Delete(':resource/:id')
  @ApiOperation({ summary: '删除风控资源' })
  async remove(@Param('resource') resource: string, @Param('id') id: string) {
    const ok = await this.risk.remove(resource, id);
    if (!ok) throw new NotFoundException('记录不存在');
    return okItem({ id, removed: true });
  }
}

@Module({
  controllers: [RiskController],
  providers: [RiskService],
  exports: [RiskService],
})
export class RiskModule {}
