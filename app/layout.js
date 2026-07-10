import { Playfair_Display, Poppins } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';
import { Providers } from './providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EngagementWidgets from '@/components/EngagementWidgets';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-playfair',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Sri Govinda Collections | Fine Jewellery',
    template: '%s | Sri Govinda Collections',
  },
  description: 'Sri Govinda Collections — exquisite jewellery for every occasion.',
  openGraph: {
    title: 'Sri Govinda Collections | Fine Jewellery',
    description: 'Exquisite German Silver, One Gram Gold & Panchaloha jewellery designed with care.',
    siteName: 'Sri Govinda Collections',
    images: ['/logo.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sri Govinda Collections | Fine Jewellery',
    description: 'Exquisite German Silver, One Gram Gold & Panchaloha jewellery designed with care.',
    images: ['/logo.jpg'],
  },
};

export const viewport = {
  themeColor: '#1a1a1a',
};

export default function RootLayout({ children }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.srigovindacollections.com';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Sri Govinda Collections',
    url: siteUrl,
    logo: `${siteUrl}/logo.jpg`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-9533866777',
      contactType: 'customer service',
    },
  };

  return (
    <html lang="en" className={`${playfair.variable} ${poppins.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>
          <div className="min-h-screen bg-brand-cream-50">
            <Navbar />
            <EngagementWidgets />
            {children}
            <Footer />
          </div>
        </Providers>
        {process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
