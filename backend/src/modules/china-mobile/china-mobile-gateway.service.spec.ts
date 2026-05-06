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

    service = module.get<ChinaMobileGatewayService>(
      ChinaMobileGatewayService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('resolveOnelinkUrl 拼接 base 与 query', () => {
    const u = service.resolveOnelinkUrl('/v5/x', { a: '1', b: '2' });
    expect(u.startsWith('https://api.iot.10086.cn/v5/x')).toBe(true);
    expect(u).toContain('a=1');
    expect(u).toContain('b=2');
  });

  it('request GET 成功（mock fetch）', async () => {
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

    const url = service.resolveOnelinkUrl('/v5/ec/get/token', {
      appid: 'x',
      password: 'y',
      transid: 'z',
    });
    const json = await service.request<
      Array<{ token?: string; ttl?: string }>
    >({
      url,
      operationLabel: '测试 token',
      method: 'GET',
    });

    expect(json.result?.[0]?.token).toBe('t1');
    expect(spy).toHaveBeenCalledTimes(1);
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('GET');

    spy.mockRestore();
  });

  it('request POST 含 body（mock fetch）', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ status: '0', message: 'OK', result: {} }),
        { status: 200 },
      ),
    );

    await service.request({
      url: 'https://api.iot.10086.cn/v5/ec/mock',
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
