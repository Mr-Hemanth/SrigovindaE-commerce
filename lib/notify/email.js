import 'server-only';
import { Resend } from 'resend';

const FROM_ADDRESS = 'Sri Govinda Collections <orders@srigovindacollections.com>';

// Never let an email failure break order creation/status updates — these are best-effort
// notifications, not part of the transaction's correctness.
async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to) {
    if (!apiKey) console.warn('Order email skipped: RESEND_API_KEY not configured.');
    return { sent: false };
  }
  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
    return { sent: true };
  } catch (err) {
    console.error('Order email failed:', err);
    return { sent: false };
  }
}

function itemsHtml(items) {
  return (items || [])
    .map((item) => `<tr><td style="padding:6px 0;">${item.name} × ${item.quantity}</td><td style="padding:6px 0; text-align:right;">₹${item.price}</td></tr>`)
    .join('');
}

export async function sendOrderConfirmationEmail(order) {
  return sendEmail({
    to: order.userEmail,
    subject: `Order Confirmed — #${order.orderId}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#0f2a4a;">Thank you for your order, ${order.userName || 'valued customer'}!</h2>
        <p>Your order <strong>#${order.orderId}</strong> has been confirmed.</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">${itemsHtml(order.items)}</table>
        <p style="font-weight:bold;">Total: ₹${order.finalTotal}</p>
        <p>Payment: ${order.paymentMethod} (${order.paymentStatus})</p>
        <p>Shipping to: ${order.shippingAddress}</p>
        <p style="margin-top:24px; color:#666; font-size:12px;">Sri Govinda Collections</p>
      </div>
    `,
  });
}

export async function sendOrderStatusEmail(order, newStatus) {
  return sendEmail({
    to: order.userEmail,
    subject: `Order #${order.orderId} update: ${newStatus}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#0f2a4a;">Your order status has changed</h2>
        <p>Order <strong>#${order.orderId}</strong> is now: <strong>${newStatus}</strong></p>
        <p style="margin-top:24px; color:#666; font-size:12px;">Sri Govinda Collections</p>
      </div>
    `,
  });
}
