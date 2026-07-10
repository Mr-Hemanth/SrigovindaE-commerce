'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

// Fetches the whole reviews collection once and aggregates it into a productId -> {avg, count}
// map, so a grid of N ProductCards can look up their rating locally instead of each card
// running its own `where('productId', '==', ...)` query (an N+1 query pattern that was firing
// one Firestore read per card on every products/home/product-detail page load).
export function useProductRatings() {
  const [ratingsById, setRatingsById] = useState({});

  useEffect(() => {
    let active = true;
    const fetchRatings = async () => {
      try {
        const snap = await getDocs(collection(db, 'reviews'));
        if (!active) return;
        const totals = {};
        snap.docs.forEach((d) => {
          const { productId, rating } = d.data();
          if (!productId || typeof rating !== 'number') return;
          if (!totals[productId]) totals[productId] = { sum: 0, count: 0 };
          totals[productId].sum += rating;
          totals[productId].count += 1;
        });
        const map = {};
        Object.entries(totals).forEach(([productId, { sum, count }]) => {
          map[productId] = { avg: (sum / count).toFixed(1), count };
        });
        setRatingsById(map);
      } catch (err) {
        console.warn('Ratings query failed:', err);
      }
    };
    fetchRatings();
    return () => { active = false; };
  }, []);

  return ratingsById;
}
