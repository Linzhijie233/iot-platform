import { ApiProperty } from '@nestjs/swagger';

export class SimCardInfoBatchItemDto {
  @ApiProperty({ example: '0', description: '单卡查询状态，0 表示成功' })
  status: string;

  @ApiProperty({ example: '查询成功' })
  message: string;

  @ApiProperty({ required: false, example: '13512345678' })
  msisdn?: string;

  @ApiProperty({ required: false })
  iccid?: string;

  @ApiProperty({ required: false })
  imei?: string;
}

export class BatchSimCardInfoQueryResponseDto {
  @ApiProperty()
  traceId: string;

  @ApiProperty({ example: '成功' })
  msg: string;

  @ApiProperty({ type: SimCardInfoBatchItemDto, isArray: true })
  data: SimCardInfoBatchItemDto[];
}
