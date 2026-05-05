import { Module } from '@nestjs/common';
import { ChinaMobileModule } from '../china-mobile/china-mobile.module';
import { SimService } from './sim.service';
import { SimController } from './sim.controller';

@Module({
  imports: [ChinaMobileModule],
  providers: [SimService],
  controllers: [SimController],
})
export class SimModule {}
