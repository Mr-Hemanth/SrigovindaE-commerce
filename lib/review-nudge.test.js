import { isEligibleForReviewNudge, REVIEW_NUDGE_DELAY_DAYS } from './review-nudge';

const baseOrder = {
  status: 'delivered',
  userEmail: 'shopper@example.com',
  items: [{ id: 'p1', name: 'Test Item' }],
  deliveredAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('isEligibleForReviewNudge', () => {
  it('is eligible once the delay has passed', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    now.setDate(now.getDate() + REVIEW_NUDGE_DELAY_DAYS);
    expect(isEligibleForReviewNudge(baseOrder, now)).toBe(true);
  });

  it('is not eligible before the delay has passed', () => {
    const now = new Date('2026-01-02T00:00:00.000Z'); // 1 day later
    expect(isEligibleForReviewNudge(baseOrder, now)).toBe(false);
  });

  it('is not eligible for non-delivered orders', () => {
    const now = new Date('2026-01-10T00:00:00.000Z');
    expect(isEligibleForReviewNudge({ ...baseOrder, status: 'shipped' }, now)).toBe(false);
  });

  it('is not eligible without a deliveredAt timestamp (pre-existing orders)', () => {
    const now = new Date('2026-01-10T00:00:00.000Z');
    const { deliveredAt, ...rest } = baseOrder;
    expect(isEligibleForReviewNudge(rest, now)).toBe(false);
  });

  it('is not eligible if a nudge was already sent', () => {
    const now = new Date('2026-01-10T00:00:00.000Z');
    expect(isEligibleForReviewNudge({ ...baseOrder, reviewNudgeSentAt: new Date('2026-01-06') }, now)).toBe(false);
  });

  it('is not eligible without a customer email or items', () => {
    const now = new Date('2026-01-10T00:00:00.000Z');
    expect(isEligibleForReviewNudge({ ...baseOrder, userEmail: undefined }, now)).toBe(false);
    expect(isEligibleForReviewNudge({ ...baseOrder, items: [] }, now)).toBe(false);
  });

  it('handles a Firestore Timestamp-like deliveredAt via toDate()', () => {
    const now = new Date('2026-01-10T00:00:00.000Z');
    const fakeTimestamp = { toDate: () => new Date('2026-01-01T00:00:00.000Z') };
    expect(isEligibleForReviewNudge({ ...baseOrder, deliveredAt: fakeTimestamp }, now)).toBe(true);
  });
});
