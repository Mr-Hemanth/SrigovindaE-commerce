// Auto-derives admin form defaults so an admin doesn't have to manually classify every new
// product — these are suggestions the admin can still override before saving.

// Gifting tier is a pure function of the effective (discounted, if set) price. Thresholds are
// picked from the live catalog's actual price spread (₹899–₹15999).
export function deriveGiftingTier(price, discountedPrice) {
  const effective = Number(discountedPrice) || Number(price);
  if (!effective || effective <= 0) return '';
  if (effective <= 2000) return 'Budget';
  if (effective <= 8000) return 'Premium';
  return 'Luxury';
}

// A product's category strongly implies its dominant material for this catalog; used only to
// pre-fill the Material field when it's still empty, never to overwrite an explicit choice.
const CATEGORY_MATERIAL_DEFAULTS = {
  'german-silver': 'German Silver',
  'one-gram-gold': 'Gold Plated',
  panchaloha: 'Panchaloha',
};

export function deriveMaterialFromCategory(categoryId) {
  return CATEGORY_MATERIAL_DEFAULTS[categoryId] || '';
}
