import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ChinaMobileService } from '../china-mobile/china-mobile.service';
import { ChinaTelecomService } from '../china-telecom/china-telecom.service';
import { BatchQuerySimCardInfoDto } from './dto/batch-query-sim-card-info.dto';
import { BatchQuerySimCardInfoResponseDto } from './dto/batch-query-sim-card-info-response.dto';
import { BatchTelecomQrySimInfoDto } from './dto/batch-telecom-qry-sim-info.dto';
import { BatchTelecomQrySimInfoResponseDto } from './dto/batch-telecom-qry-sim-info-response.dto';

@ApiTags('SIM 卡')
@Controller('sim')
export class SimController {
  constructor(
    private readonly chinaMobile: ChinaMobileService,
    private readonly chinaTelecom: ChinaTelecomService,
  ) {}

  @Post('card-info/batch')
  @ApiOperation({
    summary: '批量查询码号信息',
    description:
      '对接 `ChinaMobileService.batchQuerySimCardInfo`：OneLink《移动.pdf》5.1.7（GET transid+token，msisdns / iccids / imsis 三选一，多值英文逗号入参将转为下划线）。',
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
    return this.chinaMobile.batchQuerySimCardInfo({
      msisdns: body.msisdns,
      iccids: body.iccids,
      imeis: body.imeis,
    });
  }

  @Post('telecom/card-info/batch')
  @ApiOperation({
    summary: '电信：批量查询 SIM 卡资料',
    description:
      '对接 `ChinaTelecomService.batchQrySimInfo`：5G 连接管理平台 CTIOT_5GCMP_BQ018，`POST /api/v1/prod/batchQrySimInfo`（accessNumbers + custNumber，网关 AppKey/Sign/Timestamp）。',
  })
  @ApiBody({ type: BatchTelecomQrySimInfoDto })
  @ApiOkResponse({
    description: '电信 code 为字符串 0',
    type: BatchTelecomQrySimInfoResponseDto,
  })
  @ApiBadRequestResponse({
    description: '参数校验失败（接入号数量、必填项等）',
  })
  batchTelecomQrySimInfo(@Body() body: BatchTelecomQrySimInfoDto) {
    return this.chinaTelecom.batchQrySimInfo({
      custNumber: body.custNumber,
      accessNumbers: body.accessNumbers,
      groupId: body.groupId,
      simStatus: body.simStatus,
    });
  }
}
