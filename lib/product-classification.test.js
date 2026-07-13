import { deriveGiftingTier, deriveMaterialFromCategory } from './product-classification';

describe('deriveGiftingTier', () => {
  it('classifies low prices as Budget', () => {
    expect(deriveGiftingTier(999, '')).toBe('Budget');
    expect(deriveGiftingTier(2000, '')).toBe('Budget');
  });

  it('classifies mid prices as Premium', () => {
    expect(deriveGiftingTier(2001, '')).toBe('Premium');
    expect(deriveGiftingTier(8000, '')).toBe('Premium');
  });

  it('classifies high prices as Luxury', () => {
    expect(deriveGiftingTier(8001, '')).toBe('Luxury');
    expect(deriveGiftingTier(15999, '')).toBe('Luxury');
  });

  it('prefers discounted price over regular price when both are set', () => {
    expect(deriveGiftingTier(9000, 1500)).toBe('Budget');
  });

  it('returns empty string when no valid price is given', () => {
    expect(deriveGiftingTier('', '')).toBe('');
    expect(deriveGiftingTier(0, 0)).toBe('');
  });
});

describe('deriveMaterialFromCategory', () => {
  it('maps known categories to their dominant material', () => {
    expect(deriveMaterialFromCategory('german-silver')).toBe('German Silver');
    expect(deriveMaterialFromCategory('one-gram-gold')).toBe('Gold Plated');
    expect(deriveMaterialFromCategory('panchaloha')).toBe('Panchaloha');
  });

  it('returns empty string for categories with no dominant material', () => {
    expect(deriveMaterialFromCategory('gifts')).toBe('');
    expect(deriveMaterialFromCategory('')).toBe('');
  });
});
