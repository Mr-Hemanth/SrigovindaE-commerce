import 'server-only';
import { Resend } from 'resend';
import { escapeHtml } from './escape-html';
import { deriveTaxBreakup } from '../tax';

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
    .map((item) => `<tr><td style="padding:6px 0;">${escapeHtml(item.name)}${item.variantLabel ? ` — ${escapeHtml(item.variantLabel)}` : ''} × ${Number(item.quantity) || 0}</td><td style="padding:6px 0; text-align:right;">₹${Number(item.price) || 0}</td></tr>`)
    .join('');
}

export async function sendOrderConfirmationEmail(order) {
  const taxBreakup = deriveTaxBreakup(order.finalTotal);
  return sendEmail({
    to: order.userEmail,
    subject: `Order Confirmed — #${order.orderId}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#1a1a1a;">Thank you for your order, ${escapeHtml(order.userName) || 'valued customer'}!</h2>
        <p>Your order <strong>#${escapeHtml(order.orderId)}</strong> has been confirmed.</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">${itemsHtml(order.items)}</table>
        <p>Taxable Value: ₹${taxBreakup.taxableValue.toFixed(2)}</p>
        <p>GST (${(taxBreakup.rate * 100).toFixed(0)}%, included): ₹${taxBreakup.taxAmount.toFixed(2)}</p>
        <p style="font-weight:bold;">Total: ₹${Number(order.finalTotal) || 0}</p>
        <p style="color:#666; font-size:11px;">Inclusive of all taxes.</p>
        <p>Payment: ${escapeHtml(order.paymentMethod)} (${escapeHtml(order.paymentStatus)})</p>
        <p>Shipping to: ${escapeHtml(order.shippingAddress)}</p>
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
        <h2 style="color:#1a1a1a;">Your order status has changed</h2>
        <p>Order <strong>#${escapeHtml(order.orderId)}</strong> is now: <strong>${escapeHtml(newStatus)}</strong></p>
        <p style="margin-top:24px; color:#666; font-size:12px;">Sri Govinda Collections</p>
      </div>
    `,
  });
}

export async function sendAbandonedCartEmail(cart, siteUrl) {
  return sendEmail({
    to: cart.userEmail,
    subject: `You left something behind, ${cart.userName || 'there'} — your cart is waiting`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#1a1a1a;">Still thinking it over?</h2>
        <p>You left these pieces in your cart at Sri Govinda Collections:</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0;">${itemsHtml(cart.items)}</table>
        <p style="text-align:center; margin: 24px 0;">
          <a href="${siteUrl}/cart" style="background:#1a1a1a; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold;">Return to Your Cart</a>
        </p>
        <p style="margin-top:24px; color:#666; font-size:12px;">Sri Govinda Collections</p>
      </div>
    `,
  });
}
