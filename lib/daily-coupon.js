// Pure logic for the auto-generated "daily coupon" cron job (see
// app/api/cron/daily-coupon/route.js and vercel.json). Kept separate from the route so the
// randomness/date-math can be unit tested without touching Firestore.

const PREFIXES = ['SAVE', 'FLASH', 'TODAY', 'DEAL', 'SGC'];

// Inclusive 5-12% — accepts an injectable RNG so tests can hit both ends deterministically.
export function randomDiscountPercentage(rand = Math.random) {
  return Math.floor(rand() * 8) + 5;
}

export function generateCouponCode(discountPercentage, rand = Math.random) {
  const prefix = PREFIXES[Math.floor(rand() * PREFIXES.length)];
  const suffix = Math.floor(rand() * 46656).toString(36).toUpperCase().padStart(3, '0');
  return `${prefix}${discountPercentage}${suffix}`;
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// The business is India-based, so "valid until midnight" means midnight IST, not UTC —
// shift into IST wall-clock, read the calendar date off it, then shift the 23:59:59 boundary
// back to the real UTC instant it corresponds to.
export function endOfDayIST(now = new Date()) {
  const shifted = new Date(now.getTime() + IST_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth();
  const d = shifted.getUTCDate();
  return new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - IST_OFFSET_MS);
}
