const isDev = process.env.NODE_ENV === 'development';

const csp = [
  "default-src 'self'",
  // 'unsafe-eval' is required by Next.js/Turbopack's dev-mode Fast Refresh runtime (it never
  // runs in production builds) — without it every page crashes in `next dev`.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://checkout.razorpay.com https://www.googletagmanager.com`,
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://lumberjack.razorpay.com https://api.razorpay.com https://www.google-analytics.com https://www.google.com",
  "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://www.google.com",
  "img-src 'self' data: blob: https://*.googleusercontent.com https://firebasestorage.googleapis.com https://images.unsplash.com https://picsum.photos https://fastly.picsum.photos https://i.ibb.co https://res.cloudinary.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    // Product photos essentially never change in place (edits create a new upload path), so
    // the optimizer's cached output can be kept at the edge far longer than the 4h default.
    minimumCacheTTL: 2592000, // 30 days
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'i.ibb.co' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      {
        // Static brand assets rarely change; a day-long cache skips repeat conditional
        // GETs on every page load without risking a long-lived stale asset.
        source: '/(logo.jpg|icon.svg|manifest.json)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
