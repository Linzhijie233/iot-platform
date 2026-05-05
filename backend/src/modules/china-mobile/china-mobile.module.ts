import { Module } from '@nestjs/common';
import { ChinaMobileService } from './china-mobile.service';

@Module({
  providers: [ChinaMobileService],
  exports: [ChinaMobileService],
})
export class ChinaMobileModule {}
