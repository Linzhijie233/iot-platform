import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomInt } from 'crypto';

/**
 * 雁飞智连 / 蜂窝平台（gwapi.10646.cn）JSON 请求体中的公共鉴权字段。
 * 见《雁飞智连平台 API 接口用户手册》第二章「鉴权参数和业务负载参数」及各接口参数说明。
 */
export type ChinaUnicomGatewayAuthBody = {
  app_id: string;
  timestamp: string;
  trans_id: string;
  token: string;
};

const CONFIG_APP_ID = 'UNICOM_CELLULAR_APP_ID';
const CONFIG_APP_SECRET = 'UNICOM_CELLULAR_APP_SECRET';

@Injectable()
export class ChinaUnicomService {
  constructor(private readonly config: ConfigService) {}

  /**
   * 生成一次请求所需的 `app_id`、`timestamp`、`trans_id`、`token`，可直接展开到 POST JSON 根级。
   * `token` 算法：对 UTF-8 字符串做 SHA-256，输出 64 位小写十六进制（与手册示例长度一致）。
   * 待签名字符串顺序为 `app_id + timestamp + trans_id + app_secret`（手册指向《能力使用者接入指引 V2.7》SDK，此处与参数说明中四元组一致；若与贵司拿到的官方工具不一致，请对照该指引或工具调整拼接顺序）。
   */
  buildAuthBody(input?: {
    /** 默认 `new Date()`；单测或重放时可注入 */
    at?: Date;
    /** 不传则按手册生成 `YYYYMMDDHHmmss`+毫秒(3)+随机(6) */
    transId?: string;
    /** 不传则按手册生成 `yyyy-MM-dd HH:mm:ss SSS` */
    timestamp?: string;
  }): ChinaUnicomGatewayAuthBody {
    const appId = this.config.get<string>(CONFIG_APP_ID);
    const appSecret = this.config.get<string>(CONFIG_APP_SECRET);
    if (!appId?.trim() || !appSecret?.trim()) {
      throw new Error(
        `请在环境变量中配置 ${CONFIG_APP_ID} 与 ${CONFIG_APP_SECRET}（能力订购中的 app_id / app_secret）`,
      );
    }
    const at = input?.at ?? new Date();
    const timestamp =
      input?.timestamp ?? ChinaUnicomService.formatRequestTimestamp(at);
    const transId = input?.transId ?? ChinaUnicomService.generateTransId(at);
    const token = ChinaUnicomService.computeToken({
      appId: appId.trim(),
      appSecret: appSecret.trim(),
      timestamp,
      transId,
    });
    return {
      app_id: appId.trim(),
      timestamp,
      trans_id: transId,
      token,
    };
  }

  /** 与 {@link buildAuthBody} 相同算法，便于单测或自定义 appId/密钥来源 */
  static computeToken(parts: {
    appId: string;
    appSecret: string;
    timestamp: string;
    transId: string;
  }): string {
    const plain = `${parts.appId}${parts.timestamp}${parts.transId}${parts.appSecret}`;
    return createHash('sha256').update(plain, 'utf8').digest('hex');
  }

  /**
   * 手册：`yyyy-MM-dd HH:mm:ss SSS`（毫秒与前段之间为空格，如 `2018-12-05 10:23:35 649`）
   */
  static formatRequestTimestamp(d: Date): string {
    const p2 = (n: number) => String(n).padStart(2, '0');
    const p3 = (n: number) => String(n).padStart(3, '0');
    return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())} ${p3(d.getMilliseconds())}`;
  }

  /**
   * 手册：`YYYYMMDDHHmmss` + 毫秒(3) + 6 位随机数（示例 `…715500357` 共 23 位主体）
   */
  static generateTransId(d: Date = new Date()): string {
    const p2 = (n: number) => String(n).padStart(2, '0');
    const p3 = (n: number) => String(n).padStart(3, '0');
    const ymdhms =
      `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}` +
      `${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}` +
      `${p3(d.getMilliseconds())}`;
    const suffix = String(randomInt(0, 1_000_000)).padStart(6, '0');
    return `${ymdhms}${suffix}`;
  }
}
