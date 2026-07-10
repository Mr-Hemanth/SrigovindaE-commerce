import Products from './ProductsClient';
import { adminDb } from '@/lib/firebase/admin';

export const metadata = {
  title: 'Shop All Jewellery',
  description: 'Browse our full catalog of gold, silver, and panchaloha jewellery — rings, necklaces, bangles, and more at Sri Govinda Collections.',
  alternates: { canonical: '/products' },
};

// Revalidated frequently rather than fetched on every request purely client-side — lets the
// browser start requesting product images immediately on page load instead of waiting for the
// client bundle to hydrate and then round-trip to Firestore before any image src is even known.
export const revalidate = 60;

async function getInitialProducts() {
  try {
    const snap = await adminDb().collection('products').get();
    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Firestore Admin Timestamps aren't plain-serializable across the server->client
        // boundary; the client already knows how to parse an ISO string (getCreatedAtMs).
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt ?? null),
      };
    });
  } catch {
    // Admin SDK not configured (e.g. local dev without secrets) — client-side fetch takes over.
    return [];
  }
}

export default async function Page() {
  const initialProducts = await getInitialProducts();
  return <Products initialProducts={initialProducts} />;
}
