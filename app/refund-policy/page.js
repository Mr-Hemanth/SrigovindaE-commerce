import RefundPolicy from './RefundPolicyClient';

export const metadata = {
  title: 'Refund & Cancellation Policy',
  description: 'Refund, return, and cancellation policy for orders placed with Sri Govinda Collections.',
  alternates: { canonical: '/refund-policy' },
};

export default function Page() {
  return <RefundPolicy />;
}
