import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChinaMobileGatewayService } from './china-mobile-gateway.service';
import { ChinaMobileService } from './china-mobile.service';

describe('ChinaMobileService', () => {
  let service: ChinaMobileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChinaMobileGatewayService,
        ChinaMobileService,
        {
          provide: ConfigService,
          useValue: { get: () => undefined },
        },
      ],
    }).compile();

    service = module.get<ChinaMobileService>(ChinaMobileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
