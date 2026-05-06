import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
} from 'class-validator';
import { BATCH_QRY_SIM_INFO_MAX_ACCESS_NUMBERS } from '../../china-telecom/china-telecom.service';

/** 对接电信 CTIOT_5GCMP_BQ018 `batchQrySimInfo`（接入号 MSISDN 等） */
export class BatchTelecomQrySimInfoDto {
  @ApiProperty({
    description: '客户编码（客户 custNumber，文档必填）',
    example: 'CUST001',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  custNumber: string;

  @ApiProperty({
    description: `接入号码列表，1～${BATCH_QRY_SIM_INFO_MAX_ACCESS_NUMBERS} 条`,
    example: ['14912061160', '14912061161'],
    type: [String],
  })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((s) => String(s).trim()).filter(Boolean)
      : [],
  )
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(BATCH_QRY_SIM_INFO_MAX_ACCESS_NUMBERS)
  @IsString({ each: true })
  accessNumbers: string[];

  @ApiPropertyOptional({
    description: '集团客户分组 id，可选；不传时按接口约定送空串',
    example: '',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null
      ? value
      : typeof value === 'string'
        ? value.trim()
        : value,
  )
  @IsString()
  groupId?: string;

  @ApiPropertyOptional({
    description:
      '卡状态筛选：1-可激活 … 6-运营商管理状态等；不传时送空串表示不过滤',
    example: '',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null
      ? value
      : typeof value === 'string'
        ? value.trim()
        : value,
  )
  @IsString()
  simStatus?: string;
}
