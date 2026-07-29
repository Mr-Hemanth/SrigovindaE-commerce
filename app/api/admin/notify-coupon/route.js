import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { sendCouponCreatedEmail } from '@/lib/notify/email';

// Coupon creation itself still happens client-side (AdminCoupons.js writes straight to
// Firestore, same as edit/delete) — this route only fires the owner-notification email, gated
// behind an admin check so it can't be used to spam arbitrary email content.
async function requireAdmin(request) {
  const authHeader = request.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    const userSnap = await adminDb().collection('users').doc(decoded.uid).get();
    if (!userSnap.exists || userSnap.data().isAdmin !== true) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function POST(request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { code, discountPercentage, expiryDate, maxUsesPerUser } = await request.json();
  if (!code || !discountPercentage || !expiryDate) {
    return NextResponse.json({ error: 'code, discountPercentage and expiryDate are required' }, { status: 400 });
  }

  await sendCouponCreatedEmail({ code, discountPercentage, expiryDate, maxUsesPerUser });

  return NextResponse.json({ success: true });
}
