import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { ChinaUnicomService } from './china-unicom.service';

describe('ChinaUnicomService', () => {
  let service: ChinaUnicomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChinaUnicomService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'UNICOM_CELLULAR_APP_ID') return 'test-app-id';
              if (key === 'UNICOM_CELLULAR_APP_SECRET') return 'test-secret';
              return undefined;
            },
          },
        },
      ],
    }).compile();

    service = module.get<ChinaUnicomService>(ChinaUnicomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('formatRequestTimestamp 与手册示例格式一致', () => {
    const d = new Date(2018, 11, 5, 10, 23, 35, 649);
    expect(ChinaUnicomService.formatRequestTimestamp(d)).toBe(
      '2018-12-05 10:23:35 649',
    );
  });

  it('computeToken 为四段拼接后 SHA-256 十六进制（小写）', () => {
    const plain =
      'test-app-id' +
      '2018-12-05 10:23:35 649' +
      '20181205102335649123456' +
      'test-secret';
    expect(ChinaUnicomService.computeToken({
      appId: 'test-app-id',
      timestamp: '2018-12-05 10:23:35 649',
      transId: '20181205102335649123456',
      appSecret: 'test-secret',
    })).toBe(createHash('sha256').update(plain, 'utf8').digest('hex'));
  });

  it('buildAuthBody 返回 app_id、timestamp、trans_id、token', () => {
    const fixed = new Date(2020, 0, 2, 15, 4, 5, 6);
    const body = service.buildAuthBody({
      at: fixed,
      transId: '20200102150405006000001',
      timestamp: '2020-01-02 15:04:05 006',
    });
    expect(body.app_id).toBe('test-app-id');
    expect(body.timestamp).toBe('2020-01-02 15:04:05 006');
    expect(body.trans_id).toBe('20200102150405006000001');
    expect(body.token).toBe(
      ChinaUnicomService.computeToken({
        appId: 'test-app-id',
        appSecret: 'test-secret',
        timestamp: '2020-01-02 15:04:05 006',
        transId: '20200102150405006000001',
      }),
    );
  });

  it('未配置 app_id 或 app_secret 时抛出明确错误', () => {
    const bare = new ChinaUnicomService({
      get: () => undefined,
    } as ConfigService);
    expect(() => bare.buildAuthBody()).toThrow(/UNICOM_CELLULAR_APP/);
  });
});
