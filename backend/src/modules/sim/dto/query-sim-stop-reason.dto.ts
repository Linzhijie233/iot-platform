import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  ValidateIf,
} from 'class-validator';

export class QuerySimStopReasonDto {
  @ApiPropertyOptional({
    description: '手机号（11 位）',
    example: '14765804176',
  })
  @ValidateIf((o) => !o.iccid?.trim() && !o.imsi?.trim())
  @IsNotEmpty({ message: '至少需要提供 msisdn、iccid、imsi 之一' })
  @IsString()
  msisdn?: string;

  @ApiPropertyOptional({
    description: 'SIM ICCID',
    example: '898600D6991330004146',
  })
  @ValidateIf((o) => !o.msisdn?.trim() && !o.imsi?.trim())
  @IsNotEmpty({ message: '至少需要提供 msisdn、iccid、imsi 之一' })
  @IsString()
  iccid?: string;

  @ApiPropertyOptional({
    description: 'IMSI',
    example: '460079650004176',
  })
  @ValidateIf((o) => !o.msisdn?.trim() && !o.iccid?.trim())
  @IsNotEmpty({ message: '至少需要提供 msisdn、iccid、imsi 之一' })
  @IsString()
  imsi?: string;
}
