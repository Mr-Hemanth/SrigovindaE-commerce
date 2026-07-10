import Home from './HomeClient';
import { adminDb } from '@/lib/firebase/admin';

export const metadata = {
  title: 'Fine Jewellery for Every Occasion',
  description: 'Shop exquisite gold, silver, and panchaloha jewellery at Sri Govinda Collections — handcrafted pieces for weddings, festivals, and gifting.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Sri Govinda Collections | Fine Jewellery',
    description: 'Shop exquisite gold, silver, and panchaloha jewellery at Sri Govinda Collections.',
    url: '/',
    images: ['/logo.jpg'],
  },
};

// Same rationale as /products: server-rendered initial data lets the browser start requesting
// product images immediately instead of waiting on a client-side Firestore round trip first.
export const revalidate = 60;

async function getFeaturedProducts() {
  try {
    const snap = await adminDb().collection('products').get();
    return snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((p) => p.isActive !== false)
      .slice(0, 4)
      .map((p) => ({
        ...p,
        createdAt: p.createdAt?.toDate ? p.createdAt.toDate().toISOString() : (p.createdAt ?? null),
      }));
  } catch {
    return [];
  }
}

export default async function Page() {
  const initialFeaturedProducts = await getFeaturedProducts();
  return <Home initialFeaturedProducts={initialFeaturedProducts} />;
}
