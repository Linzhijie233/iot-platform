import { Module } from '@nestjs/common';
import { ChinaUnicomService } from './china-unicom.service';

@Module({
  providers: [ChinaUnicomService],
  exports: [ChinaUnicomService],
})
export class ChinaUnicomModule {}
