import Home from './HomeClient';

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

export default function Page() {
  return <Home />;
}
