import { Test, TestingModule } from '@nestjs/testing';
import { ChinaMobileService } from '../china-mobile/china-mobile.service';
import { ChinaTelecomService } from '../china-telecom/china-telecom.service';
import { SimController } from './sim.controller';

describe('SimController', () => {
  let controller: SimController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SimController],
      providers: [
        {
          provide: ChinaMobileService,
          useValue: {
            batchQuerySimCardInfo: jest.fn(),
          },
        },
        {
          provide: ChinaTelecomService,
          useValue: {
            batchQrySimInfo: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SimController>(SimController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
