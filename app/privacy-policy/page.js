import PrivacyPolicy from './PrivacyPolicyClient';

export const metadata = {
  title: 'Privacy Policy',
  description: 'How Sri Govinda Collections collects, uses, and protects your personal information.',
  alternates: { canonical: '/privacy-policy' },
};

export default function Page() {
  return <PrivacyPolicy />;
}
