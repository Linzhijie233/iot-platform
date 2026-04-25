import { Injectable } from '@nestjs/common';

export interface HealthStatus {
  status: 'ok';
  databaseConfigured: boolean;
}

@Injectable()
export class AppService {
  getHealth(): HealthStatus {
    return {
      status: 'ok',
      databaseConfigured: Boolean(process.env.MONGODB_URI),
    };
  }
}
