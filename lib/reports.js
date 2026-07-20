// Pure report-generation logic for the admin Reports page: sales (date-ranged) and inventory
// (point-in-time) summaries, plus their CSV exports.

import { toDate, isCountableOrder } from './order-math';
import { rowsToCsv } from './csv';

const LOW_STOCK_THRESHOLD = 5;

// --- Sales report ---------------------------------------------------------

// startDate/endDate are inclusive, JS Date objects (or null to leave that side unbounded).
export function filterOrdersByDateRange(orders, startDate, endDate) {
  return orders.filter((order) => {
    const created = toDate(order.createdAt);
    if (!created) return false;
    if (startDate && created < startDate) return false;
    if (endDate && created > endDate) return false;
    return true;
  });
}

export function buildSalesReport(orders) {
  const countable = orders.filter(isCountableOrder);
  const codOrders = countable.filter((o) => o.paymentMethod === 'cod');
  const onlineOrders = countable.filter((o) => o.paymentMethod !== 'cod');

  const totalRevenue = countable.reduce((sum, o) => sum + (Number(o.finalTotal) || 0), 0);
  const totalDiscount = countable.reduce((sum, o) => {
    const subtotal = Number(o.subtotal) || 0;
    const pct = Number(o.discount) || 0;
    return sum + (subtotal * pct) / 100;
  }, 0);
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;
  const returnedCount = orders.filter((o) => o.status === 'returned').length;

  return {
    orderCount: countable.length,
    totalRevenue,
    totalDiscount,
    avgOrderValue: countable.length > 0 ? totalRevenue / countable.length : 0,
    codRevenue: codOrders.reduce((sum, o) => sum + (Number(o.finalTotal) || 0), 0),
    onlineRevenue: onlineOrders.reduce((sum, o) => sum + (Number(o.finalTotal) || 0), 0),
    codCount: codOrders.length,
    onlineCount: onlineOrders.length,
    cancelledCount,
    returnedCount,
    orders: countable,
  };
}

export function salesReportToCsv(orders) {
  const header = ['Order ID', 'Date', 'Customer', 'Payment Method', 'Status', 'Subtotal', 'Discount %', 'Final Total'];
  const rows = orders.map((o) => {
    const created = toDate(o.createdAt);
    return [
      o.orderId || o.id || '',
      created ? created.toISOString().slice(0, 10) : '',
      o.userName || o.userEmail || '',
      o.paymentMethod === 'cod' ? 'COD' : (o.paymentMethod || ''),
      o.status || '',
      Number(o.subtotal) || 0,
      Number(o.discount) || 0,
      Number(o.finalTotal) || 0,
    ];
  });
  return rowsToCsv(header, rows);
}

// --- Inventory report ------------------------------------------------------

export function buildInventoryReport(products) {
  const active = products.filter((p) => p.isActive !== false);
  const totalUnits = active.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const totalValue = active.reduce((sum, p) => sum + (Number(p.stock) || 0) * (Number(p.price) || 0), 0);
  const outOfStock = active.filter((p) => (Number(p.stock) || 0) === 0);
  const lowStock = active.filter((p) => {
    const stock = Number(p.stock) || 0;
    return stock > 0 && stock <= LOW_STOCK_THRESHOLD;
  });

  return {
    productCount: active.length,
    totalUnits,
    totalValue,
    outOfStockCount: outOfStock.length,
    lowStockCount: lowStock.length,
    products: active,
  };
}

export function inventoryReportToCsv(products) {
  const header = ['Product', 'Category', 'Price', 'Stock', 'Stock Value', 'Status'];
  const rows = products.map((p) => {
    const stock = Number(p.stock) || 0;
    const price = Number(p.price) || 0;
    const status = stock === 0 ? 'Out of Stock' : stock <= LOW_STOCK_THRESHOLD ? 'Low Stock' : 'In Stock';
    return [p.name || '', p.category || '', price, stock, stock * price, status];
  });
  return rowsToCsv(header, rows);
}
