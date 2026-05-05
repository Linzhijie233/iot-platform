import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SimStopReasonItemDto {
  @ApiProperty({ example: 'OneLink-CT', description: '管理平台' })
  platformType: string;

  @ApiProperty({
    example: '000020000020',
    description: '停机原因码（12 位，可多原因叠加）',
  })
  stopReason: string;

  @ApiPropertyOptional({ description: '停机原因说明' })
  shutdownReasonDesc?: string;
}

export class SimStopReasonQueryResponseDto {
  @ApiProperty({ description: '网关 traceId' })
  traceId: string;

  @ApiProperty({ example: '正确' })
  msg: string;

  @ApiProperty({ type: SimStopReasonItemDto, isArray: true })
  data: SimStopReasonItemDto[];
}
