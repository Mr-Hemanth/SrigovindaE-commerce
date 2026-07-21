import { levenshteinDistance, fuzzyMatchThreshold, searchProducts } from './fuzzy-search';

describe('levenshteinDistance', () => {
  it('is 0 for identical strings', () => {
    expect(levenshteinDistance('ring', 'ring')).toBe(0);
  });

  it('counts a single substitution', () => {
    expect(levenshteinDistance('ring', 'rung')).toBe(1);
  });

  it('counts insertions/deletions', () => {
    expect(levenshteinDistance('necklace', 'necklacee')).toBe(1);
    expect(levenshteinDistance('necklace', 'neklace')).toBe(1);
  });

  it('handles empty strings', () => {
    expect(levenshteinDistance('', 'abc')).toBe(3);
    expect(levenshteinDistance('abc', '')).toBe(3);
  });
});

describe('fuzzyMatchThreshold', () => {
  it('is tighter for short words', () => {
    expect(fuzzyMatchThreshold(3)).toBe(1);
    expect(fuzzyMatchThreshold(6)).toBe(2);
    expect(fuzzyMatchThreshold(10)).toBe(3);
  });
});

describe('searchProducts', () => {
  const products = [
    { id: '1', name: 'Gold Choker Necklace', description: 'A classic choker', category: 'necklace' },
    { id: '2', name: 'Diamond Ring', description: 'Elegant ring for engagements', category: 'ring' },
    { id: '3', name: 'Pearl Earrings', description: 'Timeless pearl drop earrings', category: 'earrings' },
    { id: '4', name: 'German Silver Bowl', description: 'Decorative gifting bowl', category: 'gifts' },
  ];

  it('returns all products for an empty query', () => {
    expect(searchProducts(products, '')).toEqual(products);
    expect(searchProducts(products, '   ')).toEqual(products);
  });

  it('finds exact substring matches', () => {
    // "ring" is also a literal substring of "Earrings" — both are legitimately correct matches.
    const results = searchProducts(products, 'ring');
    expect(results.map((p) => p.id).sort()).toEqual(['2', '3']);
  });

  it('falls back to fuzzy matching for a misspelled query', () => {
    const results = searchProducts(products, 'neklace'); // missing a "c"
    expect(results.map((p) => p.id)).toContain('1');
  });

  it('fuzzy-matches a doubled letter typo', () => {
    const results = searchProducts(products, 'earings'); // missing an "r"
    expect(results.map((p) => p.id)).toContain('3');
  });

  it('ranks exact substring matches before fuzzy-only matches', () => {
    const withOverlap = [
      { id: 'exact', name: 'Choker Necklace', description: '', category: '' },
      { id: 'fuzzy', name: 'Chocker Style Bracelet', description: '', category: '' }, // typo'd "choker"
    ];
    const results = searchProducts(withOverlap, 'choker');
    expect(results[0].id).toBe('exact');
  });

  it('returns nothing for an unrelated query', () => {
    expect(searchProducts(products, 'xyzxyzxyz')).toEqual([]);
  });
});
