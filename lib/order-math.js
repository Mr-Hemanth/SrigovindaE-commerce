// Small pure helpers shared by anything that aggregates the orders collection (CRM stats,
// admin reports, ...).

export function toDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Only orders that actually represent a completed/paid sale count toward revenue — a
// pending/failed online payment was never money in hand.
export function isCountableOrder(order) {
  if (order.paymentMethod === 'cod') return order.status !== 'cancelled';
  return order.paymentStatus === 'Paid';
}
