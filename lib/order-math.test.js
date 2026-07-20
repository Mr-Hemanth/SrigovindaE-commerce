import { toDate, isCountableOrder } from './order-math';

describe('toDate', () => {
  it('converts a Firestore Timestamp-like object via toDate()', () => {
    const fakeTimestamp = { toDate: () => new Date('2026-01-01') };
    expect(toDate(fakeTimestamp)).toEqual(new Date('2026-01-01'));
  });

  it('parses a plain date string', () => {
    expect(toDate('2026-01-01')).toEqual(new Date('2026-01-01'));
  });

  it('returns null for null/invalid input', () => {
    expect(toDate(null)).toBeNull();
    expect(toDate('not a date')).toBeNull();
  });
});

describe('isCountableOrder', () => {
  it('counts non-cancelled COD orders', () => {
    expect(isCountableOrder({ paymentMethod: 'cod', status: 'processing' })).toBe(true);
    expect(isCountableOrder({ paymentMethod: 'cod', status: 'cancelled' })).toBe(false);
  });

  it('counts only Paid online orders', () => {
    expect(isCountableOrder({ paymentMethod: 'Razorpay Online', paymentStatus: 'Paid' })).toBe(true);
    expect(isCountableOrder({ paymentMethod: 'Razorpay Online', paymentStatus: 'Failed' })).toBe(false);
  });
});
