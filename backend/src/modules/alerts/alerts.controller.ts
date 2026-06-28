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
import { okItem, okList, pickFilter } from '../../common/api-response';
import { AlertsService } from './alerts.service';
import type { AlertRecord, AlertStatus } from './alerts.types';

const FILTER_KEYS = ['type', 'level', 'status', 'operator'];

@ApiTags('告警/风控中心')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  @Get()
  @ApiOperation({ summary: '告警分页列表（keyword/type/level/status 筛选）' })
  async list(@Query() query: Record<string, string>) {
    const { data, total } = await this.alerts.list<AlertRecord>({
      page: Number(query.page) || 1,
      pageSize: Number(query.pageSize) || 20,
      keyword: query.keyword,
      filter: pickFilter(query, FILTER_KEYS),
      sort: { time: -1 },
    });
    return okList(data, total);
  }

  @Get('stats')
  @ApiOperation({ summary: '告警 KPI 统计（总数/待处理/已处理/高危）' })
  async stats() {
    return okItem(await this.alerts.stats());
  }

  @Post()
  @ApiOperation({ summary: '新增告警（界面手动录入）' })
  async create(@Body() body: Partial<AlertRecord>) {
    return okItem(await this.alerts.create<AlertRecord>(body));
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑告警' })
  async update(@Param('id') id: string, @Body() body: Partial<AlertRecord>) {
    const updated = await this.alerts.update<AlertRecord>(id, body);
    if (!updated) throw new NotFoundException('告警不存在');
    return okItem(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除告警' })
  async remove(@Param('id') id: string) {
    const ok = await this.alerts.remove(id);
    if (!ok) throw new NotFoundException('告警不存在');
    return okItem({ id, removed: true });
  }

  @Post(':id/handle')
  @ApiOperation({ summary: '处理告警' })
  async handle(@Param('id') id: string) {
    const a = await this.alerts.handle(id);
    if (!a) throw new NotFoundException('告警不存在');
    return okItem(a);
  }

  @Post(':id/ignore')
  @ApiOperation({ summary: '忽略告警' })
  async ignore(@Param('id') id: string) {
    const a = await this.alerts.ignore(id);
    if (!a) throw new NotFoundException('告警不存在');
    return okItem(a);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量处理/忽略（body: { ids, action }）' })
  async batch(@Body() body: { ids: string[]; action: 'handle' | 'ignore' }) {
    const status: AlertStatus = body.action === 'ignore' ? '已忽略' : '已处理';
    const n = await this.alerts.batch(body.ids ?? [], status);
    return okItem({ updated: n });
  }
}
