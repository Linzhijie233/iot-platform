import { Module } from '@nestjs/common';
import { ChinaTelecomService } from './china-telecom.service';

@Module({
  providers: [ChinaTelecomService],
  exports: [ChinaTelecomService],
})
export class ChinaTelecomModule {}
