'use client';

// Thin wrapper around the gtag.js global that @next/third-parties/google's <GoogleAnalytics>
// component installs on `window`. No-ops safely if analytics isn't configured (no measurement
// ID set) or hasn't loaded yet (e.g. ad blockers) — event tracking should never throw or block
// the actual user action it's attached to.
export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', name, params);
  } catch {
    // Analytics failures must never break the feature they're instrumenting.
  }
}

export function trackViewItem(product) {
  trackEvent('view_item', {
    currency: 'INR',
    value: Number(product.discountedPrice || product.price || 0),
    items: [{ item_id: product.id, item_name: product.name, item_category: product.category, price: Number(product.discountedPrice || product.price || 0) }],
  });
}

export function trackAddToCart(product, quantity = 1) {
  trackEvent('add_to_cart', {
    currency: 'INR',
    value: Number(product.discountedPrice || product.price || 0) * quantity,
    items: [{ item_id: product.id, item_name: product.name, item_category: product.category, price: Number(product.discountedPrice || product.price || 0), quantity }],
  });
}

export function trackBeginCheckout(cart, value) {
  trackEvent('begin_checkout', {
    currency: 'INR',
    value,
    items: cart.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      quantity: item.quantity,
      price: Number(item.discountedPrice || item.price || 0),
    })),
  });
}

export function trackPurchase({ orderId, finalTotal, items }) {
  trackEvent('purchase', {
    transaction_id: orderId,
    currency: 'INR',
    value: Number(finalTotal || 0),
    items: (items || []).map((item) => ({
      item_id: item.id,
      item_name: item.name,
      quantity: item.quantity,
      price: Number(item.price || 0),
    })),
  });
}
