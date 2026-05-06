import { Module } from '@nestjs/common';
import { ChinaTelecomGatewayService } from './china-telecom-gateway.service';
import { ChinaTelecomService } from './china-telecom.service';

@Module({
  providers: [ChinaTelecomGatewayService, ChinaTelecomService],
  exports: [ChinaTelecomGatewayService, ChinaTelecomService],
})
export class ChinaTelecomModule {}
