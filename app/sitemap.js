import { adminDb } from '@/lib/firebase/admin';

const staticRoutes = [
  '',
  '/products',
  '/about',
  '/contact',
  '/faq',
  '/privacy-policy',
  '/terms',
  '/refund-policy',
  '/shipping-policy',
];

export default async function sitemap() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.srigovindacollections.com';

  const staticEntries = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.7,
  }));

  let productEntries = [];
  try {
    const snap = await adminDb().collection('products').where('isActive', '!=', false).get();
    productEntries = snap.docs.map((doc) => ({
      url: `${siteUrl}/product/${doc.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch {
    // Admin SDK not configured yet (no FIREBASE_SERVICE_ACCOUNT_BASE64) or offline — ship the
    // static routes only rather than failing the whole sitemap.
  }

  return [...staticEntries, ...productEntries];
}
