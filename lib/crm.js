// Pure customer-relationship logic shared by the admin Customers page: turning raw
// users + orders collections into a directory with per-customer stats and a segment tag.

const VIP_SPEND_THRESHOLD = 10000; // ₹ lifetime spend
const NEW_CUSTOMER_DAYS = 30;
const AT_RISK_DAYS = 60;

function toDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Only orders that actually represent a completed/paid sale count toward spend — a
// pending/failed online payment was never money in hand.
function isCountableOrder(order) {
  if (order.paymentMethod === 'cod') return order.status !== 'cancelled';
  return order.paymentStatus === 'Paid';
}

export function computeCustomerStats(orders, now = new Date()) {
  const countable = orders.filter(isCountableOrder);
  const orderCount = countable.length;
  const totalSpent = countable.reduce((sum, o) => sum + (Number(o.finalTotal) || 0), 0);
  const dates = countable.map((o) => toDate(o.createdAt)).filter(Boolean);
  const lastOrderDate = dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null;
  const daysSinceLastOrder = lastOrderDate ? Math.floor((now - lastOrderDate) / (1000 * 60 * 60 * 24)) : null;
  const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

  return { orderCount, totalSpent, avgOrderValue, lastOrderDate, daysSinceLastOrder };
}

export function deriveCustomerSegment(stats, joinedAt, now = new Date()) {
  const joined = toDate(joinedAt);
  const daysSinceJoined = joined ? Math.floor((now - joined) / (1000 * 60 * 60 * 24)) : null;

  if (stats.orderCount === 0) {
    return daysSinceJoined !== null && daysSinceJoined <= NEW_CUSTOMER_DAYS ? 'New' : 'No Orders';
  }
  if (stats.totalSpent >= VIP_SPEND_THRESHOLD) return 'VIP';
  if (stats.daysSinceLastOrder !== null && stats.daysSinceLastOrder > AT_RISK_DAYS) return 'At Risk';
  if (stats.orderCount >= 2) return 'Repeat';
  return 'Active';
}

// Joins the users and orders collections into one directory row per customer.
export function buildCustomerDirectory(users, orders, now = new Date()) {
  const ordersByUser = new Map();
  for (const order of orders) {
    if (!order.userId) continue;
    if (!ordersByUser.has(order.userId)) ordersByUser.set(order.userId, []);
    ordersByUser.get(order.userId).push(order);
  }

  return users
    .filter((u) => !u.isAdmin)
    .map((user) => {
      const userOrders = ordersByUser.get(user.id) || [];
      const stats = computeCustomerStats(userOrders, now);
      const segment = deriveCustomerSegment(stats, user.createdAt, now);
      return { ...user, ...stats, segment, orders: userOrders };
    });
}

export function csvEscape(value) {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function customersToCsv(customers) {
  const header = ['Name', 'Email', 'Phone', 'Segment', 'Orders', 'Total Spent', 'Last Order'];
  const rows = customers.map((c) => [
    c.name || '',
    c.email || '',
    c.phone || '',
    c.segment,
    c.orderCount,
    c.totalSpent.toFixed(0),
    c.lastOrderDate ? c.lastOrderDate.toISOString().slice(0, 10) : '',
  ]);
  return [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
}
