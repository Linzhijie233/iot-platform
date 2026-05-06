import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'atLeastOneBatchSimList', async: false })
export class AtLeastOneBatchSimListConstraint
  implements ValidatorConstraintInterface
{
  validate(_: unknown, args: ValidationArguments) {
    const o = args.object as BatchQuerySimCardInfoDto;
    return Boolean(
      o.msisdns?.trim() || o.iccids?.trim() || o.imeis?.trim(),
    );
  }

  defaultMessage() {
    return '至少提供 msisdns、iccids、imeis 之一（英文逗号分隔，合计最多 100 张）';
  }
}

export class BatchQuerySimCardInfoDto {
  @ApiPropertyOptional({
    description: 'MSISDN 列表，英文逗号分隔',
    example: '1475500012,1475500013',
  })
  @Validate(AtLeastOneBatchSimListConstraint)
  @IsOptional()
  @IsString()
  msisdns?: string;

  @ApiPropertyOptional({
    description: 'ICCID 列表，英文逗号分隔',
  })
  @Validate(AtLeastOneBatchSimListConstraint)
  @IsOptional()
  @IsString()
  iccids?: string;

  @ApiPropertyOptional({
    description: 'IMEI 列表，英文逗号分隔',
  })
  @Validate(AtLeastOneBatchSimListConstraint)
  @IsOptional()
  @IsString()
  imeis?: string;
}
