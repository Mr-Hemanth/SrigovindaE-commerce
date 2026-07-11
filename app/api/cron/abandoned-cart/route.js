import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { sendAbandonedCartEmail } from '@/lib/notify/email';

const INACTIVE_HOURS = 24;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.srigovindacollections.com';

function toDate(value) {
  if (!value) return null;
  return value.toDate ? value.toDate() : new Date(value);
}

// Triggered by Vercel Cron (see vercel.json). Finds carts with items that haven't been touched
// in INACTIVE_HOURS and haven't already had a reminder sent since their last change, and emails
// the customer a reminder. Firestore filtering is done in-memory since the carts collection is
// small — avoids needing a composite index for a range + equality query.
export async function GET(request) {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - INACTIVE_HOURS * 60 * 60 * 1000);
  const snap = await adminDb().collection('carts').get();

  let sent = 0;
  let skipped = 0;
  const errors = [];

  for (const doc of snap.docs) {
    const cart = doc.data();
    const hasItems = Array.isArray(cart.items) && cart.items.length > 0;
    const updatedAt = toDate(cart.updatedAt);
    const alreadySent = toDate(cart.abandonedEmailSentAt);

    if (!hasItems || !updatedAt || updatedAt > cutoff || !cart.userEmail) {
      skipped++;
      continue;
    }
    // Don't re-send if we already emailed about this exact cart state (no changes since).
    if (alreadySent && alreadySent > updatedAt) {
      skipped++;
      continue;
    }

    try {
      const result = await sendAbandonedCartEmail(cart, SITE_URL);
      if (result.sent) {
        await doc.ref.update({ abandonedEmailSentAt: new Date() });
        sent++;
      } else {
        skipped++;
      }
    } catch (err) {
      errors.push({ cartId: doc.id, error: err.message });
    }
  }

  return NextResponse.json({ checked: snap.size, sent, skipped, errors });
}
