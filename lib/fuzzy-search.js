// Typo-tolerant product search — no new dependency, just Levenshtein distance over tokenized
// text. Exact substring matches (the previous behavior) always rank first; a fuzzy fallback only
// kicks in for queries that found nothing via substring match, so normal searches are unaffected.

export function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prevRow = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const currRow = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow.push(Math.min(
        prevRow[j] + 1,      // deletion
        currRow[j - 1] + 1,  // insertion
        prevRow[j - 1] + cost // substitution
      ));
    }
    prevRow = currRow;
  }
  return prevRow[b.length];
}

// Shorter words need a tighter tolerance or "gel" would fuzzy-match half the dictionary.
export function fuzzyMatchThreshold(wordLength) {
  if (wordLength <= 4) return 1;
  if (wordLength <= 8) return 2;
  return 3;
}

function tokenize(text) {
  return (text || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function wordsFuzzyMatch(queryWord, targetWords) {
  const threshold = fuzzyMatchThreshold(queryWord.length);
  return targetWords.some((word) => {
    // Containment is only a meaningful signal once both words are long enough that the overlap
    // isn't coincidental — otherwise a common short word like "a" or "for" (which shows up in
    // nearly every description) would trivially be "contained in" almost any longer query.
    if (word.length >= 4 && queryWord.length >= 4 && (word.includes(queryWord) || queryWord.includes(word))) {
      return true;
    }
    // Skip the O(n*m) distance check for word-length pairs that can't possibly be within
    // threshold — keeps this cheap even on a full product catalog.
    if (Math.abs(word.length - queryWord.length) > threshold) return false;
    return levenshteinDistance(queryWord, word) <= threshold;
  });
}

// Returns products matching `query` against name/description/category, substring matches first
// (in their original relative order), then fuzzy-only matches appended after.
export function searchProducts(products, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return products;

  const substringMatches = [];
  const fuzzyOnlyMatches = [];
  const queryWords = tokenize(q);

  for (const product of products) {
    const haystack = `${product.name || ''} ${product.description || ''} ${product.category || ''} ${product.subcategory || ''}`.toLowerCase();
    if (haystack.includes(q)) {
      substringMatches.push(product);
      continue;
    }
    const targetWords = tokenize(haystack);
    const allWordsFuzzyMatch = queryWords.length > 0 && queryWords.every((qw) => wordsFuzzyMatch(qw, targetWords));
    if (allWordsFuzzyMatch) {
      fuzzyOnlyMatches.push(product);
    }
  }

  return [...substringMatches, ...fuzzyOnlyMatches];
}
