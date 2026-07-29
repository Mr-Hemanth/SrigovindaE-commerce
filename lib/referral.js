import 'server-only';
import { adminDb } from './firebase/admin';

export const REFERRAL_DISCOUNT_PERCENTAGE = 10;
export const REFERRAL_COUPON_VALID_DAYS = 30;

// A user's own uid doubles as their referral code — no separate lookup table needed, and it's
// already guaranteed unique.
export function buildReferralLink(uid, siteUrl) {
  return `${siteUrl}/signup?ref=${encodeURIComponent(uid)}`;
}

export function generateReferralCouponCode(prefix, rand = Math.random) {
  const suffix = Math.floor(rand() * 46656).toString(36).toUpperCase().padStart(3, '0');
  return `${prefix}${suffix}`;
}

export function referralCouponExpiryDate(now = new Date()) {
  const d = new Date(now);
  d.setDate(d.getDate() + REFERRAL_COUPON_VALID_DAYS);
  return d;
}

async function issueRestrictedCoupon(userId, prefix) {
  const code = generateReferralCouponCode(prefix);
  await adminDb().collection('coupons').add({
    code,
    discountPercentage: REFERRAL_DISCOUNT_PERCENTAGE,
    expiryDate: referralCouponExpiryDate(),
    createdAt: new Date(),
    restrictedToUserId: userId,
    source: 'referral',
  });
  return code;
}

// Called once a referred user's first order is confirmed (COD: right after creation; online:
// after payment verification succeeds — never at pending-order creation, which could be
// abandoned). Safe to call on every order for a user: referralRewardIssued makes every call
// after the first a no-op, so this doubles as the "is this really their first order" check.
export async function awardReferralRewardIfEligible(userId) {
  const userRef = adminDb().collection('users').doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return null;

  const referee = userSnap.data();
  if (!referee.referredBy || referee.referralRewardIssued) return null;
  if (referee.referredBy === userId) return null; // defensive: self-referral should never happen

  const referrerSnap = await adminDb().collection('users').doc(referee.referredBy).get();
  if (!referrerSnap.exists) return null;
  const referrer = referrerSnap.data();

  const [refereeCode, referrerCode] = await Promise.all([
    issueRestrictedCoupon(userId, 'WELCOME'),
    issueRestrictedCoupon(referee.referredBy, 'THANKS'),
  ]);

  await userRef.update({ referralRewardIssued: true });

  return {
    referee: { email: referee.email, name: referee.name || 'there', code: refereeCode },
    referrer: { email: referrer.email, name: referrer.name || 'there', code: referrerCode },
  };
}
