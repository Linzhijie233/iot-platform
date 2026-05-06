import { Module } from '@nestjs/common';
import { ChinaMobileModule } from '../china-mobile/china-mobile.module';
import { ChinaTelecomModule } from '../china-telecom/china-telecom.module';
import { SimController } from './sim.controller';

@Module({
  imports: [ChinaMobileModule, ChinaTelecomModule],
  controllers: [SimController],
})
export class SimModule {}
