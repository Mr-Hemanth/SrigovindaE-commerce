'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, limit, query } from 'firebase/firestore';

function Cart() {
  const { cart, addToCart, removeFromCart, updateQuantity, subtotal, discountAmount, total, applyCoupon, removeCoupon, coupon, discount } = useCart();
  const [crossSellItems, setCrossSellItems] = useState([]);
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchCoupons = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'coupons'));
        const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const now = new Date();
        const active = list.filter(c => {
          const exp = c.expiryDate.toDate ? c.expiryDate.toDate() : new Date(c.expiryDate);
          return now <= exp;
        });
        setAvailableCoupons(active);
      } catch (err) {
        console.warn('Could not load active coupons for cart page:', err);
      }
    };
    fetchCoupons();
  }, [currentUser]);

  useEffect(() => {
    const fetchCrossSell = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'products'), limit(12)));
        const cartIds = cart.map(item => item.id);
        const available = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(p => !cartIds.includes(p.id) && p.isActive !== false);
        setCrossSellItems(available.slice(0, 3));
      } catch (err) {
        console.warn('Could not load cross-sell products:', err);
        setCrossSellItems([]);
      }
    };
    fetchCrossSell();
  }, [cart]);

  if (!currentUser) return null;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    const result = await applyCoupon(couponCode.trim());
    if (result.success) {
      setCouponMessage({ text: result.message, type: 'success' });
      setCouponCode('');
    } else {
      setCouponMessage({ text: result.message, type: 'error' });
    }
    setTimeout(() => setCouponMessage(''), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-16">
      <h1 className="text-2xl md:text-4xl font-bold text-brand-navy-900 mb-6 md:mb-10 font-serif">Your Shopping Cart</h1>

      {cart.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl elegant-shadow border border-gray-100">
          <svg className="w-24 h-24 mx-auto text-brand-navy-900 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
          </svg>
          <p className="text-xl text-gray-600 mb-6 font-medium">Your cart is empty</p>
          <Link href="/products" className="inline-block bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white px-8 py-3.5 rounded-xl hover:from-brand-navy-800 hover:to-brand-navy-900 transition-all duration-300 font-semibold text-base shadow-md">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">

          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6 animate-fade-in">
            {cart.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-3xl elegant-shadow p-4 md:p-6 flex flex-row items-center gap-4 md:gap-6 border border-gray-50/50 hover:scale-[1.01] transition-all duration-300 relative"
              >
                {/* Image */}
                <div className="relative w-20 h-20 md:w-32 md:h-32 rounded-2xl elegant-shadow border border-gray-100 flex-shrink-0 overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 80px, 128px"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3";
                    }}
                    className="object-cover"
                  />
                </div>

                {/* Content Details */}
                <div className="flex-1 min-w-0 pr-6 md:pr-0 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6">
                  <div>
                    <h3 className="text-sm md:text-lg font-bold text-gray-800 font-serif leading-snug truncate">{item.name}</h3>
                    <div className="mt-1 flex items-baseline gap-2">
                      {item.discountedPrice !== undefined && item.discountedPrice !== null && item.discountedPrice !== '' && Number(item.discountedPrice) > 0 ? (
                        <>
                          <span className="text-brand-navy-900 font-bold text-sm md:text-base">₹{item.discountedPrice}</span>
                          <span className="text-gray-400 line-through text-[10px] md:text-xs">₹{item.price}</span>
                        </>
                      ) : (
                        <span className="text-brand-navy-900 font-bold text-sm md:text-base">₹{item.price}</span>
                      )}
                    </div>
                  </div>

                  {/* Quantity selectors */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center border-2 border-gray-200 rounded-lg hover:bg-brand-cream-100 hover:border-brand-navy-900 transition-all text-sm font-semibold"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-bold text-sm md:text-base font-mono">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center border-2 border-gray-200 rounded-lg hover:bg-brand-cream-100 hover:border-brand-navy-900 transition-all text-sm font-semibold"
                    >
                      +
                    </button>
                  </div>

                  {/* Price */}
                  <div className="text-left md:text-right min-w-[80px]">
                    <p className="text-sm md:text-lg font-black text-brand-navy-900">
                      ₹{(
                        (item.discountedPrice !== undefined && item.discountedPrice !== null && item.discountedPrice !== '' && Number(item.discountedPrice) > 0
                          ? Number(item.discountedPrice)
                          : Number(item.price)) * item.quantity
                      ).toFixed(0)}
                    </p>
                  </div>
                </div>

                {/* Absolute trash removal button */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition-colors"
                  aria-label="Remove item"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Right Summary Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl elegant-shadow p-6 md:p-8 border border-gray-50 sticky top-28 space-y-6">
              {/* Free Shipping Progress Bar */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2 select-none text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase font-sans">Free Delivery Progress</span>
                  <span className="text-[9px] font-bold text-brand-navy-900 font-mono">
                    {subtotal >= 1000
                      ? "🎉 You qualify for FREE shipping!"
                      : `Add ₹${(1000 - subtotal).toFixed(0)} more for FREE delivery`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-brand-gold-500 to-brand-navy-900 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((subtotal / 1000) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Have a coupon?</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Check Instagram for coupon codes"
                    className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-brand-navy-900"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="bg-brand-gold-500 text-white px-5 py-3 rounded-xl hover:bg-brand-gold-600 transition-all text-xs font-semibold"
                  >
                    Apply
                  </button>
                </div>
                {couponMessage && (
                  <p className={`text-xs font-bold ${couponMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {couponMessage.text}
                  </p>
                )}

                {/* Available Coupon Ticket decks */}
                {availableCoupons.length > 0 && !coupon && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Available Coupons (Click to apply)</p>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
                      {availableCoupons.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={async () => {
                            setCouponCode(c.code);
                            const result = await applyCoupon(c.code);
                            if (result.success) {
                              setCouponMessage({ text: result.message, type: 'success' });
                              setCouponCode('');
                            } else {
                              setCouponMessage({ text: result.message, type: 'error' });
                            }
                            setTimeout(() => setCouponMessage(''), 3000);
                          }}
                          className="bg-brand-cream-100 border border-brand-gold-500/30 hover:border-brand-navy-900 hover:bg-brand-cream-200 px-3 py-1.5 rounded-xl text-[10px] font-bold text-brand-navy-900 transition-all duration-300 flex items-center gap-1.5 shadow-sm"
                        >
                          🎟️ {c.code} <span className="text-[9px] bg-brand-gold-500/20 px-1 py-0.5 rounded font-black text-brand-navy-900">{c.discountPercentage}% OFF</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {coupon && (
                  <div className="flex items-center justify-between bg-green-50 px-4 py-3 rounded-xl border border-green-200 text-xs">
                    <span className="text-green-700 font-bold">🎟️ {coupon.code} - {coupon.discountPercentage}% OFF APPLIED</span>
                    <button onClick={removeCoupon} className="text-red-500 hover:text-red-700 text-lg font-black leading-none">×</button>
                  </div>
                )}
              </div>

              <div className="space-y-4 border-t pt-6 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-800">₹{subtotal.toFixed(0)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toFixed(0)}</span>
                  </div>
                )}
                <div className="border-t pt-4 flex justify-between text-lg md:text-xl font-black text-brand-navy-900">
                  <span>Total</span>
                  <span>₹{total.toFixed(0)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!currentUser) {
                    router.push('/login');
                  } else if (!currentUser.phone || !/^\d{10}$/.test(currentUser.phone)) {
                    showNotification('Please complete your profile by providing your primary 10-digit contact mobile number before proceeding to checkout.', 'error');
                    router.push('/profile');
                  } else {
                    router.push('/checkout');
                  }
                }}
                className="w-full bg-brand-navy-900 hover:bg-brand-navy-800 text-white py-4 px-6 rounded-xl transition-all duration-300 font-bold shadow-md hover:shadow-lg text-center block text-sm"
              >
                Proceed to Checkout
              </button>

              <Link href="/products" className="block text-center text-brand-navy-900 hover:text-brand-navy-800 text-xs font-bold transition-colors">
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Cart Cross-sell Section */}
          {crossSellItems.length > 0 && (
            <div className="lg:col-span-3 mt-12 border-t pt-10 select-none text-left">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 font-serif mb-6">Add these too</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {crossSellItems.map(item => (
                  <div key={item.id} className="bg-white rounded-3xl elegant-shadow p-4 border border-gray-100 flex flex-row sm:flex-col gap-4 justify-between items-center sm:items-stretch text-left">
                    <div className="flex items-center gap-3">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={56}
                        height={56}
                        className="w-14 h-14 object-cover rounded-xl border flex-shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-gray-800 font-serif line-clamp-1">{item.name}</h4>
                        <span className="text-xxs text-gray-400 capitalize">{item.category?.replace('-', ' ')}</span>
                        <p className="text-xs font-extrabold text-brand-navy-900 mt-0.5">₹{item.price}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        addToCart(item);
                        showNotification(`"${item.name}" added to cart!`, 'success');
                      }}
                      className="bg-brand-navy-900 hover:bg-brand-navy-800 text-white px-4 py-2 rounded-xl text-xxs font-bold transition-all whitespace-nowrap self-center sm:self-auto text-center"
                    >
                      + Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default Cart;
