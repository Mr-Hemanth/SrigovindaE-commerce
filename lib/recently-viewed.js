'use client';

// Tracks recently viewed product IDs in localStorage — no account/backend needed, and it
// naturally follows the shopper across devices-never (that would need a signed-in sync, which
// isn't worth it for a "you looked at this" nudge). Firestore's `where(documentId(), 'in', ids)`
// caps at 10 values, so the list is capped at the same size.
const STORAGE_KEY = 'sgc_recently_viewed';
export const MAX_RECENTLY_VIEWED = 10;

export function recordProductView(productId) {
  if (typeof window === 'undefined' || !productId) return;
  try {
    const existing = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    const deduped = [productId, ...existing.filter((id) => id !== productId)].slice(0, MAX_RECENTLY_VIEWED);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
  } catch {
    // localStorage can throw in private-browsing/storage-full edge cases — this is a nice-to-have,
    // never worth surfacing an error over.
  }
}

export function getRecentlyViewedIds(excludeId) {
  if (typeof window === 'undefined') return [];
  try {
    const existing = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return existing.filter((id) => id !== excludeId);
  } catch {
    return [];
  }
}
