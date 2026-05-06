import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BATCH_QUERY_SIM_CARD_INFO_PATH,
  ChinaMobileService,
  QUERY_SIM_DATA_USAGE_PATH,
  SIM_STOP_REASON_PATH,
} from './china-mobile.service';

describe('ChinaMobileService', () => {
  let service: ChinaMobileService;
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChinaMobileService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'MOBILE_AIOT_AK') return 'test-ak';
              if (key === 'MOBILE_AIOT_SK') return 'test';
              if (key === 'MOBILE_CAP_BODY_URL') return 'https://example.com/cap';
              if (key === 'MOBILE_CRP_EC') return 'test-ec';
              return undefined;
            },
          },
        },
      ],
    }).compile();

    service = module.get<ChinaMobileService>(ChinaMobileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * 与文档 3.1.4 示例一致（path / query / body / sk=test → 给定 Base64 签名）
   * @see https://iot.10086.cn/doc/aiot/a/detail/3072
   */
  it('buildStringToSign + HMAC 与文档示例输出一致', () => {
    const path = '/cmp/v1/ec/query-sim-status';
    const queryParams = {
      ak: 'test',
      nonce: '123456789',
      param1: 'value1',
      param2: 'value2',
      timestamp: '1749703456',
    };
    const bodyObject = {
      desc: '这是个设备描述',
      device_name: 'devname',
      product_id: '123',
    };
    const stringToSign = ChinaMobileService.buildStringToSign({
      path,
      queryParams,
      bodyObject,
    });
    expect(stringToSign).toBe(
      [
        '/cmp/v1/ec/query-sim-status',
        'ak=test&nonce=123456789&param1=value1&param2=value2&timestamp=1749703456',
        '{"desc":"这是个设备描述","device_name":"devname","product_id":"123"}',
      ].join('\n'),
    );
    expect(ChinaMobileService.signStringToSign(stringToSign, 'test')).toBe(
      'tGwdw13qXAj+fqDTfFu45YlEyQlAdHwvGE7lbR4yi18=',
    );
    expect(
      ChinaMobileService.formatAuthorizationHeader(
        'tGwdw13qXAj+fqDTfFu45YlEyQlAdHwvGE7lbR4yi18=',
      ),
    ).toBe(
      'Bearer method=HmacSHA256&sign=tGwdw13qXAj+fqDTfFu45YlEyQlAdHwvGE7lbR4yi18=',
    );
  });

  it('buildAuthorizationHeader 使用配置中的 SK', () => {
    const auth = service.buildAuthorizationHeader({
      path: '/cmp/v1/ec/query-sim-status',
      queryParams: {
        ak: 'test',
        nonce: '123456789',
        param1: 'value1',
        param2: 'value2',
        timestamp: '1749703456',
      },
      bodyObject: {
        desc: '这是个设备描述',
        device_name: 'devname',
        product_id: '123',
      },
    });
    expect(auth).toBe(
      'Bearer method=HmacSHA256&sign=tGwdw13qXAj+fqDTfFu45YlEyQlAdHwvGE7lbR4yi18=',
    );
  });

  it('无 query、无 body 时段落为 path\\n\\n', () => {
    expect(ChinaMobileService.buildStringToSign({ path: '/p' })).toBe('/p\n\n');
  });

  it('canonicalQueryString 对参数名升序并做百分号编码', () => {
    expect(
      ChinaMobileService.canonicalQueryString({
        z: '1',
        a: '空格 x',
      }),
    ).toBe(`a=${encodeURIComponent('空格 x')}&z=1`);
  });

  it('createPublicParams 返回 ak/timestamp/nonce', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-04T12:00:00.000Z'));
    jest.spyOn(service, 'createNonce').mockReturnValue('abc123');

    const p = service.createPublicParams();
    expect(p.ak).toBe('test-ak');
    expect(p.timestamp).toBe('1777896000');
    expect(p.nonce).toBe('abc123');

    jest.useRealTimers();
  });

  it('未配置 SK 时 buildAuthorizationHeader 抛错', () => {
    const bare = new ChinaMobileService({
      get: () => undefined,
    } as ConfigService);
    expect(() =>
      bare.buildAuthorizationHeader({ path: '/x' }),
    ).toThrow(/MOBILE_AIOT_SK/);
  });

  it('querySimStopReason 未传卡标识时抛错', async () => {
    await expect(service.querySimStopReason({})).rejects.toThrow(/至少提供/);
  });

  it('querySimStopReason 成功时返回 data', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          traceId: 't1',
          code: '0',
          msg: '正确',
          data: [{ platformType: 'OneLink-CT', stopReason: '000020000020' }],
        }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    jest.spyOn(service, 'createPublicParams').mockReturnValue({
      ak: 'ak1',
      timestamp: '1740783456',
      nonce: 'n1',
    });
    jest.spyOn(service, 'buildAuthorizationHeader').mockReturnValue(
      'Bearer method=HmacSHA256&sign=mock',
    );

    const out = await service.querySimStopReason({ msisdn: '14765804176' });
    expect(out.traceId).toBe('t1');
    expect(out.data).toEqual([
      { platformType: 'OneLink-CT', stopReason: '000020000020' },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      `https://cmp.api.cmiot.cn${SIM_STOP_REASON_PATH}`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer method=HmacSHA256&sign=mock',
        }),
        body: '{"ak":"ak1","msisdn":"14765804176","nonce":"n1","timestamp":"1740783456"}',
      }),
    );
  });

  it('querySimStopReason code 非 0 时抛错', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          traceId: 't1',
          code: '1001',
          msg: '业务失败',
          data: [],
        }),
    }) as unknown as typeof fetch;

    jest.spyOn(service, 'createPublicParams').mockReturnValue({
      ak: 'ak1',
      timestamp: '1',
      nonce: 'n1',
    });
    jest.spyOn(service, 'buildAuthorizationHeader').mockReturnValue('Bearer x');

    await expect(
      service.querySimStopReason({ iccid: '898600D6991330004146' }),
    ).rejects.toThrow(/\[1001\]/);
  });

  it('querySimDataUsage 未传卡标识时抛错', async () => {
    await expect(service.querySimDataUsage({})).rejects.toThrow(/至少提供/);
  });

  it('querySimDataUsage 成功时返回 data', async () => {
    jest.spyOn(service, 'createNonce').mockReturnValue('n1');
    jest.spyOn(service, 'createTimestampSeconds').mockReturnValue('1749783456');

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          traceId: 't2',
          code: '0',
          msg: '成功',
          data: {
            dataAmount: '1024.00',
            apnUseAmountList: [
              {
                apnName: 'CMIOT',
                apnUseAmount: '1024',
                pccCodeUseAmountList: [
                  { pccCode: '12341234', pccCodeUseAmount: '1024' },
                ],
              },
            ],
          },
        }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const out = await service.querySimDataUsage({ msisdn: '1475500417' });
    expect(out.traceId).toBe('t2');
    expect(out.data.dataAmount).toBe('1024.00');
    expect(out.data.apnUseAmountList).toHaveLength(1);

    expect(fetchMock).toHaveBeenCalledWith(
      `https://cas.api.cmmiot.com${QUERY_SIM_DATA_USAGE_PATH}`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: '1749783456',
          url: 'https://example.com/cap',
          nonce: 'n1',
          msisdn: '1475500417',
        }),
      }),
    );
  });

  it('batchQuerySimCardInfo 未传标识列表时抛错', async () => {
    await expect(service.batchQuerySimCardInfo({})).rejects.toThrow(/至少提供/);
  });

  it('batchQuerySimCardInfo 超过 100 张时抛错', async () => {
    const many = Array.from({ length: 101 }, (_, i) => String(i)).join(',');
    await expect(
      service.batchQuerySimCardInfo({ msisdns: many }),
    ).rejects.toThrow(/最多 100/);
  });

  it('batchQuerySimCardInfo 成功时返回 data 数组', async () => {
    jest.spyOn(service, 'createNonce').mockReturnValue('n1');
    jest.spyOn(service, 'createTimestampSeconds').mockReturnValue('1701203416');

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          traceId: 'tb',
          code: '0',
          msg: '成功',
          data: [
            {
              status: '0',
              message: '查询成功',
              imei: '8601220392675',
              msisdn: '13512345678',
              iccid: '898602B2211439268936',
            },
          ],
        }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const out = await service.batchQuerySimCardInfo({
      msisdns: '1475500012,1475500013',
    });
    expect(out.traceId).toBe('tb');
    expect(out.data).toHaveLength(1);
    expect(out.data[0].iccid).toBe('898602B2211439268936');

    expect(fetchMock).toHaveBeenCalledWith(
      `https://cas.api.cmriot.cn${BATCH_QUERY_SIM_CARD_INFO_PATH}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          timestamp: '1701203416',
          ec: 'test-ec',
          nonce: 'n1',
          msisdns: '1475500012,1475500013',
        }),
      }),
    );
  });
});
