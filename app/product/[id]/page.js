import ProductDetails from './ProductDetailsClient';
import { adminDb } from '@/lib/firebase/admin';

async function getProduct(id) {
  try {
    const snap = await adminDb().collection('products').doc(id).get();
    if (snap.exists) return { id: snap.id, ...snap.data() };
  } catch {
    // Admin SDK not configured yet (e.g. local dev without secrets) — fall through to generic metadata.
  }
  return null;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return { title: 'Product' };
  }

  const price = product.discountedPrice || product.price;
  return {
    title: product.name,
    description: product.description || `${product.name} — fine jewellery from Sri Govinda Collections, starting at ₹${price}.`,
    alternates: { canonical: `/product/${id}` },
    openGraph: {
      title: product.name,
      description: product.description,
      url: `/product/${id}`,
      images: product.image ? [product.image] : undefined,
      type: 'website',
    },
  };
}

export default function Page({ params }) {
  return <ProductDetails params={params} />;
}
