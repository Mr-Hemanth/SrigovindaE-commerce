import React from 'react';

function ShippingPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white rounded-3xl elegant-shadow p-8 md:p-12 border border-gray-100 space-y-8">
        <div className="border-b border-gray-100 pb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-[#8b5a2b] font-serif">Shipping & Delivery Policy</h1>
          <p className="text-xs text-gray-400 mt-2">Last Updated: June 30, 2026</p>
        </div>

        <div className="text-sm text-gray-600 leading-relaxed space-y-6">
          <p>
            At <strong>Srigovinda collections</strong>, we package and ship our handcrafted jewellery collections with care to ensure they reach you safely. Below are the details of our shipping terms and delivery schedules:
          </p>

          <h2 className="text-lg font-bold text-gray-800 font-serif pt-4">1. Shipping Coverage & Zones</h2>
          <p>
            We offer shipping services **across India**, covering major cities, towns, and rural pin codes. All orders are carefully packed in secure, tamper-proof bubble boxes to prevent damage during transit.
          </p>

          <h2 className="text-lg font-bold text-gray-800 font-serif pt-4">2. Shipping Charges</h2>
          <p>
            We offer **Free Standard Shipping** on all orders placed across India! There are no hidden packaging or handling charges applied during checkout.
          </p>

          <h2 className="text-lg font-bold text-gray-800 font-serif pt-4">3. Delivery Timelines</h2>
          <p>
            Our estimated delivery times are:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Processing Time</strong>: Orders are dispatched within **1 to 2 business days** of order confirmation.</li>
            <li><strong>Transit Time</strong>: Once dispatched, orders are delivered within **3 to 7 business days** depending on your region:
              <ul className="list-disc pl-6 mt-1 text-xs">
                <li>Major Metro Cities: 3 - 4 business days</li>
                <li>Other Towns & Districts: 5 - 7 business days</li>
              </ul>
            </li>
          </ul>

          <h2 className="text-lg font-bold text-gray-800 font-serif pt-4">4. Order Tracking</h2>
          <p>
            Once your package is handpicked and dispatched, we will send an SMS or Email notification containing your shipment tracking link and tracking number (AWD code) from our courier partners (e.g. BlueDart, Delhivery, or Speed Post).
          </p>

          <h2 className="text-lg font-bold text-gray-800 font-serif pt-4">5. Delivery Attempts & Unclaimed Packages</h2>
          <p>
            Our courier partners will make up to **3 delivery attempts** to hand over your package. Please ensure your primary contact phone number entered during checkout/profile settings is correct and reachable. If the package remains unclaimed, it will be returned to our facility, and we will contact you to coordinate a re-shipment.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ShippingPolicy;
