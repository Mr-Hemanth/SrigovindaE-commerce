'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { trackPurchase } from '@/lib/analytics';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(!!orderId);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      try {
        const snap = await getDoc(doc(db, 'orders', orderId));
        if (snap.exists()) {
          const data = snap.data();
          setOrder(data);

          // Dedupe: refreshing this page shouldn't double-count a purchase in analytics.
          const trackedKey = `purchase_tracked_${orderId}`;
          if (!sessionStorage.getItem(trackedKey)) {
            trackPurchase({ orderId, finalTotal: data.finalTotal, items: data.items });
            sessionStorage.setItem(trackedKey, '1');
          }
        }
      } catch (err) {
        console.error('Failed to load order confirmation details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const finalTotal = order?.finalTotal ?? Number(searchParams.get('finalTotal')) ?? 0;
  const paymentMethod = order?.paymentMethod ?? searchParams.get('paymentMethod');
  const paymentStatus = order?.paymentStatus ?? searchParams.get('paymentStatus');
  const shippingAddress = order?.shippingAddress;
  const phone = order?.phone;
  const items = order?.items;

  // Estimated delivery window is anchored to when the order was placed, not to
  // whenever this page happens to render (Date.now() during render is impure
  // and would drift on a later revisit of this URL).
  const deliveryWindow = useMemo(() => {
    const base = order?.createdAt?.toDate ? order.createdAt.toDate() : new Date();
    const format = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return {
      from: format(new Date(base.getTime() + 5 * 24 * 60 * 60 * 1000)),
      to: format(new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000)),
    };
  }, [order]);

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'phonepe': return 'PhonePe UPI';
      case 'upi': return 'UPI Payment';
      case 'card': return 'Credit/Debit Card';
      case 'cod': return 'Cash on Delivery';
      default: return method || 'Online Payment';
    }
  };

  const generateWhatsAppLink = () => {
    const formattedId = orderId ? orderId.slice(-6).toUpperCase() : 'N/A';
    const itemsList = items ? items.map(i => `- ${i.name} (x${i.quantity})`).join('%0A') : '';
    const text = `Hi Srigovinda Collections, I just placed an order!%0A%0A*Order Reference:* %23${formattedId}%0A*Total Amount:* ₹${finalTotal?.toFixed ? finalTotal.toFixed(0) : finalTotal}%0A*Payment Method:* ${getPaymentMethodLabel(paymentMethod)}%0A*Items Purchased:*%0A${itemsList}%0A%0APlease verify my order details. Thank you!`;
    return `https://wa.me/919533866777?text=${text}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 select-none">
        <div className="animate-spin text-3xl">⚙️</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-4 bg-gradient-to-br from-brand-cream-100 to-brand-cream-200 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl elegant-shadow overflow-hidden border border-gray-100">

        {/* Success Header banner */}
        <div className="bg-brand-navy-900 text-white p-8 text-center relative">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white/10 mb-4 animate-pulse">
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold font-serif mb-2">Order Confirmed! 🎉</h1>
          <p className="text-white/80 text-sm">Thank you for shopping with Srigovinda collections. Your order has been registered.</p>
        </div>

        <div className="p-8 space-y-8">
          {orderId ? (
            <>
              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-100">
                <div>
                  <span className="text-xs uppercase text-gray-400 font-bold block mb-1">Order Reference</span>
                  <span className="font-mono text-gray-800 font-bold text-sm">{orderId}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase text-gray-400 font-bold block mb-1">Date</span>
                  <span className="text-gray-800 font-semibold text-sm">{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {/* Items Breakdown */}
              {items && (
                <div>
                  <h3 className="text-base font-bold text-gray-800 mb-4 font-serif">Items Purchased</h3>
                  <div className="bg-gray-50 rounded-2xl p-4 divide-y divide-gray-200/60 max-h-56 overflow-y-auto">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0 text-sm">
                        <div className="flex items-center gap-4">
                          {item.image && (
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={48}
                              height={48}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3";
                              }}
                              className="w-12 h-12 object-cover rounded-xl border border-gray-200/50 shadow-sm"
                            />
                          )}
                          <div className="text-left">
                            <span className="font-semibold text-gray-800 block leading-tight">{item.name}</span>
                            <span className="text-xs text-gray-500 mt-1 block">Qty: {item.quantity} • ₹{item.price}</span>
                          </div>
                        </div>
                        <span className="font-bold text-gray-800">₹{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total details */}
              <div className="bg-brand-cream-100/40 border border-brand-navy-900/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span className="text-gray-500 font-medium">Payment Mode</span>
                  <span className="font-semibold text-gray-800">{getPaymentMethodLabel(paymentMethod)}</span>
                </div>
                <div className="flex justify-between items-center mb-4 text-sm col-span-2">
                  <span className="text-gray-500 font-medium">Payment Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                    paymentStatus === 'COD' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {paymentStatus || 'Pending'}
                  </span>
                </div>
                <div className="border-t border-brand-navy-900/10 pt-4 flex justify-between items-center">
                  <span className="text-base font-bold text-gray-800">Total Price</span>
                  <span className="text-2xl font-extrabold text-brand-navy-900">₹{Number(finalTotal).toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery Details */}
              {(shippingAddress || phone) && (
                <div className="border-t border-gray-100 pt-6 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-800 mb-2 font-serif text-left">Shipping Details</h3>
                    <div className="text-sm text-gray-600 space-y-1 text-left">
                      <p className="font-medium text-gray-800">{shippingAddress}</p>
                      <p>Contact Phone: <span className="font-semibold">{phone}</span></p>
                    </div>
                  </div>

                  <div className="bg-yellow-50/50 border border-yellow-100/70 rounded-2xl p-4 text-left">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">📦 Estimated Delivery</h4>
                    <p className="text-xs text-gray-600 mt-1">Expected delivery window: <span className="font-bold text-brand-navy-900">{deliveryWindow.from} - {deliveryWindow.to}</span></p>
                    <Link href={`/track/${orderId}`} className="text-xs font-extrabold text-brand-navy-900 hover:underline mt-2 inline-block">
                      Track Shipment Status →
                    </Link>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600 text-lg mb-4">
                Thank you for your purchase. Your order has been placed and is being processed.
                We&apos;ll notify you as soon as it&apos;s on its way!
              </p>
            </div>
          )}

          {/* Action Links */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            {/* Share / Invite Friends */}
            <div className="py-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center gap-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Share your purchase with friends! 📸</span>
              <div className="flex gap-4">
                <a
                  href={`https://wa.me/?text=I%20just%20ordered%20exquisite%20jewellery%20pieces%20from%20Sri%20Govinda%20Collections!%20Check%20out%20their%20catalog%20here:%20https://srigovinda-collections.vercel.app`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#25D366] text-white p-2 rounded-full hover:scale-105 transition-transform text-xs font-bold px-4 flex items-center gap-1.5"
                >
                  WhatsApp Share
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=I%20just%20ordered%20exquisite%20jewellery%20pieces%20from%20Sri%20Govinda%20Collections!%20Check%20out%20their%20catalog%20here:%20https://srigovinda-collections.vercel.app`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#1DA1F2] text-white p-2 rounded-full hover:scale-105 transition-transform text-xs font-bold px-4 flex items-center gap-1.5"
                >
                  Tweet Share
                </a>
              </div>
            </div>
            {orderId && (
              <a
                href={generateWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-[#25D366] hover:bg-[#20ba56] text-white py-4 px-6 rounded-xl transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.012 2C6.5 2 2.006 6.5 2.006 12c0 1.755.459 3.468 1.33 4.98L2.006 22l5.148-1.35C8.61 21.468 10.29 22 12.012 22 17.52 22 22 17.5 22 12S17.52 2 12.012 2zm6.6 13.911c-.27.765-1.35 1.395-2.07 1.485-.63.09-1.44.18-4.23-.99-3.555-1.53-5.85-5.13-6.03-5.355-.18-.225-1.44-1.935-1.44-3.69 0-1.755.9-2.61 1.215-2.97.27-.27.675-.405 1.08-.405.135 0 .27 0 .36.009.27.009.405.027.63.54.27.63.9 2.205.99 2.385.09.18.135.405.009.63-.135.225-.27.405-.405.585-.135.18-.27.36-.09.675.36.63 1.62 2.655 3.42 4.275 1.575 1.395 2.925 1.845 3.33 2.025.27.09.54.09.765-.135.27-.315 1.215-1.395 1.53-1.89.315-.45.63-.36 1.08-.18.45.18 2.835 1.35 3.33 1.575.495.225.81.36.945.54.135.225.135 1.26-.135 2.025z"/>
                </svg>
                Confirm Order via WhatsApp
              </a>
            )}
            <Link
              href="/"
              className="block w-full text-center bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white py-4 px-6 rounded-xl hover:from-brand-navy-800 hover:to-brand-navy-900 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              Continue Shopping
            </Link>
            <Link
              href="/profile"
              className="block w-full text-center border-2 border-brand-navy-900 text-brand-navy-900 py-4 px-6 rounded-xl hover:bg-brand-cream-100 transition-all duration-300 font-semibold text-lg"
            >
              View My Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccess() {
  return (
    <Suspense fallback={null}>
      <OrderSuccessContent />
    </Suspense>
  );
}
