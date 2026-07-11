import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { sendOrderWhatsAppAlert, formatOrderAlertMessage } from '@/lib/notify/whatsapp';
import { sendOrderConfirmationEmail } from '@/lib/notify/email';
import { createShiprocketShipment } from '@/lib/shiprocket';

// Best-effort: shipment creation should never block order confirmation. Failures are logged so
// an admin can still enter tracking info manually via the Orders panel.
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

// Real orders may only be placed against real Firestore-backed products — never fall back to
// the static demo/offline catalog here, or a customer could complete a real payment against a
// placeholder product that was never actually for sale.
async function getAuthoritativePrice(itemId) {
  const snap = await adminDb().collection('products').doc(itemId).get();
  if (!snap.exists) return null;
  const data = snap.data();
  const price = Number(
    data.discountedPrice !== undefined && data.discountedPrice !== null && data.discountedPrice !== '' && Number(data.discountedPrice) > 0
      ? data.discountedPrice
      : data.price
  );
  return { price, name: data.name, category: data.category || '', active: data.isActive !== false };
}

async function getValidCoupon(code) {
  if (!code) return null;
  const snap = await adminDb().collection('coupons').where('code', '==', code.toUpperCase()).limit(1).get();
  if (snap.empty) return null;
  const coupon = snap.docs[0].data();
  const expiry = coupon.expiryDate?.toDate ? coupon.expiryDate.toDate() : new Date(coupon.expiryDate);
  if (expiry < new Date()) return null;
  return coupon;
}

export async function POST(request) {
  const decoded = await verifyUser(request);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    items, couponCode, shippingAddress, phone, userName, userEmail, paymentMethod, shippingCost = 0,
    shippingArea = '', shippingLandmark = '', shippingCity = '', shippingState = '', shippingPincode = '',
  } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }
  if (!shippingAddress || !phone) {
    return NextResponse.json({ error: 'Shipping address and phone are required' }, { status: 400 });
  }

  // Recompute every price server-side — never trust client-sent amounts.
  const resolvedItems = [];
  for (const item of items) {
    const authoritative = await getAuthoritativePrice(item.id);
    if (!authoritative || !authoritative.active) {
      return NextResponse.json({ error: `Product unavailable: ${item.name || item.id}` }, { status: 400 });
    }
    resolvedItems.push({
      id: item.id,
      name: authoritative.name,
      category: authoritative.category,
      price: authoritative.price,
      quantity: Math.max(1, Number(item.quantity) || 1),
    });
  }

  const subtotal = resolvedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  let discount = 0;
  const coupon = await getValidCoupon(couponCode);
  if (coupon) {
    discount = Number(coupon.discountPercentage) || 0;
  }

  const finalTotal = Math.round(subtotal * (1 - discount / 100) + Number(shippingCost || 0));
  const orderId = `SG_${decoded.uid.slice(0, 5)}_${Date.now()}`;

  const baseOrder = {
    orderId,
    userId: decoded.uid,
    userName: userName || 'Customer',
    userEmail: userEmail || decoded.email,
    shippingAddress,
    shippingArea,
    shippingLandmark,
    shippingCity,
    shippingState,
    shippingPincode,
    phone,
    items: resolvedItems,
    subtotal,
    discount,
    finalTotal,
    createdAt: new Date(),
  };

  if (paymentMethod === 'cod') {
    const order = {
      ...baseOrder,
      paymentMethod: 'cod',
      paymentStatus: 'COD',
      status: 'processing',
    };
    const orderRef = adminDb().collection('orders').doc(orderId);
    await orderRef.set(order);
    await Promise.all([
      sendOrderWhatsAppAlert(formatOrderAlertMessage(order)),
      sendOrderConfirmationEmail(order),
      tryCreateShipment(orderRef, order),
    ]);
    return NextResponse.json({ orderId, method: 'cod', finalTotal });
  }

  // Online payment: create a pending order + a Razorpay order, verified later in /verify-payment.
  const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(finalTotal * 100),
    currency: 'INR',
    receipt: orderId,
  });

  const order = {
    ...baseOrder,
    paymentMethod: 'Razorpay Online',
    paymentStatus: 'Pending',
    status: 'pending',
    razorpayOrderId: razorpayOrder.id,
  };
  await adminDb().collection('orders').doc(orderId).set(order);

  return NextResponse.json({
    orderId,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    finalTotal,
  });
}
