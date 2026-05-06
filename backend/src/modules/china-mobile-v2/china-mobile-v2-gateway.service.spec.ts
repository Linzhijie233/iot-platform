import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  ChinaMobileV2GatewayService,
  MOBILE_AIOT_SK_ENV,
} from './china-mobile-v2-gateway.service';

describe('ChinaMobileV2GatewayService', () => {
  let service: ChinaMobileV2GatewayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChinaMobileV2GatewayService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === MOBILE_AIOT_SK_ENV ? 'test-secret-key' : undefined,
          },
        },
      ],
    }).compile();

    service = module.get<ChinaMobileV2GatewayService>(
      ChinaMobileV2GatewayService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('canonicalQueryString 按 key 字典序编码', () => {
    expect(
      ChinaMobileV2GatewayService.canonicalQueryString({ b: '2', a: '1' }),
    ).toBe('a=1&b=2');
  });

  it('buildAuthorizationHeader 需配置 SK 并返回 Bearer', () => {
    const auth = service.buildAuthorizationHeader({
      path: '/v1/ping',
      queryParams: {},
    });
    expect(auth.startsWith('Bearer method=HmacSHA256&sign=')).toBe(true);
    expect(auth.length).toBeGreaterThan(
      'Bearer method=HmacSHA256&sign='.length,
    );
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
    const [url] = spy.mock.calls[0];
    expect(url).toContain('/v5/ec/get/token');

    spy.mockRestore();
  });
});
