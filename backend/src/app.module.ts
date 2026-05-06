import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { ChinaTelecomModule } from './modules/china-telecom/china-telecom.module';
import { ChinaUnicomModule } from './modules/china-unicom/china-unicom.module';
import { ChinaMobileModule } from './modules/china-mobile/china-mobile.module';
import { SimModule } from './modules/sim/sim.module';
import { ChinaMobileV2Module } from './modules/china-mobile-v2/china-mobile-v2.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    UserModule,
    ChinaTelecomModule,
    ChinaUnicomModule,
    ChinaMobileModule,
    SimModule,
    ChinaMobileV2Module,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
