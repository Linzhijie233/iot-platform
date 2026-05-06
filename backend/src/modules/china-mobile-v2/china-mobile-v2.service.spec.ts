import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChinaMobileV2GatewayService } from './china-mobile-v2-gateway.service';
import { ChinaMobileV2Service } from './china-mobile-v2.service';

describe('ChinaMobileV2Service', () => {
  let service: ChinaMobileV2Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChinaMobileV2GatewayService,
        ChinaMobileV2Service,
        {
          provide: ConfigService,
          useValue: { get: () => undefined },
        },
      ],
    }).compile();

    service = module.get<ChinaMobileV2Service>(ChinaMobileV2Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
