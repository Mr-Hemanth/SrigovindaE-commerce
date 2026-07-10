import ShippingPolicy from './ShippingPolicyClient';

export const metadata = {
  title: 'Shipping Policy',
  description: 'Shipping timelines, delivery partners, and charges for Sri Govinda Collections orders.',
  alternates: { canonical: '/shipping-policy' },
};

export default function Page() {
  return <ShippingPolicy />;
}
