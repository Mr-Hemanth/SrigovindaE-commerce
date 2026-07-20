import { recordProductView, getRecentlyViewedIds, MAX_RECENTLY_VIEWED } from './recently-viewed';

beforeEach(() => {
  window.localStorage.clear();
});

describe('recordProductView / getRecentlyViewedIds', () => {
  it('records a view and returns it', () => {
    recordProductView('p1');
    expect(getRecentlyViewedIds()).toEqual(['p1']);
  });

  it('puts the most recently viewed product first', () => {
    recordProductView('p1');
    recordProductView('p2');
    expect(getRecentlyViewedIds()).toEqual(['p2', 'p1']);
  });

  it('dedupes and moves a re-viewed product back to the front', () => {
    recordProductView('p1');
    recordProductView('p2');
    recordProductView('p1');
    expect(getRecentlyViewedIds()).toEqual(['p1', 'p2']);
  });

  it('excludes the given product id', () => {
    recordProductView('p1');
    recordProductView('p2');
    expect(getRecentlyViewedIds('p2')).toEqual(['p1']);
  });

  it('caps the list at MAX_RECENTLY_VIEWED entries', () => {
    for (let i = 0; i < MAX_RECENTLY_VIEWED + 5; i++) {
      recordProductView(`p${i}`);
    }
    expect(getRecentlyViewedIds().length).toBe(MAX_RECENTLY_VIEWED);
    // Most recent (last recorded) should still be first.
    expect(getRecentlyViewedIds()[0]).toBe(`p${MAX_RECENTLY_VIEWED + 4}`);
  });

  it('ignores calls with no productId', () => {
    recordProductView(undefined);
    expect(getRecentlyViewedIds()).toEqual([]);
  });
});
