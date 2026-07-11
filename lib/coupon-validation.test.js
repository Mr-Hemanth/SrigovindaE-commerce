import { isCouponExpired, isCouponValid } from '@/lib/coupon-validation';

describe('isCouponExpired', () => {
  it('treats a missing coupon as expired', () => {
    expect(isCouponExpired(null)).toBe(true);
  });

  it('treats a coupon with no expiryDate as expired', () => {
    expect(isCouponExpired({ code: 'X' })).toBe(true);
  });

  it('is not expired when expiryDate is in the future', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const coupon = { expiryDate: '2026-01-02T00:00:00Z' };
    expect(isCouponExpired(coupon, now)).toBe(false);
  });

  it('is expired when expiryDate is in the past', () => {
    const now = new Date('2026-01-02T00:00:00Z');
    const coupon = { expiryDate: '2026-01-01T00:00:00Z' };
    expect(isCouponExpired(coupon, now)).toBe(true);
  });

  it('is not expired exactly at the expiry instant', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const coupon = { expiryDate: '2026-01-01T00:00:00Z' };
    expect(isCouponExpired(coupon, now)).toBe(false);
  });

  it('supports a Firestore Timestamp-like expiryDate (toDate method)', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const coupon = { expiryDate: { toDate: () => new Date('2026-01-02T00:00:00Z') } };
    expect(isCouponExpired(coupon, now)).toBe(false);
  });
});

describe('isCouponValid', () => {
  it('is false for null', () => {
    expect(isCouponValid(null)).toBe(false);
  });

  it('is true for a non-expired coupon', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    expect(isCouponValid({ expiryDate: '2026-06-01T00:00:00Z' }, now)).toBe(true);
  });

  it('is false for an expired coupon', () => {
    const now = new Date('2026-06-01T00:00:00Z');
    expect(isCouponValid({ expiryDate: '2026-01-01T00:00:00Z' }, now)).toBe(false);
  });
});
