import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BatchQuerySimCardInfoDto } from './dto/batch-query-sim-card-info.dto';
import { BatchSimCardInfoQueryResponseDto } from './dto/batch-sim-card-info-response.dto';
import { QuerySimDataUsageDto } from './dto/query-sim-data-usage.dto';
import { QuerySimStopReasonDto } from './dto/query-sim-stop-reason.dto';
import { SimDataUsageQueryResponseDto } from './dto/sim-data-usage-response.dto';
import { SimStopReasonQueryResponseDto } from './dto/sim-stop-reason-response.dto';
import { SimService } from './sim.service';

@ApiTags('SIM 卡')
@Controller('sim')
export class SimController {
  constructor(private readonly simService: SimService) {}

  @Post('stop-reason')
  @ApiOperation({
    summary: '查询 SIM 停机原因',
    description:
      '对接移动 AIoT `/cmp/v5/ec/query/sim-stop-reason`，至少提供 msisdn、iccid、imsi 之一。',
  })
  @ApiBody({ type: QuerySimStopReasonDto })
  @ApiOkResponse({
    description: '查询成功（移动网关 code 为 0）',
    type: SimStopReasonQueryResponseDto,
  })
  @ApiBadRequestResponse({ description: '参数校验失败或未提供任一卡标识' })
  queryStopReason(@Body() body: QuerySimStopReasonDto) {
    return this.simService.querySimStopReason(body);
  }

  @Post('data-usage')
  @ApiOperation({
    summary: '查询 SIM GPRS 用量',
    description:
      '对接移动 CAP `POST /cap/v5/ec/query/sim-data-usage`（与文档请求示例：`timestamp`、`url`、`nonce`、卡标识），用量单位为 KB。',
  })
  @ApiBody({ type: QuerySimDataUsageDto })
  @ApiOkResponse({
    description: '查询成功（网关 code 为 0）',
    type: SimDataUsageQueryResponseDto,
  })
  @ApiBadRequestResponse({
    description: '参数校验失败（未提供卡标识）',
  })
  queryDataUsage(@Body() body: QuerySimDataUsageDto) {
    return this.simService.querySimDataUsage(body);
  }

  @Post('card-info/batch')
  @ApiOperation({
    summary: '批量查询 SIM 卡信息',
    description:
      '对接移动 CRP `POST /crp/v2/ec/query/sim-card-info/batch`，msisdns / iccids / imeis 至少填一类（英文逗号分隔），单次最多 100 张。',
  })
  @ApiBody({ type: BatchQuerySimCardInfoDto })
  @ApiOkResponse({
    description: '查询成功（网关 code 为 0）',
    type: BatchSimCardInfoQueryResponseDto,
  })
  @ApiBadRequestResponse({
    description: '参数校验失败，或未提供任一号码列表 / 超过 100 张',
  })
  batchQueryCardInfo(@Body() body: BatchQuerySimCardInfoDto) {
    return this.simService.batchQuerySimCardInfo(body);
  }
}
