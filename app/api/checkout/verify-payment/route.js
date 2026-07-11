import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { sendOrderConfirmationEmail } from '@/lib/notify/email';
import { createShiprocketShipment } from '@/lib/shiprocket';

// Best-effort: shipment creation should never block payment confirmation. Failures are logged
// so an admin can still enter tracking info manually via the Orders panel.
async function tryCreateShipment(orderRef, order) {
  try {
    const shipment = await createShiprocketShipment(order);
    if (shipment.trackingNumber) {
      await orderRef.update({
        courierName: shipment.courierName || '',
        trackingNumber: shipment.trackingNumber,
        trackingUrl: shipment.trackingUrl || '',
        shiprocketShipmentId: shipment.shipmentId,
      });
    }
  } catch (err) {
    console.error('Shiprocket shipment creation failed for order', order.orderId, err);
  }
}

async function verifyUser(request) {
  const authHeader = request.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) return null;
  try {
    return await adminAuth().verifyIdToken(idToken);
  } catch {
    return null;
  }
}

export async function POST(request) {
  const decoded = await verifyUser(request);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 });
  }

  const orderRef = adminDb().collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const order = orderSnap.data();
  if (order.userId !== decoded.uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (order.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json({ error: 'Order/payment mismatch' }, { status: 400 });
  }
  if (order.paymentStatus === 'Paid') {
    // Already verified (e.g. duplicate handler call) — return success idempotently.
    return NextResponse.json({ verified: true, orderId });
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const provided = Buffer.from(razorpay_signature, 'utf-8');
  const expected = Buffer.from(expectedSignature, 'utf-8');
  const isValid = provided.length === expected.length && crypto.timingSafeEqual(provided, expected);

  if (!isValid) {
    await orderRef.update({ paymentStatus: 'Failed', status: 'payment_failed' });
    return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
  }

  await orderRef.update({
    paymentStatus: 'Paid',
    status: 'processing',
    razorpayPaymentId: razorpay_payment_id,
    paidAt: new Date(),
  });

  const paidOrder = { ...order, paymentStatus: 'Paid', paymentMethod: 'Razorpay Online' };
  await Promise.all([
    sendOrderConfirmationEmail(paidOrder),
    tryCreateShipment(orderRef, paidOrder),
  ]);

  return NextResponse.json({ verified: true, orderId, finalTotal: order.finalTotal });
}
