export default function robots() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.srigovindacollections.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/cart', '/checkout', '/orders', '/profile', '/wishlist', '/login', '/signup', '/complete-profile', '/track', '/order-success', '/api/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
