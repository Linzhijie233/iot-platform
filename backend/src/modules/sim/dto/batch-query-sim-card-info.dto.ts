import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'exactlyOneBatchSimList', async: false })
export class ExactlyOneBatchSimListConstraint
  implements ValidatorConstraintInterface
{
  validate(_: unknown, args: ValidationArguments) {
    const o = args.object as BatchQuerySimCardInfoDto;
    const n = [o.msisdns?.trim(), o.iccids?.trim(), o.imeis?.trim()].filter(
      Boolean,
    ).length;
    return n === 1;
  }

  defaultMessage() {
    return 'msisdns、iccids、imeis（IMSI）必须有且仅填一类（英文逗号分隔，单次最多 100 张）';
  }
}

export class BatchQuerySimCardInfoDto {
  @ApiPropertyOptional({
    description: 'MSISDN 列表，英文逗号分隔（与 iccids、imeis 三选一）',
    example: '1475500012,14765804176',
  })
  @Validate(ExactlyOneBatchSimListConstraint)
  @IsOptional()
  @IsString()
  msisdns?: string;

  @ApiPropertyOptional({
    description: 'ICCID 列表，英文逗号分隔',
  })
  @Validate(ExactlyOneBatchSimListConstraint)
  @IsOptional()
  @IsString()
  iccids?: string;

  @ApiPropertyOptional({
    description:
      'IMSI 列表（《移动.pdf》查询参数 imsis），英文逗号分隔；与 DTO 字段名 imeis 对应',
  })
  @Validate(ExactlyOneBatchSimListConstraint)
  @IsOptional()
  @IsString()
  imeis?: string;
}
