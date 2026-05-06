import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChinaTelecomService } from './china-telecom.service';

describe('ChinaTelecomService', () => {
  let service: ChinaTelecomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChinaTelecomService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'TELECOM_CMP_APP_KEY') return 'my-app-key';
              if (key === 'TELECOM_CMP_SECRET_KEY') return 'd1209cfefe895364e03';
              return undefined;
            },
          },
        },
      ],
    }).compile();

    service = module.get<ChinaTelecomService>(ChinaTelecomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sortQueryString 按 key 字典序排序', () => {
    expect(ChinaTelecomService.sortQueryString('b=1&c=3&a=2')).toBe('a=2&b=1&c=3');
  });

  it('signMd5Gateway 与文档示例拼接一致（固定时间戳）', () => {
    const paramStr = 'a=1&b=2&c=3';
    const bodyStr = '{"name":"xf","age":"dd"}';
    const timestamp = '20201101021435';
    const secretKey = 'd1209cfefe895364e03';
    const plain = `${paramStr}${bodyStr}${secretKey}${timestamp}`;
    expect(ChinaTelecomService.signMd5Gateway(plain)).toBe(
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

  it('batchQrySimInfo 成功时返回 list（mock fetch）', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-11-01T02:14:35.000Z'));

    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          code: '0',
          message: 'OK',
          data: { qrySimInfoList: [{ accessNumber: '14912061160', iccid: '898611' }] },
        }),
        { status: 200, statusText: 'OK' },
      ),
    );

    const result = await service.batchQrySimInfo({
      custNumber: 'cust_1',
      accessNumbers: ['14912061160'],
    });

    expect(result.code).toBe('0');
    expect(result.list).toHaveLength(1);
    expect(result.list[0].accessNumber).toBe('14912061160');

    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://cmp-api.ctwing.cn:20164/api/v1/prod/batchQrySimInfo');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json;charset=utf-8',
      AppKey: 'my-app-key',
      Timestamp: '20201101021435',
    });
    expect(typeof (init.headers as Record<string, string>)['Sign']).toBe('string');

    spy.mockRestore();
    jest.useRealTimers();
  });

  it('batchQrySimInfo 超过 100 条抛出错误', async () => {
    const nums = Array.from({ length: 101 }, (_, i) => `${i}`);
    await expect(
      service.batchQrySimInfo({ custNumber: 'c', accessNumbers: nums }),
    ).rejects.toThrow(/最多 100/);
  });
});
