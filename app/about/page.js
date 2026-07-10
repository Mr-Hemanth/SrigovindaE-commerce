import About from './AboutClient';

export const metadata = {
  title: 'About Us',
  description: 'Learn about Sri Govinda Collections — our craftsmanship, quality standards, and story behind our fine jewellery.',
  alternates: { canonical: '/about' },
};

export default function Page() {
  return <About />;
}
