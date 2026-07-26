/**
 * Pure coupon expiry check, extracted so it can be unit tested and shared between the client
 * (CartContext's optimistic pre-check) and the server (create-order route's authoritative check)
 * instead of two independently-maintained copies of the same date comparison.
 */
export function isCouponExpired(coupon, now = new Date()) {
  if (!coupon || !coupon.expiryDate) return true;
  const expiry = coupon.expiryDate.toDate ? coupon.expiryDate.toDate() : new Date(coupon.expiryDate);
  return now > expiry;
}

export function isCouponValid(coupon, now = new Date()) {
  return Boolean(coupon) && !isCouponExpired(coupon, now);
}

// A coupon with no maxUsesPerUser set (or <= 0) has always been unlimited-use — that stays true
// for every coupon already in Firestore, since the field simply won't exist on their documents.
export function isCouponUsageLimitReached(maxUsesPerUser, usageCount) {
  if (!maxUsesPerUser || maxUsesPerUser <= 0) return false;
  return usageCount >= maxUsesPerUser;
}
