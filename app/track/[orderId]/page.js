'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

function TrackOrder() {
  const { orderId } = useParams();
  const { currentUser } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    const fetchOrder = async () => {
      try {
        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Ensure user owns this order
          if (data.userId === currentUser.uid) {
            setOrder(data);
          }
        }
      } catch (err) {
        console.error('Failed to load order for tracking:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, currentUser, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 select-none">
        <div className="text-center space-y-2">
          <div className="animate-spin text-3xl">⚙️</div>
          <p className="text-gray-500 text-sm font-semibold">Retrieving tracking records...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 select-none">
        <div className="max-w-md w-full bg-white rounded-3xl elegant-shadow p-8 text-center border border-gray-100 space-y-4">
          <span className="text-5xl block">📦</span>
          <h2 className="text-xl font-bold text-gray-800 font-serif">No Tracking Records Found</h2>
          <p className="text-xs text-gray-500 leading-relaxed">We could not locate tracking records for reference ID &quot;{orderId}&quot;. Check order number or view order history.</p>
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/profile" className="bg-brand-navy-900 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md">
              View Order History
            </Link>
            <Link href="/" className="text-xs text-gray-400 font-bold hover:underline">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Map order status to timeline index
  // pending/processing -> 0 (Placed)
  // packed -> 1 (Packed)
  // shipped -> 2 (Shipped)
  // out-for-delivery -> 3 (Out for Delivery)
  // delivered -> 4 (Delivered)
  // cancelled/returned -> negative
  const getStatusStep = (status) => {
    switch (String(status).toLowerCase()) {
      case 'pending':
      case 'processing':
        return 0;
      case 'packed':
        return 1;
      case 'shipped':
        return 2;
      case 'out-for-delivery':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = getStatusStep(order.status);
  const isCancelled = order.status === 'cancelled';
  const isReturned = order.status === 'returned';

  const steps = [
    { label: 'Order Placed', desc: 'Srigovinda received your order request.' },
    { label: 'Packed & Sealed', desc: 'Your jewellery items are quality checked & sealed.' },
    { label: 'Shipped Courier', desc: 'Handed over to Delhivery logistics hubs.' },
    { label: 'Out For Delivery', desc: 'Assigned to courier agent near your address.' },
    { label: 'Delivered', desc: 'Successfully received and verified by customer.' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 select-none text-left">
      {/* Breadcrumbs */}
      <nav className="text-[10px] text-gray-500 mb-6 flex items-center gap-1.5 select-none font-bold uppercase tracking-wider">
        <Link href="/" className="hover:text-brand-navy-900 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/profile" className="hover:text-brand-navy-900 transition-colors">Account</Link>
        <span>/</span>
        <span className="text-gray-800">Track Order</span>
      </nav>

      <div className="space-y-8">

        {/* Main Card info */}
        <div className="bg-white rounded-3xl elegant-shadow p-6 md:p-8 border border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">TRACK SHIPMENT</span>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 font-serif break-all">Order ID: {order.orderId}</h1>
            <p className="text-xs text-gray-500">Ordered on: <span className="font-semibold">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()}</span></p>
          </div>

          <div className="bg-brand-cream-100 border border-brand-navy-900/10 px-5 py-3 rounded-2xl">
            <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Status</span>
            <span className={`text-xs font-black uppercase tracking-wider ${
              isCancelled || isReturned ? 'text-red-500' : 'text-brand-navy-900'
            }`}>
              {order.status}
            </span>
          </div>
        </div>

        {/* Courier details */}
        {!isCancelled && !isReturned && (
          <div className="bg-white rounded-3xl elegant-shadow p-6 md:p-8 border border-gray-50 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Shipping Agent</span>
              <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                🚚 Delhivery Express
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Tracking ID</span>
              <span className="text-sm font-mono font-bold text-gray-800">SG-DEL-{orderId.slice(-6).toUpperCase()}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Logistic Website</span>
              <a
                href="https://www.delhivery.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-extrabold text-blue-500 hover:underline"
              >
                Track on Delhivery.com →
              </a>
            </div>
          </div>
        )}

        {/* Cancelled/Returned Warning Alert Callout */}
        {(isCancelled || isReturned) && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-6 md:p-8 text-red-800 space-y-2">
            <h3 className="text-base font-bold font-serif">Order Status Update: {isCancelled ? 'Cancelled ✕' : 'Returned ↺'}</h3>
            <p className="text-xs leading-relaxed opacity-90">
              {isCancelled
                ? 'This order has been cancelled. Refunds (if payments were settled online) are credited back to the source bank account within 3-5 business days.'
                : 'A return or replacement request has been approved for this order. Our pick-up agent will arrive within 2-3 business days to retrieve items.'}
            </p>
          </div>
        )}

        {/* Tracking Milestone Status Timeline Grid */}
        {!isCancelled && !isReturned && (
          <div className="bg-white rounded-3xl elegant-shadow p-6 md:p-8 border border-gray-50">
            <h3 className="text-lg font-bold text-gray-800 font-serif mb-8">Shipment Milestone Journey</h3>

            <div className="relative pl-8 md:pl-10 space-y-8 border-l-2 border-gray-100 ml-4 md:ml-6">
              {steps.map((step, idx) => {
                const isActive = idx <= currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <div key={idx} className="relative">
                    {/* Circle timeline dot indicator */}
                    <span className={`absolute -left-[45px] md:-left-[53px] top-1.5 w-7 h-7 rounded-full flex items-center justify-center text-xxs font-bold transition-all shadow border ${
                      isCurrent ? 'bg-brand-navy-900 border-brand-navy-900 text-white scale-110' :
                      isActive ? 'bg-brand-gold-500 border-brand-gold-500 text-white' :
                      'bg-white border-gray-200 text-gray-400'
                    }`}>
                      {isActive ? '✓' : idx + 1}
                    </span>

                    <div className="space-y-1">
                      <h4 className={`text-sm md:text-base font-bold transition-colors ${
                        isCurrent ? 'text-brand-navy-900 font-extrabold' :
                        isActive ? 'text-gray-800' :
                        'text-gray-400'
                      }`}>
                        {step.label}
                      </h4>
                      <p className="text-xxs md:text-xs text-gray-400 leading-normal">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Customer Assistance Help Desk block */}
        <div className="bg-[#fcfaf7] border border-brand-gold-500/20 rounded-3xl p-6 md:p-8 text-center space-y-4">
          <h3 className="text-base md:text-lg font-bold text-gray-800 font-serif">Need Help with Your Delivery?</h3>
          <p className="text-xs text-gray-500 max-w-xl mx-auto leading-relaxed">If you experience delay, package damage, or incorrect shipping address records, chat directly with our helpdesk agent via WhatsApp.</p>
          <div className="pt-2 flex justify-center gap-4">
            <a
              href="https://wa.me/919533866777?text=Hi%20Srigovinda%20Collections,%20I'm%20having%20an%20issue%20with%20delivery%20of%20my%20order."
              target="_blank"
              rel="noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              💬 WhatsApp Chat
            </a>
            <Link
              href="/contact"
              className="border border-brand-navy-900 text-brand-navy-900 px-6 py-3 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
            >
              Contact Support
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default TrackOrder;
