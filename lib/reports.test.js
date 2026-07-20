import { filterOrdersByDateRange, buildSalesReport, salesReportToCsv, buildInventoryReport, inventoryReportToCsv } from './reports';

describe('filterOrdersByDateRange', () => {
  const orders = [
    { id: 'a', createdAt: '2026-07-01' },
    { id: 'b', createdAt: '2026-07-10' },
    { id: 'c', createdAt: '2026-07-20' },
  ];

  it('includes orders within an inclusive range', () => {
    const result = filterOrdersByDateRange(orders, new Date('2026-07-05'), new Date('2026-07-15'));
    expect(result.map((o) => o.id)).toEqual(['b']);
  });

  it('leaves a side unbounded when null', () => {
    expect(filterOrdersByDateRange(orders, null, new Date('2026-07-10')).map((o) => o.id)).toEqual(['a', 'b']);
    expect(filterOrdersByDateRange(orders, new Date('2026-07-10'), null).map((o) => o.id)).toEqual(['b', 'c']);
  });

  it('drops orders with no valid date', () => {
    const withBad = [...orders, { id: 'd', createdAt: null }];
    expect(filterOrdersByDateRange(withBad, null, null).map((o) => o.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('buildSalesReport', () => {
  const orders = [
    { orderId: 'S1', paymentMethod: 'cod', status: 'delivered', subtotal: 1000, discount: 10, finalTotal: 900, createdAt: '2026-07-01' },
    { orderId: 'S2', paymentMethod: 'cod', status: 'cancelled', subtotal: 500, discount: 0, finalTotal: 500, createdAt: '2026-07-02' },
    { orderId: 'S3', paymentMethod: 'Razorpay Online', paymentStatus: 'Paid', status: 'delivered', subtotal: 2000, discount: 0, finalTotal: 2000, createdAt: '2026-07-03' },
    { orderId: 'S4', paymentMethod: 'Razorpay Online', paymentStatus: 'Failed', status: 'pending', subtotal: 1500, discount: 0, finalTotal: 1500, createdAt: '2026-07-04' },
    { orderId: 'S5', paymentMethod: 'cod', status: 'returned', subtotal: 300, discount: 0, finalTotal: 300, createdAt: '2026-07-05' },
  ];

  it('only counts non-cancelled COD and Paid online orders toward revenue', () => {
    const report = buildSalesReport(orders);
    expect(report.orderCount).toBe(3); // S1, S3, S5 (cancelled S2 and failed S4 excluded)
    expect(report.totalRevenue).toBe(900 + 2000 + 300);
  });

  it('splits revenue by payment method', () => {
    const report = buildSalesReport(orders);
    expect(report.codCount).toBe(2);
    expect(report.codRevenue).toBe(900 + 300);
    expect(report.onlineCount).toBe(1);
    expect(report.onlineRevenue).toBe(2000);
  });

  it('computes total discount given and status counts', () => {
    const report = buildSalesReport(orders);
    expect(report.totalDiscount).toBe(100); // 10% of S1's 1000 subtotal
    expect(report.cancelledCount).toBe(1);
    expect(report.returnedCount).toBe(1);
  });

  it('computes average order value', () => {
    const report = buildSalesReport(orders);
    expect(report.avgOrderValue).toBeCloseTo((900 + 2000 + 300) / 3, 5);
  });

  it('handles an empty order list', () => {
    const report = buildSalesReport([]);
    expect(report.orderCount).toBe(0);
    expect(report.avgOrderValue).toBe(0);
  });
});

describe('salesReportToCsv', () => {
  it('renders one row per order', () => {
    const csv = salesReportToCsv([
      { orderId: 'S1', userName: 'Alice', paymentMethod: 'cod', status: 'delivered', subtotal: 1000, discount: 10, finalTotal: 900, createdAt: '2026-07-01' },
    ]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Order ID,Date,Customer,Payment Method,Status,Subtotal,Discount %,Final Total');
    expect(lines[1]).toBe('S1,2026-07-01,Alice,COD,delivered,1000,10,900');
  });
});

describe('buildInventoryReport', () => {
  const products = [
    { name: 'A', category: 'gifts', price: 100, stock: 0, isActive: true },
    { name: 'B', category: 'gifts', price: 200, stock: 3, isActive: true },
    { name: 'C', category: 'gifts', price: 300, stock: 50, isActive: true },
    { name: 'D', category: 'gifts', price: 999, stock: 10, isActive: false },
  ];

  it('excludes inactive products', () => {
    const report = buildInventoryReport(products);
    expect(report.productCount).toBe(3);
  });

  it('flags out-of-stock and low-stock counts', () => {
    const report = buildInventoryReport(products);
    expect(report.outOfStockCount).toBe(1);
    expect(report.lowStockCount).toBe(1); // stock=3, threshold 5
  });

  it('computes total units and stock value', () => {
    const report = buildInventoryReport(products);
    expect(report.totalUnits).toBe(0 + 3 + 50);
    expect(report.totalValue).toBe(0 * 100 + 3 * 200 + 50 * 300);
  });
});

describe('inventoryReportToCsv', () => {
  it('labels stock status correctly', () => {
    const csv = inventoryReportToCsv([
      { name: 'Out', category: 'gifts', price: 100, stock: 0 },
      { name: 'Low', category: 'gifts', price: 100, stock: 2 },
      { name: 'Ok', category: 'gifts', price: 100, stock: 20 },
    ]);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('Out,gifts,100,0,0,Out of Stock');
    expect(lines[2]).toBe('Low,gifts,100,2,200,Low Stock');
    expect(lines[3]).toBe('Ok,gifts,100,20,2000,In Stock');
  });
});
