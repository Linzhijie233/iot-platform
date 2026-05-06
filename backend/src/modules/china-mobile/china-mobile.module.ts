import { Module } from '@nestjs/common';
import { ChinaMobileGatewayService } from './china-mobile-gateway.service';
import { ChinaMobileService } from './china-mobile.service';

@Module({
  providers: [ChinaMobileGatewayService, ChinaMobileService],
  exports: [ChinaMobileGatewayService, ChinaMobileService],
})
export class ChinaMobileModule {}
