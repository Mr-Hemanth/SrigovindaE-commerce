'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { db } from '@/lib/firebase/client';
import { doc, onSnapshot } from 'firebase/firestore';
import SearchBar from './navbar/SearchBar';
import CartDrawer from './navbar/CartDrawer';
import NotificationsDropdown from './navbar/NotificationsDropdown';
import AccountDropdown from './navbar/AccountDropdown';
import MobileDrawer from './navbar/MobileDrawer';

function Navbar() {
  const { currentUser } = useAuth();
  const { cart, setCartOpen } = useCart();
  const { wishlist } = useWishlist();
  const [isOpen, setIsOpen] = useState(false);

  // Dynamic Browser Tab Cart Indicator
  useEffect(() => {
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    if (count > 0) {
      document.title = `(${count}) Srigovinda collections`;
    } else {
      document.title = 'Srigovinda collections';
    }
  }, [cart]);

  // Promo and Countdown banner states
  const [promo, setPromo] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');

  // Listen to live database configuration changes
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'promo'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPromo(data);
      }
    }, (err) => {
      console.warn('Promo fetching offline settings:', err);
    });
    return () => unsub();
  }, []);

  // Update countdown clock difference
  useEffect(() => {
    if (!promo || !promo.enabled || !promo.endDate) return;

    const timer = setInterval(() => {
      const difference = +new Date(promo.endDate) - +new Date();
      if (difference <= 0) {
        setTimeLeft('ENDED');
        clearInterval(timer);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        const pad = (num) => String(num).padStart(2, '0');
        setTimeLeft(`${days > 0 ? `${days}d ` : ''}${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [promo]);

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      {/* Top Countdown Banner */}
      {promo && promo.enabled && timeLeft !== 'ENDED' && (
        <div className="bg-brand-gold-500 text-brand-navy-950 text-center py-2 px-4 text-xs font-bold flex flex-col sm:flex-row justify-center items-center gap-2 select-none border-b border-brand-navy-900/10 relative z-50 animate-fade-in shadow-md">
          <div className="flex items-center gap-1.5 justify-center">
            <span className="animate-pulse">✨</span>
            <span>{promo.text}</span>
          </div>
          <div className="flex items-center gap-2.5 justify-center">
            <span className="bg-brand-navy-950 text-white px-2 py-0.5 rounded font-mono text-[10px] md:text-xs">
              Ends in: {timeLeft || '00:00:00'}
            </span>
            {promo.couponCode && (
              <span className="bg-brand-navy-900/10 px-2 py-0.5 rounded text-[10px]">
                🎫 {promo.couponCode}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Floating Incomplete Profile Warning Banner */}
      {currentUser && (!currentUser.phone || !/^\d{10}$/.test(currentUser.phone)) && (
        <div className="bg-[#e74c3c] text-white text-center py-2.5 px-4 text-xs font-bold flex justify-center items-center gap-2 select-none relative z-40 animate-fade-in shadow-inner border-b border-red-700/20">
          <span>⚠️ Profile Incomplete: Please add your 10-digit contact mobile number in your <Link href="/profile" className="underline text-amber-200 hover:text-white font-extrabold ml-1">Profile Settings</Link> to unlock checkout capabilities.</span>
        </div>
      )}

      <nav className="bg-gradient-to-r from-brand-navy-950 to-brand-navy-900 shadow-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* Logo Title */}
          <Link href="/" className="flex items-center gap-3 select-none">
            <img src="/logo.jpg" alt="Srigovinda Collections" className="w-10 h-10 rounded-full border border-brand-gold-500/40 object-cover elegant-shadow" />
            <span className="text-lg md:text-2xl font-bold text-brand-cream-100 font-serif tracking-wide">
              Srigovinda collections
            </span>
          </Link>

          {/* Desktop Search Bar with Autocomplete Suggestions */}
          <SearchBar />

          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center space-x-7">
            <Link href="/" className="text-brand-cream-100 hover:text-white transition-all duration-300 font-medium text-sm">Home</Link>
            <Link href="/products" className="text-brand-cream-100 hover:text-white transition-all duration-300 font-medium text-sm">Products</Link>

            {currentUser && (
              <>
                <Link href="/wishlist" className="text-brand-cream-100 hover:text-white transition-all duration-300 relative flex items-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlist.length > 0 && (
                    <span className="absolute -top-2.5 -right-2.5 bg-brand-gold-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">{wishlist.length}</span>
                  )}
                </Link>
                <button
                  onClick={() => setCartOpen(true)}
                  className="text-brand-cream-100 hover:text-white transition-all duration-300 relative flex items-center focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                  </svg>
                  {totalCartItems > 0 && (
                    <span className="absolute -top-2.5 -right-2.5 bg-brand-gold-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">{totalCartItems}</span>
                  )}
                </button>

                <NotificationsDropdown />
              </>
            )}
            <AccountDropdown />
          </div>

          {/* Mobile Right Controls */}
          <div className="flex lg:hidden items-center space-x-5">
            {currentUser && (
              <>
                <Link href="/wishlist" className="text-brand-cream-100 relative flex items-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlist.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-brand-gold-500 text-white text-[9px] rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold">{wishlist.length}</span>
                  )}
                </Link>
                <button
                  onClick={() => setCartOpen(true)}
                  className="text-brand-cream-100 relative flex items-center focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                  </svg>
                  {totalCartItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-brand-gold-500 text-white text-[9px] rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold">{totalCartItems}</span>
                  )}
                </button>

                <NotificationsDropdown mobile />
              </>
            )}
            {/* Toggle Button */}
            <button
              onClick={() => setIsOpen(true)}
              className="text-brand-cream-100 hover:text-white focus:outline-none"
              aria-label="Open navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <MobileDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </nav>
    <CartDrawer />
  </>
);
}

export default Navbar;
