import React from 'react';

function RefundPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white rounded-3xl elegant-shadow p-8 md:p-12 border border-gray-100 space-y-8">
        <div className="border-b border-gray-100 pb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0f2a4a] font-serif">Cancellation & Refund Policy</h1>
          <p className="text-xs text-gray-400 mt-2">Last Updated: June 30, 2026</p>
        </div>

        <div className="text-sm text-gray-600 leading-relaxed space-y-6">
          <p>
            At <strong>Srigovinda collections</strong>, we want to ensure you are completely satisfied with your handcrafted jewellery. Below are our terms for product cancellations, returns, and payment refunds:
          </p>

          <h2 className="text-lg font-bold text-gray-800 font-serif pt-4">1. Order Cancellations</h2>
          <p>
            You can request to cancel your order at any time **before it is shipped**. To request a cancellation, go to your Orders list or contact support immediately with your Order ID. Once the order has been dispatched from our shipping facility, it cannot be cancelled, and must instead be handled under our returns policy.
          </p>

          <h2 className="text-lg font-bold text-gray-800 font-serif pt-4">2. 7-Day Returns Policy</h2>
          <p>
            We offer a **7-day return and replacement policy** for manufacturing damages, incorrect shipments, or quality issues:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>You must submit a return request within **7 days** of receiving your package.</li>
            <li>The jewellery pieces must be unused, in their original packaging, with all tags and protective wraps intact.</li>
            <li>For damage complaints, we highly recommend recording a quick **package unboxing video** to assist our quality check team.</li>
          </ul>

          <h2 className="text-lg font-bold text-gray-800 font-serif pt-4">3. Refund Process & Timelines</h2>
          <p>
            Once your returned package is received at our facility and passes quality validation, we will process your refund:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Online Payments (UPI/Card)</strong>: Refunds are credited back to the source account (bank account, card, or wallet used during payment).</li>
            <li><strong>Cash on Delivery (COD)</strong>: Refunds will be dispatched to your selected UPI ID or bank account details as coordinated with our support representatives.</li>
            <li><strong>Timeline</strong>: The refund will be credited to your account within **5 to 7 business days** of return approval.</li>
          </ul>

          <h2 className="text-lg font-bold text-gray-800 font-serif pt-4">4. Shipping Charges for Returns</h2>
          <p>
            If you received a damaged or incorrect item, return shipping is **free of charge**. For returns based on general choice updates, return courier costs may be deducted or coordinated with the customer.
          </p>
        </div>
      </div>
    </div>
  );
}

export default RefundPolicy;
