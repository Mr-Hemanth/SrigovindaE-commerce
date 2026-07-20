'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, query, where, documentId, getDocs } from 'firebase/firestore';
import ProductCard from '@/components/ProductCard';
import { getRecentlyViewedIds } from '@/lib/recently-viewed';

function RecentlyViewed({ excludeId, title = 'Recently Viewed' }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const ids = getRecentlyViewedIds(excludeId);
    if (ids.length === 0) {
      // Clears stale results if excludeId changes on an already-mounted instance (App Router can
      // reuse this component across product-to-product navigation without a full remount).
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot clear, not a cascade
      setProducts([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        const q = query(collection(db, 'products'), where(documentId(), 'in', ids));
        const snap = await getDocs(q);
        if (!active) return;
        const byId = new Map(snap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
        // Re-order to match the most-recently-viewed-first order localStorage already has —
        // Firestore's `in` query doesn't preserve input order.
        setProducts(ids.map((id) => byId.get(id)).filter(Boolean));
      } catch (err) {
        console.warn('Error loading recently viewed products:', err);
      }
    })();
    return () => { active = false; };
  }, [excludeId]);

  if (products.length === 0) return null;

  return (
    <div className="border-t border-gray-100 pt-16 mt-16">
      <h2 className="text-2xl font-bold text-brand-navy-900 mb-8 font-serif">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

export default RecentlyViewed;
