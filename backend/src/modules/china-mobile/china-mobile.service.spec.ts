import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChinaMobileService } from './china-mobile.service';

describe('ChinaMobileService', () => {
  let service: ChinaMobileService;

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
});
