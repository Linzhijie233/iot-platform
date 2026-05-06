import { Test, TestingModule } from '@nestjs/testing';
import { ChinaMobileService } from '../china-mobile/china-mobile.service';
import { SimService } from './sim.service';

describe('SimService', () => {
  let service: SimService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimService,
        {
          provide: ChinaMobileService,
          useValue: {
            querySimStopReason: jest.fn(),
            querySimDataUsage: jest.fn(),
            batchQuerySimCardInfo: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SimService>(SimService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
