import { Global, Module } from '@nestjs/common';
import { StoreService } from './store.service';

/** 全局持久层：任何业务模块直接注入 StoreService 即可 */
@Global()
@Module({
  providers: [StoreService],
  exports: [StoreService],
})
export class StoreModule {}
