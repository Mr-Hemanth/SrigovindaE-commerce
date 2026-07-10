import 'server-only';

// Sends a free-form WhatsApp text via CallMeBot (https://www.callmebot.com/blog/free-api-whatsapp-messages/).
// One-time setup: message the CallMeBot number on WhatsApp with "I allow callmebot to send me messages"
// from the phone set in CALLMEBOT_PHONE, then set the API key it replies with as CALLMEBOT_APIKEY.
export async function sendOrderWhatsAppAlert(message) {
  const phone = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;

  if (!phone || !apikey) {
    console.warn('WhatsApp order alert skipped: CALLMEBOT_PHONE/CALLMEBOT_APIKEY not configured.');
    return { sent: false, reason: 'not_configured' };
  }

  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apikey)}`;

  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      console.error('WhatsApp order alert failed', res.status, await res.text());
      return { sent: false, reason: `http_${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    // Never let a notification failure break order creation.
    console.error('WhatsApp order alert error', err);
    return { sent: false, reason: 'network_error' };
  }
}

export function formatOrderAlertMessage(order) {
  const itemLines = (order.items || [])
    .map((item) => `- ${item.name} x${item.quantity}`)
    .join('\n');

  return [
    '🛍️ New order received!',
    `Order: ${order.orderId}`,
    `Customer: ${order.userName || order.userEmail}`,
    `Total: ₹${order.finalTotal}`,
    `Payment: ${order.paymentMethod}${order.paymentStatus ? ` (${order.paymentStatus})` : ''}`,
    itemLines ? `Items:\n${itemLines}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}
