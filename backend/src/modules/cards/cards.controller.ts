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
import { CardsService } from './cards.service';
import type { CardRecord } from './cards.types';

const FILTER_KEYS = ['tab', 'status', 'operator', 'project', 'cardType'];

@ApiTags('卡片台账')
@Controller('cards')
export class CardsController {
  constructor(private readonly cards: CardsService) {}

  @Get()
  @ApiOperation({ summary: '卡片台账分页列表（支持 keyword/tab/status/operator/project 筛选）' })
  async list(@Query() query: Record<string, string>) {
    const { data, total } = await this.cards.list<CardRecord>({
      page: Number(query.page) || 1,
      pageSize: Number(query.pageSize) || 20,
      keyword: query.keyword,
      filter: pickFilter(query, FILTER_KEYS),
    });
    return okList(data, total);
  }

  @Get(':id')
  @ApiOperation({ summary: '卡片详情' })
  async detail(@Param('id') id: string) {
    const card = await this.cards.get<CardRecord>(id);
    if (!card) throw new NotFoundException('卡片不存在');
    return okItem(card);
  }

  @Post()
  @ApiOperation({ summary: '新增卡片（界面手动录入）' })
  async create(@Body() body: Partial<CardRecord>) {
    const created = await this.cards.create<CardRecord>(body);
    return okItem(created);
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑卡片' })
  async update(@Param('id') id: string, @Body() body: Partial<CardRecord>) {
    const updated = await this.cards.update<CardRecord>(id, body);
    if (!updated) throw new NotFoundException('卡片不存在');
    return okItem(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除卡片' })
  async remove(@Param('id') id: string) {
    const ok = await this.cards.remove(id);
    if (!ok) throw new NotFoundException('卡片不存在');
    return okItem({ id, removed: true });
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: '停机保号' })
  async suspend(@Param('id') id: string) {
    const card = await this.cards.suspend(id);
    if (!card) throw new NotFoundException('卡片不存在');
    return okItem(card);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: '复机 / 开机' })
  async resume(@Param('id') id: string) {
    const card = await this.cards.resume(id);
    if (!card) throw new NotFoundException('卡片不存在');
    return okItem(card);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '注销' })
  async cancel(@Param('id') id: string) {
    const card = await this.cards.cancel(id);
    if (!card) throw new NotFoundException('卡片不存在');
    return okItem(card);
  }
}
