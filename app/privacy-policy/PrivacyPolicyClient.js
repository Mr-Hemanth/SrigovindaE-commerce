'use client';

function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white rounded-3xl elegant-shadow p-8 md:p-12 border border-gray-100 space-y-8">
        <div className="border-b border-gray-100 pb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-navy-900 font-serif">Privacy Policy</h1>
          <p className="text-xs text-gray-400 mt-2">Last Updated: June 30, 2026</p>
        </div>

        <div className="text-sm text-gray-600 leading-relaxed space-y-6">
          <p>
            At <strong>Srigovinda collections</strong>, accessible from our online store, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Srigovinda collections and how we use it.
          </p>

          <h2 className="text-lg font-bold text-gray-800 font-serif pt-4">1. Information We Collect</h2>
          <p>
            If you create an account on our storefront, we collect personal information necessary to manage user profiles, complete checkouts, and process deliveries:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Personal details</strong>: Name, Email Address, Contact Phone, Date of Birth, and Gender.</li>
            <li><strong>Delivery coordinates</strong>: Structured shipping addresses (State, City, Area, landmark, Pincode).</li>
            <li><strong>Invoicing logs</strong>: Purchase history, order items, coupon application details, totals, and transaction methods.</li>
          </ul>

          <h2 className="text-lg font-bold text-gray-800 font-serif pt-4">2. How We Use Your Information</h2>
          <p>
            We use the information we collect in various ways, including to:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide, operate, and maintain our e-commerce platform.</li>
            <li>Improve, personalize, and expand our store&apos;s jewellery catalog.</li>
            <li>Understand and analyze how you use our storefront.</li>
            <li>Process transactions, handle shipping deliveries, and dispatch tracking details.</li>
            <li>Send email verification codes or customer support updates.</li>
          </ul>

          <h2 className="text-lg font-bold text-gray-800 font-serif pt-4">3. Local Storage Caching & Offline Support</h2>
          <p>
            For seamless performance and database drop-out resilience, this web application utilizes browser local caching (such as localStorage). Your cart contents, wishlist choices, profile details, and address configurations are saved locally so you can browse and checkout without crashes even under poor network states.
          </p>

          <h2 className="text-lg font-bold text-gray-800 font-serif pt-4">4. Payment Processing Safety</h2>
          <p>
            All online transactions are directed through securely encrypted payment schemes (PhonePe App deep-links, UPI protocols, or card gateways). We do not record, store, or process your credit card numbers or UPI PIN configurations on our servers.
          </p>

          <h2 className="text-lg font-bold text-gray-800 font-serif pt-4">5. Contact Information</h2>
          <p>
            If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at <strong>srigovindagermansilver@gmail.com</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
