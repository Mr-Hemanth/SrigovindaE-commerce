import Products from './ProductsClient';

export const metadata = {
  title: 'Shop All Jewellery',
  description: 'Browse our full catalog of gold, silver, and panchaloha jewellery — rings, necklaces, bangles, and more at Sri Govinda Collections.',
  alternates: { canonical: '/products' },
};

export default function Page() {
  return <Products />;
}
