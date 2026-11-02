import { previewLine, round2, sumPreviews, todayInColombia } from './weighing-math';

describe('weighing math', () => {
  it('should round to 2 decimals like the backend', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(78.83 * 650)).toBe(51239.5);
  });

  it('should compute net and amount of a line (seeded weighing 19 of the backend)', () => {
    expect(previewLine(79.79, 0.96, 650)).toEqual({ netKg: 78.83, amount: 51239.5 });
  });

  it('should accept a DECIMAL price that arrives as a string', () => {
    expect(previewLine(10, 0, '1800.00')).toEqual({ netKg: 10, amount: 18000 });
  });

  it('should add the lines rounding the totals', () => {
    const total = sumPreviews([previewLine(79.79, 0.96, 650), previewLine(73.82, 1.52, 3890)]);
    expect(total).toEqual({ netKg: 151.13, amount: 332486.5 });
  });

  it('should give today in Bogota even when UTC is already tomorrow', () => {
    expect(todayInColombia(new Date('2026-11-02T03:30:00Z'))).toBe('2026-11-01');
  });
});
