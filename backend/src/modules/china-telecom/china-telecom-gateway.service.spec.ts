import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  ChinaTelecomGatewayService,
  TELECOM_CMP_APP_KEY_ENV,
  TELECOM_CMP_SECRET_KEY_ENV,
} from './china-telecom-gateway.service';

describe('ChinaTelecomGatewayService', () => {
  let service: ChinaTelecomGatewayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChinaTelecomGatewayService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === TELECOM_CMP_APP_KEY_ENV) return 'my-app-key';
              if (key === TELECOM_CMP_SECRET_KEY_ENV)
                return 'd1209cfefe895364e03';
              return undefined;
            },
          },
        },
      ],
    }).compile();

    service = module.get<ChinaTelecomGatewayService>(
      ChinaTelecomGatewayService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sortQueryString 按 key 字典序排序', () => {
    expect(ChinaTelecomGatewayService.sortQueryString('b=1&c=3&a=2')).toBe(
      'a=2&b=1&c=3',
    );
  });

  it('signMd5Gateway 与文档示例拼接一致（固定时间戳）', () => {
    const paramStr = 'a=1&b=2&c=3';
    const bodyStr = '{"name":"xf","age":"dd"}';
    const timestamp = '20201101021435';
    const secretKey = 'd1209cfefe895364e03';
    const plain = `${paramStr}${bodyStr}${secretKey}${timestamp}`;
    expect(ChinaTelecomGatewayService.signMd5Gateway(plain)).toBe(
      '3863613035653132306631333231313733383637376333326536316631643934',
    );
  });

  it('createAuthHeaders 返回 AppKey、Sign、Timestamp', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-11-01T02:14:35.000Z'));

    const h = service.createAuthHeaders({
      requestUrl:
        'https://cmp-api.ctwing.cn:20164/openapi/v1/prodinst/getSIMAmount?c=3&a=1&b=2',
      rawBody: '{"name":"xf","age":"dd"}',
    });

    expect(h.AppKey).toBe('my-app-key');
    expect(h.Timestamp).toBe('20201101021435');
    expect(h.Sign).toBe(
      '3863613035653132306631333231313733383637376333326536316631643934',
    );

    jest.useRealTimers();
  });

  it('postJsonAuthenticated 成功返回解析后的 JSON（mock fetch）', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-11-01T02:14:35.000Z'));

    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        statusText: 'OK',
      }),
    );

    const data = await service.postJsonAuthenticated<{ ok: boolean }>({
      requestUrl: 'https://cmp-api.ctwing.cn:20164/api/v1/prod/test',
      rawBody: '{}',
      operationLabel: 'testOp',
    });

    expect(data).toEqual({ ok: true });
    expect(spy).toHaveBeenCalledTimes(1);
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json;charset=utf-8',
      AppKey: 'my-app-key',
    });

    spy.mockRestore();
    jest.useRealTimers();
  });

  it('requestJsonAuthenticated GET 无 body、不加 Content-Type（mock fetch）', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-11-01T02:14:35.000Z'));

    const spy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ x: 1 }), { status: 200 }),
      );

    await service.requestJsonAuthenticated<{ x: number }>({
      requestUrl: 'https://cmp-api.ctwing.cn:20164/api/v1/open?b=2&a=1',
      operationLabel: 'getOp',
      method: 'GET',
      rawBody: '',
    });

    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('GET');
    expect(init.body).toBeUndefined();
    expect(
      (init.headers as Record<string, string>)['Content-Type'],
    ).toBeUndefined();

    spy.mockRestore();
    jest.useRealTimers();
  });

  it('postJsonAuthenticated 网络异常抛出带 operationLabel 的错误', async () => {
    const spy = jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('boom'));
    await expect(
      service.postJsonAuthenticated({
        requestUrl: 'https://cmp-api.ctwing.cn:20164/x',
        rawBody: '{}',
        operationLabel: 'myLabel',
      }),
    ).rejects.toThrow(/myLabel 请求失败（网络）：boom/);
    spy.mockRestore();
  });

  it('postJsonAuthenticated 非 JSON 响应抛出错误', async () => {
    const spy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('not-json', { status: 200 }));
    await expect(
      service.postJsonAuthenticated({
        requestUrl: 'https://cmp-api.ctwing.cn:20164/x',
        rawBody: '{}',
        operationLabel: 'badJson',
      }),
    ).rejects.toThrow(/badJson 返回非 JSON/);
    spy.mockRestore();
  });

  it('postJsonAuthenticated HTTP 非 2xx 抛出错误', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'nope', code: '500' }), {
        status: 503,
      }),
    );
    await expect(
      service.postJsonAuthenticated({
        requestUrl: 'https://cmp-api.ctwing.cn:20164/x',
        rawBody: '{}',
        operationLabel: 'httpErr',
      }),
    ).rejects.toThrow(/httpErr HTTP 503：nope/);
    spy.mockRestore();
  });
});
