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
});
