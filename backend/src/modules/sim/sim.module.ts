import { Module } from '@nestjs/common';
import { ChinaMobileV2Module } from '../china-mobile-v2/china-mobile-v2.module';
import { SimController } from './sim.controller';

@Module({
  imports: [ChinaMobileV2Module],
  controllers: [SimController],
})
export class SimModule {}
