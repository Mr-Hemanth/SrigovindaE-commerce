'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useNotification } from '@/contexts/NotificationContext';

function CartDrawer() {
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const {
    cart,
    isCartOpen,
    setCartOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    discountAmount,
    total
  } = useCart();

  const closeButtonRef = useRef(null);
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Focus trap: move focus to the close button when the drawer opens
  useEffect(() => {
    if (isCartOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isCartOpen]);

  // Close the drawer on Escape key press
  useEffect(() => {
    if (!isCartOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setCartOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={() => setCartOpen(false)}
      />

      {/* Drawer Panel Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div
          className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-gray-100/80 animate-slide-left"
          role="dialog"
          aria-modal="true"
        >
          {/* Drawer Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-brand-navy-950 to-brand-navy-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🛒</span>
              <h2 className="text-lg font-bold font-serif">Your Cart ({totalCartItems})</h2>
            </div>
            <button
              ref={closeButtonRef}
              onClick={() => setCartOpen(false)}
              className="text-white/80 hover:text-white text-2xl font-semibold leading-none focus:outline-none"
            >
              ✕
            </button>
          </div>

          {/* Drawer Body - Items list */}
          <div className="flex-grow overflow-y-auto p-6 space-y-5 bg-gray-50/50">
            {cart.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <span className="text-5xl block mb-4">🛒</span>
                <p className="font-semibold text-sm">Your shopping cart is empty</p>
                <p className="text-xs mt-1">Add beautiful jewellery items to get started!</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex gap-4 bg-white p-4 rounded-2xl border border-gray-150/50 hover:shadow-md transition-shadow duration-300">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                  />
                  <div className="flex-grow min-w-0 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-400 capitalize mt-0.5">{item.category?.replace('-', ' ')}</p>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      {/* Quantity selector */}
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white scale-90 origin-left">
                        <button
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantity(item.id, item.quantity - 1);
                            }
                          }}
                          className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 font-bold transition-colors text-gray-600 text-xs"
                        >
                          -
                        </button>
                        <span className="px-3 py-0.5 text-xs font-bold text-gray-800 min-w-[24px] text-center font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 font-bold transition-colors text-gray-600 text-xs"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs font-black text-gray-800">₹{(Number(item.discountedPrice || item.price) * item.quantity).toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-300 hover:text-red-600 transition-colors self-start p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer Summary & Checkout */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-gray-150 bg-white space-y-4 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
              <div className="space-y-1.5 text-xs text-gray-500 font-medium">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-gray-800 font-bold">₹{subtotal.toFixed(0)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Savings</span>
                    <span>-₹{discountAmount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-gray-800 pt-2 border-t border-gray-100">
                  <span>Total Amount</span>
                  <span className="text-brand-navy-900 text-base font-black">₹{total.toFixed(0)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setCartOpen(false);
                  if (!currentUser) {
                    router.push('/login');
                  } else if (!currentUser.phone || !/^\d{10}$/.test(currentUser.phone)) {
                    showNotification('Please complete your profile by providing your primary 10-digit contact mobile number before proceeding to checkout.', 'error');
                    router.push('/profile');
                  } else {
                    router.push('/checkout');
                  }
                }}
                className="w-full bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 hover:from-brand-navy-800 hover:to-brand-navy-900 text-white py-3.5 rounded-xl font-bold text-center block text-xs shadow-md transition-all duration-300 uppercase tracking-wider"
              >
                Proceed to Checkout
              </button>
              <button
                onClick={() => setCartOpen(false)}
                className="w-full text-center text-brand-navy-900 hover:text-brand-navy-800 font-bold text-xxs transition-colors py-1"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CartDrawer;
