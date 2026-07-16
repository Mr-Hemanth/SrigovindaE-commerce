import 'server-only';
import { Resend } from 'resend';
import { escapeHtml } from './escape-html';

const FROM_ADDRESS = 'Sri Govinda Collections <orders@srigovindacollections.com>';
const OWNER_EMAIL = 'srigovindagermansilver@gmail.com';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.srigovindacollections.com';

const NAVY = '#1a1a1a';
const GOLD = '#b8860b';
const CREAM = '#faf8f5';
const BORDER = '#eeeae4';

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

function formatMoney(value) {
  return Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatDate(value) {
  const d = value?.toDate ? value.toDate() : new Date(value || Date.now());
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Shared branded shell every transactional email renders inside — table-based layout so it
// holds up in Outlook/older clients, not just modern ones that support flexbox in email.
function renderShell({ preheader, bodyHtml, footerLine = 'Thank you for shopping with us' }) {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sri Govinda Collections</title>
  </head>
  <body style="margin:0; padding:0; background-color:${CREAM}; font-family:Helvetica,Arial,sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(preheader || '')}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CREAM};">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.06);">
            <tr>
              <td style="background-color:${NAVY}; padding:28px 32px; text-align:center;">
                <span style="color:${GOLD}; font-family:Georgia,'Times New Roman',serif; font-size:22px; font-weight:bold; letter-spacing:0.5px;">Sri Govinda Collections</span>
                <p style="margin:6px 0 0; color:#cfcfcf; font-size:11px; letter-spacing:0.5px;">Jewellery · German Silver · Gift Articles</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="background-color:${NAVY}; padding:24px 32px; text-align:center;">
                <p style="margin:0 0 8px; color:#ffffff; font-size:13px; font-weight:bold;">${escapeHtml(footerLine)}</p>
                <p style="margin:0 0 4px; color:#bbbbbb; font-size:11px;">Devangula Street, Amalapuram, AP, India</p>
                <p style="margin:0 0 10px; color:#bbbbbb; font-size:11px;">+91 9533866777 &nbsp;·&nbsp; srigovindagermansilver@gmail.com</p>
                <p style="margin:0; color:#777777; font-size:10px;">This is an automated message — please don't reply directly to this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function itemRowsHtml(items) {
  return (items || [])
    .map((item) => {
      const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
      const nameLabel = escapeHtml(item.name) + (item.variantLabel ? ` — ${escapeHtml(item.variantLabel)}` : '');
      const imgCell = item.image
        ? `<td width="64" style="padding:12px 12px 12px 0; vertical-align:top;">
             <img src="${escapeHtml(item.image)}" width="56" height="56" alt="" style="display:block; width:56px; height:56px; object-fit:cover; border-radius:8px; border:1px solid ${BORDER};" />
           </td>`
        : '';
      return `
        <tr>
          ${imgCell}
          <td style="padding:12px 0; vertical-align:top; border-bottom:1px solid ${BORDER}; font-size:13px; color:#333;">
            <div style="font-weight:bold; color:${NAVY};">${nameLabel}</div>
            <div style="color:#888; margin-top:2px;">Qty ${Number(item.quantity) || 0} × ₹${formatMoney(item.price)}</div>
          </td>
          <td style="padding:12px 0; vertical-align:top; border-bottom:1px solid ${BORDER}; text-align:right; font-size:13px; font-weight:bold; color:${NAVY}; white-space:nowrap;">₹${formatMoney(lineTotal)}</td>
        </tr>`;
    })
    .join('');
}

function summaryRow(label, value, opts = {}) {
  const { bold, color } = opts;
  return `
    <tr>
      <td style="padding:4px 0; font-size:${bold ? '15px' : '13px'}; color:${color || '#555'}; font-weight:${bold ? 'bold' : 'normal'};">${label}</td>
      <td style="padding:4px 0; text-align:right; font-size:${bold ? '17px' : '13px'}; color:${color || (bold ? NAVY : '#333')}; font-weight:${bold ? 'bold' : 'normal'};">${value}</td>
    </tr>`;
}

function ctaButton(href, label) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 0;">
      <tr>
        <td style="border-radius:10px; background-color:${NAVY};">
          <a href="${href}" style="display:inline-block; padding:14px 32px; color:#ffffff; font-size:14px; font-weight:bold; text-decoration:none; border-radius:10px;">${label}</a>
        </td>
      </tr>
    </table>`;
}

export async function sendOrderConfirmationEmail(order) {
  const discountAmount = order.discount > 0 ? Number(order.subtotal || 0) * (Number(order.discount) / 100) : 0;
  const paymentLabel = order.paymentMethod === 'cod' ? 'Cash on Delivery' : String(order.paymentMethod || 'Online Payment');

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:16px;">
          <div style="width:56px; height:56px; border-radius:50%; background-color:#eef7ee; text-align:center; line-height:56px; font-size:26px;">✓</div>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom:10px;">
          <h1 style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:26px; color:${NAVY};">Order Confirmed!</h1>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom:20px;">
          <p style="margin:0; font-size:14px; color:#555;">Hi ${escapeHtml(order.userName) || 'there'}, thank you for shopping with <strong>Sri Govinda Collections</strong>.<br/>We've received your order and will start preparing it shortly.</p>
        </td>
      </tr>
      <tr>
        <td style="background-color:${CREAM}; border-radius:10px; padding:14px 18px; margin-bottom:8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:11px; color:#999; text-transform:uppercase; letter-spacing:0.5px;">Order Reference</td>
              <td style="font-size:11px; color:#999; text-transform:uppercase; letter-spacing:0.5px; text-align:right;">Date</td>
            </tr>
            <tr>
              <td style="font-size:14px; font-weight:bold; color:${NAVY}; font-family:monospace;">${escapeHtml(order.orderId)}</td>
              <td style="font-size:13px; color:${NAVY}; text-align:right;">${formatDate(order.createdAt)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <h3 style="margin:28px 0 4px; font-size:15px; color:${NAVY}; font-family:Georgia,'Times New Roman',serif;">Your Order</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itemRowsHtml(order.items)}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
      ${summaryRow('Subtotal', `₹${formatMoney(order.subtotal)}`)}
      ${order.discount > 0 ? summaryRow(`Discount (${order.discount}%)`, `−₹${formatMoney(discountAmount)}`, { color: '#0a7d3c' }) : ''}
      ${summaryRow('Shipping', 'FREE')}
      <tr><td colspan="2" style="border-top:1px solid ${BORDER}; padding-top:8px;"></td></tr>
      ${summaryRow('Grand Total', `₹${formatMoney(order.finalTotal)}`, { bold: true })}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr>
        <td width="50%" style="vertical-align:top; padding-right:12px;">
          <p style="margin:0 0 6px; font-size:11px; color:#999; text-transform:uppercase; letter-spacing:0.5px; font-weight:bold;">Shipping To</p>
          <p style="margin:0; font-size:13px; color:#333; line-height:1.5;">${escapeHtml(order.userName)}<br/>${escapeHtml(order.shippingAddress)}<br/>Phone: ${escapeHtml(order.phone)}</p>
        </td>
        <td width="50%" style="vertical-align:top; padding-left:12px;">
          <p style="margin:0 0 6px; font-size:11px; color:#999; text-transform:uppercase; letter-spacing:0.5px; font-weight:bold;">Payment</p>
          <p style="margin:0; font-size:13px; color:#333; line-height:1.5;">${escapeHtml(paymentLabel)}<br/>Status: ${escapeHtml(order.paymentStatus)}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          ${ctaButton(`${SITE_URL}/track/${encodeURIComponent(order.orderId)}`, 'Track Your Order')}
        </td>
      </tr>
    </table>
  `;

  return sendEmail({
    to: order.userEmail,
    subject: `Order Confirmed — #${order.orderId}`,
    html: renderShell({ preheader: `Your order #${order.orderId} for ₹${formatMoney(order.finalTotal)} has been confirmed.`, bodyHtml: body }),
  });
}

// Sent to the store owner (not the customer) the moment an order is created — a different,
// more operational layout than the customer confirmation: contact details up front so the
// owner can call/WhatsApp the customer directly, plus a link straight into the admin panel.
export async function sendAdminOrderAlertEmail(order) {
  const discountAmount = order.discount > 0 ? Number(order.subtotal || 0) * (Number(order.discount) / 100) : 0;
  const paymentLabel = order.paymentMethod === 'cod' ? 'Cash on Delivery' : String(order.paymentMethod || 'Online Payment');
  const paymentIsPaid = order.paymentStatus === 'Paid';

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color:${GOLD}; border-radius:10px; padding:14px 18px; margin-bottom:8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:16px; font-weight:bold; color:${NAVY};">🔔 New Order Received</td>
              <td style="text-align:right; font-size:18px; font-weight:bold; color:${NAVY};">₹${formatMoney(order.finalTotal)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-top:14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:11px; color:#999; text-transform:uppercase; letter-spacing:0.5px;">Order Reference</td>
              <td style="font-size:11px; color:#999; text-transform:uppercase; letter-spacing:0.5px; text-align:right;">Date</td>
            </tr>
            <tr>
              <td style="font-size:14px; font-weight:bold; color:${NAVY}; font-family:monospace;">${escapeHtml(order.orderId)}</td>
              <td style="font-size:13px; color:${NAVY}; text-align:right;">${formatDate(order.createdAt)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <h3 style="margin:24px 0 4px; font-size:15px; color:${NAVY}; font-family:Georgia,'Times New Roman',serif;">Customer</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CREAM}; border-radius:10px;">
      <tr>
        <td style="padding:14px 18px; font-size:13px; color:#333; line-height:1.6;">
          <strong style="color:${NAVY};">${escapeHtml(order.userName) || 'Customer'}</strong><br/>
          ${escapeHtml(order.userEmail)}<br/>
          Phone: ${escapeHtml(order.phone)}
        </td>
      </tr>
    </table>

    <h3 style="margin:24px 0 4px; font-size:15px; color:${NAVY}; font-family:Georgia,'Times New Roman',serif;">Items</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itemRowsHtml(order.items)}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
      ${summaryRow('Subtotal', `₹${formatMoney(order.subtotal)}`)}
      ${order.discount > 0 ? summaryRow(`Discount (${order.discount}%)`, `−₹${formatMoney(discountAmount)}`, { color: '#0a7d3c' }) : ''}
      <tr><td colspan="2" style="border-top:1px solid ${BORDER}; padding-top:8px;"></td></tr>
      ${summaryRow('Total', `₹${formatMoney(order.finalTotal)}`, { bold: true })}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr>
        <td width="50%" style="vertical-align:top; padding-right:12px;">
          <p style="margin:0 0 6px; font-size:11px; color:#999; text-transform:uppercase; letter-spacing:0.5px; font-weight:bold;">Ship To</p>
          <p style="margin:0; font-size:13px; color:#333; line-height:1.5;">${escapeHtml(order.shippingAddress)}</p>
        </td>
        <td width="50%" style="vertical-align:top; padding-left:12px;">
          <p style="margin:0 0 6px; font-size:11px; color:#999; text-transform:uppercase; letter-spacing:0.5px; font-weight:bold;">Payment</p>
          <p style="margin:0; font-size:13px; color:#333; line-height:1.5;">
            ${escapeHtml(paymentLabel)}<br/>
            Status: <strong style="color:${paymentIsPaid ? '#0a7d3c' : NAVY};">${escapeHtml(order.paymentStatus)}</strong>
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          ${ctaButton(`${SITE_URL}/admin/orders`, 'View in Admin Panel')}
        </td>
      </tr>
    </table>
  `;

  return sendEmail({
    to: OWNER_EMAIL,
    subject: `🛍️ New Order — #${order.orderId} (₹${formatMoney(order.finalTotal)})`,
    html: renderShell({
      preheader: `New order from ${order.userName || 'a customer'}: ₹${formatMoney(order.finalTotal)} via ${paymentLabel}.`,
      bodyHtml: body,
      footerLine: 'Admin order notification',
    }),
  });
}

export async function sendOrderStatusEmail(order, newStatus) {
  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:16px;">
          <h1 style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:20px; color:${NAVY};">Your order status has changed</h1>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom:8px;">
          <p style="margin:0; font-size:13px; color:#777;">Order <strong style="color:${NAVY}; font-family:monospace;">${escapeHtml(order.orderId)}</strong> is now:</p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:8px 0 24px;">
          <span style="display:inline-block; background-color:${CREAM}; color:${NAVY}; font-weight:bold; font-size:14px; padding:8px 20px; border-radius:999px; text-transform:capitalize;">${escapeHtml(newStatus)}</span>
        </td>
      </tr>
      <tr>
        <td align="center">
          ${ctaButton(`${SITE_URL}/track/${encodeURIComponent(order.orderId)}`, 'Track Your Order')}
        </td>
      </tr>
    </table>
  `;

  return sendEmail({
    to: order.userEmail,
    subject: `Order #${order.orderId} update: ${newStatus}`,
    html: renderShell({ preheader: `Order #${order.orderId} is now ${newStatus}.`, bodyHtml: body }),
  });
}

export async function sendAbandonedCartEmail(cart, siteUrl) {
  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:8px;">
          <h1 style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:20px; color:${NAVY};">Still thinking it over, ${escapeHtml(cart.userName) || 'there'}?</h1>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom:20px;">
          <p style="margin:0; font-size:13px; color:#777;">You left these pieces in your cart at Sri Govinda Collections:</p>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itemRowsHtml(cart.items)}
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          ${ctaButton(`${siteUrl}/cart`, 'Return to Your Cart')}
        </td>
      </tr>
    </table>
  `;

  return sendEmail({
    to: cart.userEmail,
    subject: `You left something behind, ${cart.userName || 'there'} — your cart is waiting`,
    html: renderShell({ preheader: 'Your cart is still saved — come back and complete your order.', bodyHtml: body }),
  });
}
