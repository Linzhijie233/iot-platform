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
import { DevicesService } from './devices.service';
import type { DeviceRecord } from './devices.types';

const FILTER_KEYS = ['status', 'productModel', 'projectName', 'shipStatus', 'activateStatus'];

@ApiTags('设备管理')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Get()
  @ApiOperation({ summary: '设备分页列表（keyword/status/productModel/projectName/shipStatus 筛选）' })
  async list(@Query() query: Record<string, string>) {
    const { data, total } = await this.devices.list<DeviceRecord>({
      page: Number(query.page) || 1,
      pageSize: Number(query.pageSize) || 20,
      keyword: query.keyword,
      filter: pickFilter(query, FILTER_KEYS),
    });
    return okList(data, total);
  }

  @Get(':id')
  @ApiOperation({ summary: '设备详情' })
  async detail(@Param('id') id: string) {
    const device = await this.devices.get<DeviceRecord>(id);
    if (!device) throw new NotFoundException('设备不存在');
    return okItem(device);
  }

  @Post()
  @ApiOperation({ summary: '新增设备（界面手动录入）' })
  async create(@Body() body: Partial<DeviceRecord>) {
    return okItem(await this.devices.create<DeviceRecord>(body));
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑设备' })
  async update(@Param('id') id: string, @Body() body: Partial<DeviceRecord>) {
    const updated = await this.devices.update<DeviceRecord>(id, body);
    if (!updated) throw new NotFoundException('设备不存在');
    return okItem(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除设备' })
  async remove(@Param('id') id: string) {
    const ok = await this.devices.remove(id);
    if (!ok) throw new NotFoundException('设备不存在');
    return okItem({ id, removed: true });
  }

  @Post(':id/ship')
  @ApiOperation({ summary: '发货（待发货→已发货→已签收）' })
  async ship(@Param('id') id: string) {
    const d = await this.devices.ship(id);
    if (!d) throw new NotFoundException('设备不存在');
    return okItem(d);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: '激活设备' })
  async activate(@Param('id') id: string) {
    const d = await this.devices.activate(id);
    if (!d) throw new NotFoundException('设备不存在');
    return okItem(d);
  }

  @Post(':id/clear-alarm')
  @ApiOperation({ summary: '清除告警' })
  async clearAlarm(@Param('id') id: string) {
    const d = await this.devices.clearAlarm(id);
    if (!d) throw new NotFoundException('设备不存在');
    return okItem(d);
  }

  @Post(':id/bind-card')
  @ApiOperation({ summary: '守护码↔ICCID 绑卡' })
  async bindCard(
    @Param('id') id: string,
    @Body() body: { cardNo?: string; iccid?: string; imei?: string },
  ) {
    const d = await this.devices.bindCard(id, body);
    if (!d) throw new NotFoundException('设备不存在');
    return okItem(d);
  }

  @Post(':id/unbind-card')
  @ApiOperation({ summary: '解绑卡' })
  async unbindCard(@Param('id') id: string) {
    const d = await this.devices.unbindCard(id);
    if (!d) throw new NotFoundException('设备不存在');
    return okItem(d);
  }

  @Post(':id/dispatch-params')
  @ApiOperation({ summary: '远程参数下发' })
  async dispatchParams(
    @Param('id') id: string,
    @Body() body: { firmwareVersion?: string },
  ) {
    const d = await this.devices.dispatchParams(id, body);
    if (!d) throw new NotFoundException('设备不存在');
    return okItem(d);
  }
}
