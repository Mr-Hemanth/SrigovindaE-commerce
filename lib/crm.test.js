import { computeCustomerStats, deriveCustomerSegment, buildCustomerDirectory, customersToCsv } from './crm';

const NOW = new Date('2026-07-13T00:00:00Z');

describe('computeCustomerStats', () => {
  it('sums only paid online orders and all non-cancelled COD orders', () => {
    const orders = [
      { paymentMethod: 'Razorpay Online', paymentStatus: 'Paid', finalTotal: 1000, createdAt: '2026-07-01' },
      { paymentMethod: 'Razorpay Online', paymentStatus: 'Failed', finalTotal: 5000, createdAt: '2026-07-02' },
      { paymentMethod: 'cod', paymentStatus: 'COD', status: 'processing', finalTotal: 500, createdAt: '2026-07-03' },
      { paymentMethod: 'cod', paymentStatus: 'COD', status: 'cancelled', finalTotal: 999, createdAt: '2026-07-04' },
    ];
    const stats = computeCustomerStats(orders, NOW);
    expect(stats.orderCount).toBe(2);
    expect(stats.totalSpent).toBe(1500);
  });

  it('computes avg order value and days since last order', () => {
    const orders = [
      { paymentMethod: 'cod', status: 'processing', finalTotal: 1000, createdAt: '2026-07-03' },
      { paymentMethod: 'cod', status: 'processing', finalTotal: 2000, createdAt: '2026-06-13' },
    ];
    const stats = computeCustomerStats(orders, NOW);
    expect(stats.avgOrderValue).toBe(1500);
    expect(stats.daysSinceLastOrder).toBe(10);
  });

  it('returns zeroed stats for no orders', () => {
    const stats = computeCustomerStats([], NOW);
    expect(stats).toEqual({ orderCount: 0, totalSpent: 0, avgOrderValue: 0, lastOrderDate: null, daysSinceLastOrder: null });
  });
});

describe('deriveCustomerSegment', () => {
  it('tags a recently-joined customer with no orders as New', () => {
    const stats = { orderCount: 0, totalSpent: 0, daysSinceLastOrder: null };
    expect(deriveCustomerSegment(stats, '2026-07-01', NOW)).toBe('New');
  });

  it('tags a long-registered customer with no orders as No Orders', () => {
    const stats = { orderCount: 0, totalSpent: 0, daysSinceLastOrder: null };
    expect(deriveCustomerSegment(stats, '2026-01-01', NOW)).toBe('No Orders');
  });

  it('tags high lifetime spend as VIP regardless of recency', () => {
    const stats = { orderCount: 3, totalSpent: 15000, daysSinceLastOrder: 90 };
    expect(deriveCustomerSegment(stats, '2026-01-01', NOW)).toBe('VIP');
  });

  it('tags a lapsed non-VIP customer as At Risk', () => {
    const stats = { orderCount: 1, totalSpent: 2000, daysSinceLastOrder: 61 };
    expect(deriveCustomerSegment(stats, '2026-01-01', NOW)).toBe('At Risk');
  });

  it('tags 2+ recent orders as Repeat', () => {
    const stats = { orderCount: 2, totalSpent: 2000, daysSinceLastOrder: 5 };
    expect(deriveCustomerSegment(stats, '2026-01-01', NOW)).toBe('Repeat');
  });

  it('tags a single recent order as Active', () => {
    const stats = { orderCount: 1, totalSpent: 1000, daysSinceLastOrder: 5 };
    expect(deriveCustomerSegment(stats, '2026-01-01', NOW)).toBe('Active');
  });
});

describe('buildCustomerDirectory', () => {
  it('joins users and orders, excludes admins', () => {
    const users = [
      { id: 'u1', name: 'Alice', createdAt: '2026-01-01', isAdmin: false },
      { id: 'u2', name: 'Bob (Admin)', createdAt: '2026-01-01', isAdmin: true },
    ];
    const orders = [
      { userId: 'u1', paymentMethod: 'cod', status: 'processing', finalTotal: 1000, createdAt: '2026-07-01' },
    ];
    const directory = buildCustomerDirectory(users, orders, NOW);
    expect(directory).toHaveLength(1);
    expect(directory[0].id).toBe('u1');
    expect(directory[0].orderCount).toBe(1);
    expect(directory[0].totalSpent).toBe(1000);
  });
});

describe('customersToCsv', () => {
  it('builds a header row plus one row per customer', () => {
    const csv = customersToCsv([
      { name: 'Alice', email: 'a@x.com', phone: '999', segment: 'VIP', orderCount: 3, totalSpent: 12000, lastOrderDate: new Date('2026-07-01') },
    ]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('Name,Email,Phone,Segment,Orders,Total Spent,Last Order');
    expect(lines[1]).toBe('Alice,a@x.com,999,VIP,3,12000,2026-07-01');
  });
});
