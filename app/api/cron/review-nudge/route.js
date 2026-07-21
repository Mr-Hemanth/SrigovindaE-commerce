import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { sendReviewNudgeEmail } from '@/lib/notify/email';
import { isEligibleForReviewNudge } from '@/lib/review-nudge';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.srigovindacollections.com';

// Triggered by Vercel Cron (see vercel.json). Finds orders delivered at least
// REVIEW_NUDGE_DELAY_DAYS ago that haven't already gotten a nudge, and emails the customer
// asking for a review. Filtering is done in-memory (same rationale as the abandoned-cart cron —
// avoids needing a composite index for a status equality + timestamp range query).
export async function GET(request) {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const snap = await adminDb().collection('orders').where('status', '==', 'delivered').get();

  let sent = 0;
  let skipped = 0;
  const errors = [];

  for (const doc of snap.docs) {
    const order = doc.data();
    if (!isEligibleForReviewNudge(order)) {
      skipped++;
      continue;
    }

    try {
      const result = await sendReviewNudgeEmail(order, SITE_URL);
      if (result.sent) {
        await doc.ref.update({ reviewNudgeSentAt: new Date() });
        sent++;
      } else {
        skipped++;
      }
    } catch (err) {
      errors.push({ orderId: doc.id, error: err.message });
    }
  }

  return NextResponse.json({ checked: snap.size, sent, skipped, errors });
}
