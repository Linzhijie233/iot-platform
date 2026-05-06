import { Test, TestingModule } from '@nestjs/testing';
import { ChinaMobileV2Service } from '../china-mobile-v2/china-mobile-v2.service';
import { SimController } from './sim.controller';

describe('SimController', () => {
  let controller: SimController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SimController],
      providers: [
        {
          provide: ChinaMobileV2Service,
          useValue: {
            batchQuerySimCardInfo: jest.fn(),
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
