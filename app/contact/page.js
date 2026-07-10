import Contact from './ContactClient';

export const metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Sri Govinda Collections for order support, product queries, or WhatsApp assistance.',
  alternates: { canonical: '/contact' },
};

export default function Page() {
  return <Contact />;
}
