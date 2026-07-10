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
