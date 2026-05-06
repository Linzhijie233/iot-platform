import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ChinaMobileV2Service } from '../china-mobile-v2/china-mobile-v2.service';
import { BatchQuerySimCardInfoDto } from './dto/batch-query-sim-card-info.dto';
import { BatchQuerySimCardInfoResponseDto } from './dto/batch-query-sim-card-info-response.dto';

@ApiTags('SIM 卡')
@Controller('sim')
export class SimController {
  constructor(private readonly chinaMobileV2: ChinaMobileV2Service) {}

  @Post('card-info/batch')
  @ApiOperation({
    summary: '批量查询码号信息',
    description:
      '对接 `ChinaMobileV2Service.batchQuerySimCardInfo`：OneLink《移动.pdf》5.1.7（GET transid+token，msisdns / iccids / imsis 三选一，多值英文逗号入参将转为下划线）。',
  })
  @ApiBody({ type: BatchQuerySimCardInfoDto })
  @ApiOkResponse({
    description: '平台外层 status 为 0',
    type: BatchQuerySimCardInfoResponseDto,
  })
  @ApiBadRequestResponse({
    description: '参数校验失败（未三选一、或超限等）',
  })
  batchQueryCardInfo(@Body() body: BatchQuerySimCardInfoDto) {
    return this.chinaMobileV2.batchQuerySimCardInfo({
      msisdns: body.msisdns,
      iccids: body.iccids,
      imeis: body.imeis,
    });
  }
}
