import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { sendOrderStatusEmail } from '@/lib/notify/email';

// Only these fields may ever be set through this route — an explicit allowlist rather than
// trusting an arbitrary "updates" object from the client.
const ALLOWED_STATUS = ['pending', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'];
const ALLOWED_PAYMENT_STATUS = ['Cancelled', 'Refunded'];
const ALLOWED_REQUEST_STATUS = ['approved', 'rejected'];

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

  const { orderId, status, paymentStatus, requestStatus, courierName, trackingNumber, trackingUrl } = await request.json();
  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  const updates = {};
  if (status !== undefined) {
    if (!ALLOWED_STATUS.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    updates.status = status;
    // Drives the review-nudge cron's "N days after delivery" timing (see
    // app/api/cron/review-nudge/route.js) — there was no per-status timestamp before this.
    if (status === 'delivered') {
      updates.deliveredAt = new Date();
    }
  }
  if (paymentStatus !== undefined) {
    if (!ALLOWED_PAYMENT_STATUS.includes(paymentStatus)) {
      return NextResponse.json({ error: 'Invalid paymentStatus' }, { status: 400 });
    }
    updates.paymentStatus = paymentStatus;
  }
  if (requestStatus !== undefined) {
    if (!ALLOWED_REQUEST_STATUS.includes(requestStatus)) {
      return NextResponse.json({ error: 'Invalid requestStatus' }, { status: 400 });
    }
    updates.requestStatus = requestStatus;
  }
  if (courierName !== undefined) {
    if (typeof courierName !== 'string' || courierName.length > 100) {
      return NextResponse.json({ error: 'Invalid courierName' }, { status: 400 });
    }
    updates.courierName = courierName.trim();
  }
  if (trackingNumber !== undefined) {
    if (typeof trackingNumber !== 'string' || trackingNumber.length > 100) {
      return NextResponse.json({ error: 'Invalid trackingNumber' }, { status: 400 });
    }
    updates.trackingNumber = trackingNumber.trim();
  }
  if (trackingUrl !== undefined) {
    if (typeof trackingUrl !== 'string' || trackingUrl.length > 500) {
      return NextResponse.json({ error: 'Invalid trackingUrl' }, { status: 400 });
    }
    updates.trackingUrl = trackingUrl.trim();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const orderRef = adminDb().collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  await orderRef.update(updates);

  if (updates.status) {
    const order = { ...orderSnap.data(), ...updates };
    await sendOrderStatusEmail(order, updates.status);
  }

  return NextResponse.json({ success: true });
}
