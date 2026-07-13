import ProductDetails from './ProductDetailsClient';
import { adminDb } from '@/lib/firebase/admin';
import { safeJsonLd } from '@/lib/json-ld';

export const revalidate = 60;

async function getProduct(id) {
  try {
    const snap = await adminDb().collection('products').doc(id).get();
    if (snap.exists) {
      const data = snap.data();
      return {
        id: snap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt ?? null),
      };
    }
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

async function getReviewStats(id) {
  try {
    const snap = await adminDb().collection('reviews').where('productId', '==', id).get();
    if (snap.empty) return null;
    const ratings = snap.docs.map((d) => d.data().rating).filter((r) => typeof r === 'number');
    if (ratings.length === 0) return null;
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    return { avg, count: ratings.length };
  } catch {
    return null;
  }
}

export default async function Page({ params }) {
  const { id } = await params;
  const [product, reviewStats] = await Promise.all([getProduct(id), getReviewStats(id)]);

  const jsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image ? [product.image] : undefined,
    sku: id,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: String(product.discountedPrice || product.price),
      availability: (product.stock !== undefined && product.stock !== null ? Number(product.stock) : 10) > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
    ...(reviewStats ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: reviewStats.avg.toFixed(1),
        reviewCount: reviewStats.count,
      },
    } : {}),
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      )}
      <ProductDetails params={params} initialProduct={product} />
    </>
  );
}
