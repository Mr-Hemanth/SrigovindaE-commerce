import FAQ from './FAQClient';

export const metadata = {
  title: 'Frequently Asked Questions',
  description: 'Answers to common questions about orders, shipping, returns, and payments at Sri Govinda Collections.',
  alternates: { canonical: '/faq' },
};

export default function Page() {
  return <FAQ />;
}
