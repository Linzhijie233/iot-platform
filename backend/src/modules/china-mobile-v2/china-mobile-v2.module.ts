import { Module } from '@nestjs/common';
import { ChinaMobileV2Service } from './china-mobile-v2.service';

@Module({
  providers: [ChinaMobileV2Service],
  exports: [ChinaMobileV2Service],
})
export class ChinaMobileV2Module {}
