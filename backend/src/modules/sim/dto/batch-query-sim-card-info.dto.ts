import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  Allow,
  IsOptional,
  IsString,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { BATCH_SIM_CARD_MAX_COUNT } from '../../china-mobile/china-mobile.service';

function parseBatchList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 与 ChinaMobileService.batchQuerySimCardInfo 入参规则一致：三选一、1～N 张 */
@ValidatorConstraint({ name: 'batchQuerySimCardInfoRules', async: false })
export class BatchQuerySimCardInfoRulesConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments) {
    const o = args.object as BatchQuerySimCardInfoDto;
    const ms = parseBatchList(o.msisdns);
    const ic = parseBatchList(o.iccids);
    const im = parseBatchList(o.imeis);
    const kinds = [
      ms.length ? 'msisdns' : '',
      ic.length ? 'iccids' : '',
      im.length ? 'imsis' : '',
    ].filter(Boolean);
    if (kinds.length !== 1) return false;
    const list = ms.length ? ms : ic.length ? ic : im;
    return list.length >= 1 && list.length <= BATCH_SIM_CARD_MAX_COUNT;
  }

  defaultMessage() {
    return `msisdns、iccids、imeis（IMSI）必须有且仅填一类；英文或中文逗号分隔，每类 1～${BATCH_SIM_CARD_MAX_COUNT} 个码号`;
  }
}

export class BatchQuerySimCardInfoDto {
  /**
   * 仅占位以触发 BatchQuerySimCardInfoRulesConstraint，勿在请求体中传。
   */
  @ApiHideProperty()
  @Transform(() => '')
  @Allow()
  @Validate(BatchQuerySimCardInfoRulesConstraint)
  _batchQuerySimCardRules = '';

  @ApiPropertyOptional({
    description: 'MSISDN 列表，英文逗号分隔（与 iccids、imeis 三选一）',
    example: '1475500012,14765804176',
  })
  @IsOptional()
  @IsString()
  msisdns?: string;

  @ApiPropertyOptional({
    description: 'ICCID 列表，英文逗号分隔',
  })
  @IsOptional()
  @IsString()
  iccids?: string;

  @ApiPropertyOptional({
    description:
      'IMSI 列表（《移动.pdf》查询参数 imsis），英文逗号分隔；与 DTO 字段名 imeis 对应',
  })
  @IsOptional()
  @IsString()
  imeis?: string;
}
