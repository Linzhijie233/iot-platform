import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StoreModule } from './persistence/store.module';
import { UserModule } from './modules/user/user.module';
import { ChinaTelecomModule } from './modules/china-telecom/china-telecom.module';
import { ChinaUnicomModule } from './modules/china-unicom/china-unicom.module';
import { SimModule } from './modules/sim/sim.module';
import { ChinaMobileModule } from './modules/china-mobile/china-mobile.module';
import { CardsModule } from './modules/cards/cards.module';
import { DevicesModule } from './modules/devices/devices.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { FlowPoolsModule } from './modules/flow-pools/flow-pools.module';
import { VoicePoolsModule } from './modules/voice-pools/voice-pools.module';
import { PackagesModule } from './modules/packages/packages.module';
import { RiskModule } from './modules/risk/risk.module';
import { ServiceProductsModule } from './modules/service-products/service-products.module';
import { ServiceSubscriptionsModule } from './modules/service-subscriptions/service-subscriptions.module';
import { ServiceOperationsModule } from './modules/service-operations/service-operations.module';
import { ServiceAssurancesModule } from './modules/service-assurances/service-assurances.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CommissionsModule } from './modules/commissions/commissions.module';
import { WithdrawalsModule } from './modules/withdrawals/withdrawals.module';
import { MerchantRisksModule } from './modules/merchant-risks/merchant-risks.module';
import { StatsModule } from './modules/stats/stats.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // 通用持久层：优先 MongoDB，连不上自动回退内存（演示零依赖也能跑）
    StoreModule,
    UserModule,
    ChinaTelecomModule,
    ChinaUnicomModule,
    SimModule,
    ChinaMobileModule,
    // 平台自有业务数据（演示可手动新增）
    CardsModule,
    DevicesModule,
    AlertsModule,
    FlowPoolsModule,
    VoicePoolsModule,
    PackagesModule,
    RiskModule,
    ServiceProductsModule,
    ServiceSubscriptionsModule,
    ServiceOperationsModule,
    ServiceAssurancesModule,
    OrdersModule,
    CommissionsModule,
    WithdrawalsModule,
    MerchantRisksModule,
    StatsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
