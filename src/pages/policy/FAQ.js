import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function FAQ() {
  const [activeFaq, setActiveFaq] = useState(null);

  const faqData = [
    {
      category: 'Shipping & Delivery',
      questions: [
        {
          q: "What are your delivery schedules and charges?",
          a: "Standard shipping is FREE for all locations in India, taking 5-7 business days. Express shipping is available for ₹150, taking 2-3 business days. All items are dispatched with real-time tracking IDs."
        },
        {
          q: "Do you ship internationally?",
          a: "Currently, we only ship across all major pincodes within India. For custom international orders, please contact our help desk via WhatsApp (+91 95338 66777)."
        }
      ]
    },
    {
      category: 'Returns & Cancellations',
      questions: [
        {
          q: "What is your return and refund policy?",
          a: "We offer a 7-Day return policy for all unused items. If you receive a damaged or incorrect piece, request a refund or exchange directly from your profile's Order History page."
        },
        {
          q: "How do I cancel my order?",
          a: "Orders in 'pending' status can be cancelled instantly with a single click. For orders in 'processing' or 'shipped' stages, request a cancellation from the order history panel for admin approval."
        }
      ]
    },
    {
      category: 'Jewellery Care',
      questions: [
        {
          q: "How do I care for German Silver jewelry?",
          a: "Avoid exposure to heavy water, soaps, perfumes, or chemicals. Clean gently with a soft dry cotton cloth and store in airtight zip-lock bags to preserve the premium silver finish."
        },
        {
          q: "Will One Gram Gold jewelry tarnish?",
          a: "Our One Gram Gold pieces are coated with robust micro-plated 24kt gold layers on copper/brass. However, sweating, high moisture, and friction may gradually affect gold luster over months. Proper dry storage maximizes lifespan."
        }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 select-none text-left">
      {/* Breadcrumbs */}
      <nav className="text-[10px] text-gray-500 mb-6 flex items-center gap-1.5 font-bold uppercase tracking-wider">
        <Link to="/" className="hover:text-[#0f2a4a] transition-colors">Home</Link>
        <span>/</span>
        <span className="text-gray-800">FAQ</span>
      </nav>

      <div className="space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-[#d4af37] uppercase tracking-widest block">Customer Assistance Hub</span>
          <h1 className="text-3xl md:text-5xl font-bold text-[#0f2a4a] font-serif">Frequently Asked Questions</h1>
          <p className="text-sm text-gray-500 max-w-lg mx-auto">Get quick answers regarding shipping times, return requests, and traditional jewelry metal care guidelines.</p>
        </div>

        <div className="space-y-8">
          {faqData.map((cat, catIdx) => (
            <div key={catIdx} className="space-y-4">
              <h2 className="text-sm uppercase font-bold text-gray-400 tracking-wider pl-1">{cat.category}</h2>
              <div className="space-y-3">
                {cat.questions.map((faq, idx) => {
                  const globalIdx = `${catIdx}_${idx}`;
                  const isExpanded = activeFaq === globalIdx;
                  
                  return (
                    <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all">
                      <button
                        onClick={() => setActiveFaq(isExpanded ? null : globalIdx)}
                        className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50/50 transition-colors focus:outline-none"
                      >
                        <span className="text-xs md:text-sm font-bold text-[#0f2a4a]">{faq.q}</span>
                        <span className={`text-xs text-gray-400 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="px-6 pb-5 pt-1 text-xxs md:text-xs text-gray-500 leading-relaxed border-t border-gray-50/50 animate-fade-in text-left">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Support box */}
        <div className="bg-[#fdfaf6] border border-[#d4af37]/20 rounded-3xl p-8 text-center space-y-4">
          <h3 className="text-lg font-bold text-gray-800 font-serif">Still Have Questions?</h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">Reach out to our customer support team directly. We are active Monday to Saturday (10 AM to 7 PM).</p>
          <div className="pt-2 flex justify-center gap-4">
            <Link to="/contact" className="bg-[#0f2a4a] text-white px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-md">
              Send Support Query
            </Link>
            <a 
              href="https://wa.me/919533866777?text=Hi%20Srigovinda%20Collections,%20I%20have%20a%20question%20about%20policies."
              target="_blank"
              rel="noreferrer"
              className="bg-green-600 text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-green-700 transition-all shadow-md flex items-center gap-1.5"
            >
              💬 WhatsApp Us
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

export default FAQ;
