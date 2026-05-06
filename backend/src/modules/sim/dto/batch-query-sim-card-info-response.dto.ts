import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SimCardInfoBatchItemDto {
  @ApiProperty({ example: '0', description: '单卡查询状态，0 成功' })
  status: string;

  @ApiProperty({ example: '正确' })
  message: string;

  @ApiPropertyOptional({ example: '14765004176' })
  msisdn?: string;

  @ApiPropertyOptional({ example: '898600D6991330004146' })
  iccid?: string;

  @ApiPropertyOptional({ example: '460079650004176' })
  imsi?: string;

  @ApiPropertyOptional()
  imei?: string;
}

export class BatchQuerySimCardInfoResponseDto {
  @ApiProperty({
    description: '本次业务请求 transid（与 OneLink 文档一致）',
    example: 'appid202601061200000012345678',
  })
  traceId: string;

  @ApiProperty({ description: '平台应答说明', example: '正确' })
  msg: string;

  @ApiProperty({ type: [SimCardInfoBatchItemDto] })
  data: SimCardInfoBatchItemDto[];
}
