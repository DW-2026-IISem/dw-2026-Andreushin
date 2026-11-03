import { rateStatus } from './rate-status';

describe('rateStatus', () => {
  const today = '2026-11-02';

  it('should treat an open rate that already started as current', () => {
    expect(rateStatus({ validFrom: '2026-09-20', validTo: null }, today)).toBe('current');
    expect(rateStatus({ validFrom: today, validTo: today }, today)).toBe('current');
  });

  it('should tell scheduled and closed rates apart', () => {
    expect(rateStatus({ validFrom: '2026-12-01', validTo: null }, today)).toBe('future');
    expect(rateStatus({ validFrom: '2026-01-01', validTo: '2026-11-01' }, today)).toBe('closed');
  });
});
