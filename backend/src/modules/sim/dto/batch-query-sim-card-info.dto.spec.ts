import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BatchQuerySimCardInfoDto } from './batch-query-sim-card-info.dto';

function dto(partial: Partial<BatchQuerySimCardInfoDto>) {
  return plainToInstance(BatchQuerySimCardInfoDto, partial);
}

describe('BatchQuerySimCardInfoDto', () => {
  it('仅 msisdns 合法', async () => {
    const errors = await validate(dto({ msisdns: '1475500012,14765804176' }));
    expect(errors).toHaveLength(0);
  });

  it('三类都传不通过', async () => {
    const errors = await validate(
      dto({
        msisdns: '1',
        iccids: '2',
        imeis: '3',
      }),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('都不传不通过', async () => {
    const errors = await validate(new BatchQuerySimCardInfoDto());
    expect(errors.length).toBeGreaterThan(0);
  });

  it('超过 100 个不通过', async () => {
    const many = Array.from({ length: 101 }, (_, i) => String(i)).join(',');
    const errors = await validate(dto({ msisdns: many }));
    expect(errors.length).toBeGreaterThan(0);
  });
});
