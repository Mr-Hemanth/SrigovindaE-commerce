import { randomDiscountPercentage, generateCouponCode, endOfDayIST } from './daily-coupon';

describe('randomDiscountPercentage', () => {
  it('floors to 5 when the RNG returns 0', () => {
    expect(randomDiscountPercentage(() => 0)).toBe(5);
  });

  it('caps at 12 when the RNG returns just under 1', () => {
    expect(randomDiscountPercentage(() => 0.999999)).toBe(12);
  });

  it('never falls outside 5-12 across the full RNG range', () => {
    for (const r of [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 0.999999]) {
      const value = randomDiscountPercentage(() => r);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThanOrEqual(12);
    }
  });
});

describe('generateCouponCode', () => {
  it('embeds the discount percentage and a 3-char suffix after a known prefix', () => {
    const code = generateCouponCode(8, () => 0);
    expect(code).toMatch(/^[A-Z]+8[A-Z0-9]{3}$/);
  });

  it('produces different codes for different RNG draws', () => {
    const a = generateCouponCode(10, () => 0.1);
    const b = generateCouponCode(10, () => 0.9);
    expect(a).not.toBe(b);
  });
});

describe('endOfDayIST', () => {
  it('returns the UTC instant corresponding to 23:59:59.999 IST on the same IST calendar day', () => {
    // Noon UTC on 2026-07-21 is 5:30 PM IST on 2026-07-21 — same IST day, no rollover.
    const now = new Date('2026-07-21T12:00:00.000Z');
    const result = endOfDayIST(now);
    // 23:59:59.999 IST = 18:29:59.999 UTC same date.
    expect(result.toISOString()).toBe('2026-07-21T18:29:59.999Z');
  });

  it('rolls over correctly when UTC time is late enough to already be the next IST day', () => {
    // 11 PM UTC on 2026-07-21 is 4:30 AM IST on 2026-07-22.
    const now = new Date('2026-07-21T23:00:00.000Z');
    const result = endOfDayIST(now);
    expect(result.toISOString()).toBe('2026-07-22T18:29:59.999Z');
  });
});
