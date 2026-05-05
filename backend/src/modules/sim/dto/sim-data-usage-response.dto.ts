import { ApiProperty } from '@nestjs/swagger';

export class PccCodeUseAmountItemDto {
  @ApiProperty({ example: '12341234' })
  pccCode: string;

  @ApiProperty({ example: '1024', description: '该 PCC 用量（KB）' })
  pccCodeUseAmount: string;
}

export class ApnUseAmountItemDto {
  @ApiProperty({ example: 'CMIOT' })
  apnName: string;

  @ApiProperty({ example: '1024', description: '该 APN 用量（KB）' })
  apnUseAmount: string;

  @ApiProperty({
    type: PccCodeUseAmountItemDto,
    isArray: true,
    required: false,
  })
  pccCodeUseAmountList?: PccCodeUseAmountItemDto[];
}

export class SimDataUsagePayloadDto {
  @ApiProperty({ example: '1024.00', description: '总用量（KB）' })
  dataAmount: string;

  @ApiProperty({ type: ApnUseAmountItemDto, isArray: true })
  apnUseAmountList: ApnUseAmountItemDto[];
}

export class SimDataUsageQueryResponseDto {
  @ApiProperty()
  traceId: string;

  @ApiProperty({ example: '成功' })
  msg: string;

  @ApiProperty({ type: SimDataUsagePayloadDto })
  data: SimDataUsagePayloadDto;
}
