'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

// isOpen / onClose are lifted up to Navbar.js since the hamburger toggle
// button that opens this drawer lives there (mirrors how the cart icon
// stays in Navbar.js while CartDrawer owns the panel itself).
function MobileDrawer({ isOpen, onClose }) {
  const { currentUser, isAdmin, logout } = useAuth();
  const { cart, setCartOpen } = useCart();
  const { wishlist } = useWishlist();
  const router = useRouter();

  const closeButtonRef = useRef(null);
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Focus trap: move focus to the close button when the drawer opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Close the drawer on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <>
      {/* Backdrop overlay for mobile drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Mobile Slide-Over Navigation Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-gradient-to-b from-brand-navy-950 to-brand-navy-900 text-brand-cream-100 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col justify-between border-l border-brand-gold-500/20 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >

        {/* Drawer Header */}
        <div className="p-6 border-b border-brand-cream-100/10">
          <div className="flex justify-between items-center mb-4">
            <span className="font-serif font-bold text-lg text-brand-gold-500">Store Menu</span>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl font-semibold leading-none focus:outline-none"
            >
              ✕
            </button>
          </div>

          {/* User profile block */}
          {currentUser && (
            <div className="bg-black/10 p-3.5 rounded-xl border border-white/5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-gold-500/20 flex items-center justify-center font-bold text-brand-gold-500 border border-brand-gold-500/20">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'C'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{currentUser.name || 'Valued Customer'}</p>
                <p className="text-[10px] text-white/60 truncate">{currentUser.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Navigation Links */}
        <div className="flex-grow overflow-y-auto px-6 py-4 space-y-4">
          <Link href="/" onClick={onClose} className="block text-sm font-semibold hover:text-brand-gold-500 py-2 transition-colors border-b border-white/5">🏠 Home Page</Link>
          <Link href="/products" onClick={onClose} className="block text-sm font-semibold hover:text-brand-gold-500 py-2 transition-colors border-b border-white/5">🛍️ Shop Products</Link>

          {currentUser ? (
            <>
              <Link href="/orders" onClick={onClose} className="block text-sm font-semibold hover:text-brand-gold-500 py-2 transition-colors border-b border-white/5">📦 Order Tracking</Link>
              <Link href="/profile" onClick={onClose} className="block text-sm font-semibold hover:text-brand-gold-500 py-2 transition-colors border-b border-white/5">👤 My Account Profile</Link>
              <Link href="/wishlist" onClick={onClose} className="block text-sm font-semibold hover:text-brand-gold-500 py-2 transition-colors border-b border-white/5">❤️ Wishlist ({wishlist.length})</Link>
              <button
                onClick={() => { onClose(); setCartOpen(true); }}
                className="w-full text-left block text-sm font-semibold hover:text-brand-gold-500 py-2 transition-colors border-b border-white/5 focus:outline-none"
              >
                🛒 Shopping Cart ({totalCartItems})
              </button>
            </>
          ) : (
            <div className="space-y-3 pt-4">
              <Link
                href="/login"
                onClick={onClose}
                className="block text-center border border-brand-gold-500/50 text-brand-cream-100 py-3 rounded-xl font-bold text-xs"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="block text-center bg-gradient-to-r from-brand-gold-500 to-brand-gold-600 text-brand-navy-950 py-3 rounded-xl font-bold text-xs"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        {currentUser && (
          <div className="p-6 border-t border-brand-cream-100/10 bg-black/5 space-y-3">
            {isAdmin && (
              <Link
                href="/admin"
                onClick={onClose}
                className="block text-center bg-gradient-to-r from-brand-gold-500 to-brand-gold-600 text-brand-navy-950 py-3 rounded-xl font-bold text-xs shadow-md"
              >
                🛠️ Admin Dashboard
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="w-full bg-[#c0392b] text-white py-3 rounded-xl hover:bg-[#a93226] font-bold text-xs shadow-md transition-colors"
            >
              Log Out
            </button>
          </div>
        )}

      </div>
    </>
  );
}

export default MobileDrawer;
