import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  ValidateIf,
} from 'class-validator';

export class QuerySimDataUsageDto {
  @ApiPropertyOptional({
    description: '物联网卡号码（MSISDN）',
    example: '1475500417',
  })
  @ValidateIf((o) => !o.iccid?.trim() && !o.imsi?.trim())
  @IsNotEmpty({ message: '至少需要提供 msisdn、iccid、imsi 之一' })
  @IsString()
  msisdn?: string;

  @ApiPropertyOptional({
    description: 'SIM ICCID',
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
