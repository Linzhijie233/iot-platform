import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { AppController } from './../src/app.controller';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health returns the application health status', () => {
    const controller = app.get(AppController);

    expect(controller.getHealth()).toEqual({
      status: 'ok',
      databaseConfigured: false,
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
