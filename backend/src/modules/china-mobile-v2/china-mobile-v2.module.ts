import { Module } from '@nestjs/common';
import { ChinaMobileV2GatewayService } from './china-mobile-v2-gateway.service';
import { ChinaMobileV2Service } from './china-mobile-v2.service';

@Module({
  providers: [ChinaMobileV2GatewayService, ChinaMobileV2Service],
  exports: [ChinaMobileV2GatewayService, ChinaMobileV2Service],
})
export class ChinaMobileV2Module {}
