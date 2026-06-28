import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { okItem } from '../../common/api-response';
import { StoreService } from '../../persistence/store.service';

type Row = Record<string, unknown>;

@Injectable()
export class StatsService {
  constructor(private readonly store: StoreService) {}

  private static currentYearMonth(): string {
    return new Date().toISOString().slice(0, 7);
  }

  private static groupCount(rows: Row[], field: string): Record<string, number> {
    const map: Record<string, number> = {};
    for (const r of rows) {
      const key = String(r[field] ?? '未分类');
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }

  /** 看板总览：跨集合实时聚合 */
  async overview() {
    const [cards, devices, alerts, orders, subs] = await Promise.all([
      this.store.all<Row>('cards'),
      this.store.all<Row>('devices'),
      this.store.all<Row>('alerts'),
      this.store.all<Row>('orders'),
      this.store.all<Row>('serviceSubscriptions'),
    ]);

    const totalActive = cards.filter((c) => c.status !== 'cancelled').length;
    const online = cards.filter((c) => c.status === 'online').length;
    const offline = cards.filter((c) => c.status === 'offline').length;
    const suspended = cards.filter((c) => c.status === 'suspended').length;
    const cancelled = cards.filter((c) => c.status === 'cancelled').length;
    const ym = StatsService.currentYearMonth();
    const monthNew = cards.filter((c) => String(c.createdAt ?? '').slice(0, 7) === ym).length;

    const renewOpen = subs.filter((s) => s.renewStatus === '已开启').length;
    const renewRate = subs.length ? renewOpen / subs.length : 0;
    const renewed = Math.round(renewRate * totalActive);

    const orderAmount = orders.reduce((s, o) => s + (Number(o.orderAmount) || 0), 0);
    const commissionAmount = orders.reduce((s, o) => s + (Number(o.commissionAmount) || 0), 0);
    const arpu = totalActive ? Math.round((orderAmount / totalActive) * 10) / 10 : 0;

    const pendingAlerts = alerts.filter((a) => a.status === '待处理').length;

    const operatorDist = Object.entries(StatsService.groupCount(cards, 'operator')).map(
      ([label, value]) => ({ label, value }),
    );
    const projectDist = Object.entries(StatsService.groupCount(cards, 'project'))
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const deviceOnline = devices.filter((d) => d.status === 'online').length;

    return {
      totalActive,
      online,
      offline,
      suspended,
      cancelled,
      renewed,
      arpu,
      alerts: pendingAlerts,
      monthNew,
      operatorDist,
      projectDist,
      deviceTotal: devices.length,
      deviceOnline,
      orderCount: orders.length,
      orderAmount: Math.round(orderAmount * 100) / 100,
      commissionAmount: Math.round(commissionAmount * 100) / 100,
    };
  }
}

@ApiTags('数据看板聚合')
@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('overview')
  @ApiOperation({ summary: '看板总览聚合（卡/设备/告警/订单/订阅实时统计）' })
  async overview() {
    return okItem(await this.stats.overview());
  }
}

@Module({
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
