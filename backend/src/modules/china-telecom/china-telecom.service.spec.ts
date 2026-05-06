import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  ChinaTelecomGatewayService,
  TELECOM_CMP_APP_KEY_ENV,
  TELECOM_CMP_SECRET_KEY_ENV,
} from './china-telecom-gateway.service';
import { ChinaTelecomService } from './china-telecom.service';

describe('ChinaTelecomService', () => {
  let service: ChinaTelecomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChinaTelecomGatewayService,
        ChinaTelecomService,
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

    service = module.get<ChinaTelecomService>(ChinaTelecomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('batchQrySimInfo 成功时返回 list（mock fetch）', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-11-01T02:14:35.000Z'));

    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          code: '0',
          message: 'OK',
          data: {
            qrySimInfoList: [{ accessNumber: '14912061160', iccid: '898611' }],
          },
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
    expect(url).toBe(
      'https://cmp-api.ctwing.cn:20164/api/v1/prod/batchQrySimInfo',
    );
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json;charset=utf-8',
      AppKey: 'my-app-key',
      Timestamp: '20201101021435',
    });
    expect(typeof (init.headers as Record<string, string>)['Sign']).toBe(
      'string',
    );

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
