import { computeCartTotals, getItemActivePrice } from '@/lib/cart-math';

describe('getItemActivePrice', () => {
  it('uses price when discountedPrice is not present', () => {
    expect(getItemActivePrice({ price: 100 })).toBe(100);
  });

  it('uses discountedPrice when it is a valid positive number', () => {
    expect(getItemActivePrice({ price: 100, discountedPrice: 80 })).toBe(80);
  });

  it('falls back to price when discountedPrice is 0', () => {
    expect(getItemActivePrice({ price: 100, discountedPrice: 0 })).toBe(100);
  });

  it('falls back to price when discountedPrice is an empty string', () => {
    expect(getItemActivePrice({ price: 100, discountedPrice: '' })).toBe(100);
  });

  it('falls back to price when discountedPrice is null', () => {
    expect(getItemActivePrice({ price: 100, discountedPrice: null })).toBe(100);
  });

  it('falls back to price when discountedPrice is negative', () => {
    expect(getItemActivePrice({ price: 100, discountedPrice: -10 })).toBe(100);
  });

  it('coerces a valid numeric string discountedPrice', () => {
    expect(getItemActivePrice({ price: 100, discountedPrice: '75' })).toBe(75);
  });
});

describe('computeCartTotals', () => {
  it('returns zeros for an empty cart', () => {
    expect(computeCartTotals([], 0)).toEqual({ subtotal: 0, discountAmount: 0, total: 0 });
  });

  it('handles a single item at regular price', () => {
    const cart = [{ price: 200, quantity: 2 }];
    expect(computeCartTotals(cart, 0)).toEqual({ subtotal: 400, discountAmount: 0, total: 400 });
  });

  it('uses discountedPrice when valid and > 0', () => {
    const cart = [{ price: 200, discountedPrice: 150, quantity: 2 }];
    expect(computeCartTotals(cart, 0)).toEqual({ subtotal: 300, discountAmount: 0, total: 300 });
  });

  it('falls back to price when discountedPrice is 0', () => {
    const cart = [{ price: 200, discountedPrice: 0, quantity: 1 }];
    expect(computeCartTotals(cart, 0)).toEqual({ subtotal: 200, discountAmount: 0, total: 200 });
  });

  it('falls back to price when discountedPrice is an empty string', () => {
    const cart = [{ price: 200, discountedPrice: '', quantity: 1 }];
    expect(computeCartTotals(cart, 0)).toEqual({ subtotal: 200, discountAmount: 0, total: 200 });
  });

  it('sums multiple items with mixed pricing', () => {
    const cart = [
      { price: 100, quantity: 1 },
      { price: 200, discountedPrice: 150, quantity: 2 },
      { price: 50, discountedPrice: 0, quantity: 3 },
    ];
    // 100*1 + 150*2 + 50*3 = 100 + 300 + 150 = 550
    expect(computeCartTotals(cart, 0)).toEqual({ subtotal: 550, discountAmount: 0, total: 550 });
  });

  it('applies a coupon discount percentage to the subtotal', () => {
    const cart = [{ price: 200, quantity: 1 }];
    expect(computeCartTotals(cart, 10)).toEqual({ subtotal: 200, discountAmount: 20, total: 180 });
  });

  it('applies a coupon discount percentage on top of item-level discountedPrice', () => {
    const cart = [{ price: 200, discountedPrice: 150, quantity: 2 }]; // subtotal 300
    expect(computeCartTotals(cart, 25)).toEqual({ subtotal: 300, discountAmount: 75, total: 225 });
  });

  it('defaults discountPercent to 0 when omitted', () => {
    const cart = [{ price: 100, quantity: 1 }];
    expect(computeCartTotals(cart)).toEqual({ subtotal: 100, discountAmount: 0, total: 100 });
  });
});
