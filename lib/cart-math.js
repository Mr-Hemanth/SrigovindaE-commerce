/**
 * Pure cart total calculations, extracted from CartContext.js so the math
 * can be unit tested without needing React/Firebase context.
 */

/**
 * Determine the price that should be used for a single cart item.
 * Prefers `discountedPrice` when it is present and a positive number,
 * otherwise falls back to `price`.
 */
export function getItemActivePrice(item) {
  const hasValidDiscountedPrice =
    item.discountedPrice !== undefined &&
    item.discountedPrice !== null &&
    item.discountedPrice !== '' &&
    Number(item.discountedPrice) > 0;

  return hasValidDiscountedPrice ? Number(item.discountedPrice) : Number(item.price);
}

/**
 * Compute subtotal, discountAmount, and total for a cart.
 *
 * @param {Array<{price: number, discountedPrice?: number|string, quantity: number}>} cart
 * @param {number} discountPercent - coupon discount percentage (0-100)
 * @returns {{ subtotal: number, discountAmount: number, total: number }}
 */
export function computeCartTotals(cart, discountPercent = 0) {
  const subtotal = (cart || []).reduce((total, item) => {
    return total + getItemActivePrice(item) * item.quantity;
  }, 0);

  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal - discountAmount;

  return { subtotal, discountAmount, total };
}

// Orders at/above this subtotal ride free on standard shipping — the cart page's "free delivery
// progress" bar advertises this same threshold, so both must stay in sync with these constants.
export const FREE_SHIPPING_THRESHOLD = 1000;
export const STANDARD_SHIPPING_FEE = 49;
export const EXPRESS_SHIPPING_FEE = 150;

/**
 * @param {number} subtotal
 * @param {'standard'|'express'} method
 * @returns {number}
 */
export function calculateShippingCost(subtotal, method) {
  if (method === 'express') return EXPRESS_SHIPPING_FEE;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
}
