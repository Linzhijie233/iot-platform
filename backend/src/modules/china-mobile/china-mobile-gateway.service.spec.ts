import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChinaMobileGatewayService } from './china-mobile-gateway.service';

describe('ChinaMobileGatewayService', () => {
  let service: ChinaMobileGatewayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChinaMobileGatewayService,
        {
          provide: ConfigService,
          useValue: {
            get: () => undefined,
          },
        },
      ],
    }).compile();

    service = module.get<ChinaMobileGatewayService>(ChinaMobileGatewayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('onelinkGetJson GET 成功（mock fetch）', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: '0',
          message: 'OK',
          result: [{ token: 't1', ttl: '3600' }],
        }),
        { status: 200 },
      ),
    );

    const json = await service.onelinkGetJson<
      Array<{ token?: string; ttl?: string }>
    >(
      '/v5/ec/get/token',
      { appid: 'x', password: 'y', transid: 'z' },
      '测试 token',
    );

    expect(json.result?.[0]?.token).toBe('t1');
    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/v5/ec/get/token');
    expect(init.method).toBe('GET');

    spy.mockRestore();
  });

  it('onelinkRequestJson POST 含 body（mock fetch）', async () => {
    const spy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ status: '0', message: 'OK', result: {} }),
          { status: 200 },
        ),
      );

    await service.onelinkRequestJson({
      path: '/v5/ec/mock',
      operationLabel: 'postOp',
      method: 'POST',
      rawBody: '{"x":1}',
    });

    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"x":1}');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe(
      'application/json;charset=utf-8',
    );

    spy.mockRestore();
  });
});
