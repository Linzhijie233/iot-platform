import { Injectable } from '@nestjs/common';
import { ChinaMobileService } from '../china-mobile/china-mobile.service';
import type { BatchQuerySimCardInfoDto } from './dto/batch-query-sim-card-info.dto';
import type { QuerySimDataUsageDto } from './dto/query-sim-data-usage.dto';
import type { QuerySimStopReasonDto } from './dto/query-sim-stop-reason.dto';

@Injectable()
export class SimService {
  constructor(private readonly chinaMobile: ChinaMobileService) {}

  querySimStopReason(dto: QuerySimStopReasonDto) {
    return this.chinaMobile.querySimStopReason({
      msisdn: dto.msisdn,
      iccid: dto.iccid,
      imsi: dto.imsi,
    });
  }

  querySimDataUsage(dto: QuerySimDataUsageDto) {
    return this.chinaMobile.querySimDataUsage({
      msisdn: dto.msisdn,
      iccid: dto.iccid,
      imsi: dto.imsi,
    });
  }

  batchQuerySimCardInfo(dto: BatchQuerySimCardInfoDto) {
    return this.chinaMobile.batchQuerySimCardInfo({
      msisdns: dto.msisdns,
      iccids: dto.iccids,
      imeis: dto.imeis,
    });
  }
}
