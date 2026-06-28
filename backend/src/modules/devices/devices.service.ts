import { Injectable, OnModuleInit } from '@nestjs/common';
import { BaseCrudService } from '../../common/base-crud.service';
import { StoreService } from '../../persistence/store.service';
import { DEVICE_SEED } from './devices.seed';
import type { DeviceRecord, ShipStatus } from './devices.types';

const SHIP_ORDER: ShipStatus[] = ['待发货', '已发货', '已签收'];

function nowStamp(): string {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

@Injectable()
export class DevicesService extends BaseCrudService implements OnModuleInit {
  protected readonly collection = 'devices';
  protected readonly searchFields = [
    'deviceNo',
    'deviceName',
    'projectName',
    'customerName',
    'cardNo',
    'iccid',
    'imei',
    'guardianCode',
  ];

  constructor(store: StoreService) {
    super(store);
  }

  async onModuleInit(): Promise<void> {
    await this.store.seedIfEmpty(this.collection, DEVICE_SEED);
  }

  /** 发货：待发货 → 已发货 → 已签收（逐级推进） */
  async ship(id: string): Promise<DeviceRecord | null> {
    const device = await this.get<DeviceRecord>(id);
    if (!device) return null;
    const idx = SHIP_ORDER.indexOf(device.shipStatus);
    const next = SHIP_ORDER[Math.min(idx + 1, SHIP_ORDER.length - 1)];
    return this.update<DeviceRecord>(id, { shipStatus: next });
  }

  /** 激活：待激活 → 在线 */
  activate(id: string): Promise<DeviceRecord | null> {
    return this.update<DeviceRecord>(id, {
      status: 'online',
      activateStatus: '已激活',
      onlineRate: '100%',
      lastHeartbeat: nowStamp(),
    });
  }

  /** 清除告警（告警设备恢复在线） */
  async clearAlarm(id: string): Promise<DeviceRecord | null> {
    const device = await this.get<DeviceRecord>(id);
    if (!device) return null;
    const patch: Partial<DeviceRecord> = { alertCount: 0 };
    if (device.status === 'alarm') patch.status = 'online';
    return this.update<DeviceRecord>(id, patch);
  }

  /** 守护码 ↔ ICCID 绑卡 */
  bindCard(
    id: string,
    body: { cardNo?: string; iccid?: string; imei?: string },
  ): Promise<DeviceRecord | null> {
    const patch: Partial<DeviceRecord> = {};
    if (body.cardNo !== undefined) patch.cardNo = body.cardNo;
    if (body.iccid !== undefined) patch.iccid = body.iccid;
    if (body.imei !== undefined) patch.imei = body.imei;
    return this.update<DeviceRecord>(id, patch);
  }

  /** 解绑卡 */
  unbindCard(id: string): Promise<DeviceRecord | null> {
    return this.update<DeviceRecord>(id, { cardNo: '--', iccid: '--' });
  }

  /** 远程参数下发（演示：更新固件版本） */
  dispatchParams(
    id: string,
    body: { firmwareVersion?: string },
  ): Promise<DeviceRecord | null> {
    return this.update<DeviceRecord>(id, {
      firmwareVersion: body.firmwareVersion || 'v-latest',
    });
  }
}
