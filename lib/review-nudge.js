// Pure eligibility check for the review-nudge cron (see app/api/cron/review-nudge/route.js) —
// kept separate from the route so it's testable without touching Firestore.

export const REVIEW_NUDGE_DELAY_DAYS = 4;

export function isEligibleForReviewNudge(order, now = new Date()) {
  if (order.status !== 'delivered') return false;
  if (!order.deliveredAt) return false;
  if (order.reviewNudgeSentAt) return false;
  if (!order.userEmail) return false;
  if (!Array.isArray(order.items) || order.items.length === 0) return false;

  const deliveredAt = order.deliveredAt.toDate ? order.deliveredAt.toDate() : new Date(order.deliveredAt);
  if (Number.isNaN(deliveredAt.getTime())) return false;

  const daysSinceDelivery = (now.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceDelivery >= REVIEW_NUDGE_DELAY_DAYS;
}
