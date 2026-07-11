import 'server-only';

const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';
const PICKUP_LOCATION = 'home';

// Jewelry items are small and light; individual products don't track weight/dimensions, so a
// single conservative per-order package estimate is used instead of per-item accuracy.
const BASE_WEIGHT_KG = 0.1;
const PER_ITEM_WEIGHT_KG = 0.05;
const PACKAGE_DIMENSIONS_CM = { length: 15, breadth: 10, height: 5 };

let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getToken() {
  if (cachedToken && Date.now() < cachedTokenExpiresAt) {
    return cachedToken;
  }
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(data.message || 'Shiprocket authentication failed');
  }
  cachedToken = data.token;
  // Tokens are valid ~10 days; refresh a bit early to be safe.
  cachedTokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000;
  return cachedToken;
}

async function shiprocketFetch(path, options = {}) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Shiprocket request failed: ${path}`);
  }
  return data;
}

function splitName(fullName) {
  const trimmed = (fullName || 'Customer').trim();
  const [first, ...rest] = trimmed.split(/\s+/);
  return { first: first || 'Customer', last: rest.join(' ') || '.' };
}

// Creates the order in Shiprocket and assigns a courier/AWB. Returns the info needed to show
// real tracking to the customer, or throws — callers should catch and fall back to leaving the
// order without tracking info (an admin can still enter it manually) rather than blocking the
// order itself on a shipping-API failure.
export async function createShiprocketShipment(order) {
  const { first, last } = splitName(order.userName);
  const weight = Math.max(0.1, BASE_WEIGHT_KG + PER_ITEM_WEIGHT_KG * (order.items?.length || 1));

  const orderDate = (order.createdAt?.toDate ? order.createdAt.toDate() : new Date())
    .toISOString()
    .slice(0, 16)
    .replace('T', ' ');

  const createPayload = {
    order_id: order.orderId,
    order_date: orderDate,
    pickup_location: PICKUP_LOCATION,
    billing_customer_name: first,
    billing_last_name: last,
    billing_address: `${order.shippingArea}${order.shippingLandmark ? ', ' + order.shippingLandmark : ''}`,
    billing_city: order.shippingCity,
    billing_pincode: order.shippingPincode,
    billing_state: order.shippingState,
    billing_country: 'India',
    billing_email: order.userEmail,
    billing_phone: String(order.phone).slice(-10),
    shipping_is_billing: true,
    order_items: (order.items || []).map((item) => ({
      name: item.name,
      sku: item.id,
      units: item.quantity,
      selling_price: item.price,
    })),
    payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
    sub_total: order.subtotal,
    length: PACKAGE_DIMENSIONS_CM.length,
    breadth: PACKAGE_DIMENSIONS_CM.breadth,
    height: PACKAGE_DIMENSIONS_CM.height,
    weight,
  };

  const created = await shiprocketFetch('/orders/create/adhoc', {
    method: 'POST',
    body: JSON.stringify(createPayload),
  });

  const shipmentId = created.shipment_id;
  if (!shipmentId) {
    throw new Error('Shiprocket did not return a shipment_id');
  }

  const assigned = await shiprocketFetch('/courier/assign/awb', {
    method: 'POST',
    body: JSON.stringify({ shipment_id: shipmentId }),
  });

  const awbData = assigned.response?.data;
  if (!awbData?.awb_code) {
    // Order was created in Shiprocket even though courier assignment didn't complete —
    // still worth recording the shipment so it's visible in the Shiprocket dashboard.
    return { shipmentId, courierName: null, trackingNumber: null, trackingUrl: null };
  }

  return {
    shipmentId,
    courierName: awbData.courier_name || null,
    trackingNumber: awbData.awb_code,
    trackingUrl: `https://shiprocket.co/tracking/${awbData.awb_code}`,
  };
}
