import { Test, TestingModule } from '@nestjs/testing';
import { SimController } from './sim.controller';
import { SimService } from './sim.service';

describe('SimController', () => {
  let controller: SimController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SimController],
      providers: [
        {
          provide: SimService,
          useValue: {
            querySimStopReason: jest.fn(),
            querySimDataUsage: jest.fn(),
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
