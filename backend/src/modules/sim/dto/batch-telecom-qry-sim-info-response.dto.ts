import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** `data.qrySimInfoList` 单项（字段以电信开放平台实际返回为准） */
export class TelecomQrySimInfoItemDto {
  @ApiPropertyOptional({ example: '14912061160', description: '接入号' })
  accessNumber?: string;

  @ApiPropertyOptional({ description: '查询结果码（如有）', example: '0' })
  result?: string;

  @ApiPropertyOptional({ example: '89861109123456789012' })
  iccid?: string;

  @ApiPropertyOptional({ example: '460110912345678' })
  imsi?: string;

  @ApiPropertyOptional({ description: '卡状态' })
  simStatus?: string;

  @ApiPropertyOptional({ description: '激活时间' })
  activeTime?: string;

  @ApiPropertyOptional({ description: '开户时间' })
  createTime?: string;

  @ApiPropertyOptional({ description: '主套餐名称（如有）' })
  mainOfferName?: string;

  @ApiPropertyOptional({ description: '机卡绑定类型（如有）' })
  cardBindingType?: string;
}

export class BatchTelecomQrySimInfoResponseDto {
  @ApiProperty({ example: '0', description: '电信接口 code，0 表示成功' })
  code: string;

  @ApiProperty({ description: '说明信息', example: 'success' })
  message: string;

  @ApiProperty({
    type: [TelecomQrySimInfoItemDto],
    description: '对应开放平台 data.qrySimInfoList',
  })
  list: TelecomQrySimInfoItemDto[];
}
