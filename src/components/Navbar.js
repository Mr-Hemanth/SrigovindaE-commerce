import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

function Navbar() {
  const { currentUser, isAdmin, logout } = useAuth();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="bg-gradient-to-r from-[#0b1a30] to-[#0f2a4a] shadow-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Title */}
          <Link to="/" className="flex items-center gap-3 select-none">
            <img src="/logo.jpg" alt="Srigovinda Collections" className="w-10 h-10 rounded-full border border-[#d4af37]/40 object-cover elegant-shadow" />
            <span className="text-lg md:text-2xl font-bold text-[#f0f5fa] font-serif tracking-wide">
              Srigovinda collections
            </span>
          </Link>
          
          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center space-x-7">
            <Link to="/" className="text-[#f0f5fa] hover:text-white transition-all duration-300 font-medium text-sm">Home</Link>
            <Link to="/products" className="text-[#f0f5fa] hover:text-white transition-all duration-300 font-medium text-sm">Products</Link>
            
            {currentUser ? (
              <>
                <Link to="/wishlist" className="text-[#f0f5fa] hover:text-white transition-all duration-300 relative flex items-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlist.length > 0 && (
                    <span className="absolute -top-2.5 -right-2.5 bg-[#d4af37] text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">{wishlist.length}</span>
                  )}
                </Link>
                <Link to="/cart" className="text-[#f0f5fa] hover:text-white transition-all duration-300 relative flex items-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                  </svg>
                  {totalCartItems > 0 && (
                    <span className="absolute -top-2.5 -right-2.5 bg-[#d4af37] text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">{totalCartItems}</span>
                  )}
                </Link>
                <Link to="/orders" className="text-[#f0f5fa] hover:text-white transition-all duration-300 font-medium text-sm">Orders</Link>
                <Link to="/profile" className="text-[#f0f5fa] hover:text-white transition-all duration-300 font-medium text-sm">Profile</Link>
                {isAdmin && (
                  <Link to="/admin" className="bg-[#d4af37] text-[#0b1a30] px-5 py-2 rounded-xl hover:bg-[#c49d2f] transition-all duration-300 font-bold text-xs shadow-md">
                    Admin Panel
                  </Link>
                )}
                <button onClick={handleLogout} className="bg-[#c0392b] text-white px-5 py-2 rounded-xl hover:bg-[#a93226] transition-all duration-300 font-bold text-xs shadow-md">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-[#f0f5fa] hover:text-white transition-all duration-300 font-medium text-sm">Login</Link>
                <Link to="/signup" className="bg-[#d4af37] text-[#0b1a30] px-5 py-2 rounded-xl hover:bg-[#c49d2f] transition-all duration-300 font-bold text-xs shadow-md">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex lg:hidden items-center space-x-5">
            {currentUser && (
              <>
                <Link to="/wishlist" className="text-[#f0f5fa] relative flex items-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlist.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#d4af37] text-white text-[9px] rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold">{wishlist.length}</span>
                  )}
                </Link>
                <Link to="/cart" className="text-[#f0f5fa] relative flex items-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                  </svg>
                  {totalCartItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#d4af37] text-white text-[9px] rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold">{totalCartItems}</span>
                  )}
                </Link>
              </>
            )}

            {/* Toggle Button */}
            <button
              onClick={() => setIsOpen(true)}
              className="text-[#f0f5fa] hover:text-white focus:outline-none"
              aria-label="Open navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop overlay for mobile drawer */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Slide-Over Navigation Drawer */}
      <div className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-gradient-to-b from-[#0b1a30] to-[#0f2a4a] text-[#f0f5fa] shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col justify-between border-l border-[#d4af37]/20 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#f0f5fa]/10">
          <div className="flex justify-between items-center mb-4">
            <span className="font-serif font-bold text-lg text-[#d4af37]">Store Menu</span>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white text-2xl font-semibold leading-none focus:outline-none"
            >
              ✕
            </button>
          </div>

          {/* User profile block */}
          {currentUser && (
            <div className="bg-black/10 p-3.5 rounded-xl border border-white/5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#d4af37]/20 flex items-center justify-center font-bold text-[#d4af37] border border-[#d4af37]/20">
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
          <Link to="/" onClick={() => setIsOpen(false)} className="block text-sm font-semibold hover:text-[#d4af37] py-2 transition-colors border-b border-white/5">🏠 Home Page</Link>
          <Link to="/products" onClick={() => setIsOpen(false)} className="block text-sm font-semibold hover:text-[#d4af37] py-2 transition-colors border-b border-white/5">🛍️ Shop Products</Link>
          
          {currentUser ? (
            <>
              <Link to="/orders" onClick={() => setIsOpen(false)} className="block text-sm font-semibold hover:text-[#d4af37] py-2 transition-colors border-b border-white/5">📦 Order Tracking</Link>
              <Link to="/profile" onClick={() => setIsOpen(false)} className="block text-sm font-semibold hover:text-[#d4af37] py-2 transition-colors border-b border-white/5">👤 My Account Profile</Link>
              <Link to="/wishlist" onClick={() => setIsOpen(false)} className="block text-sm font-semibold hover:text-[#d4af37] py-2 transition-colors border-b border-white/5">❤️ Wishlist ({wishlist.length})</Link>
              <Link to="/cart" onClick={() => setIsOpen(false)} className="block text-sm font-semibold hover:text-[#d4af37] py-2 transition-colors border-b border-white/5">🛒 Shopping Cart ({totalCartItems})</Link>
            </>
          ) : (
            <div className="space-y-3 pt-4">
              <Link 
                to="/login" 
                onClick={() => setIsOpen(false)} 
                className="block text-center border border-[#d4af37]/50 text-[#f0f5fa] py-3 rounded-xl font-bold text-xs"
              >
                Log In
              </Link>
              <Link 
                to="/signup" 
                onClick={() => setIsOpen(false)} 
                className="block text-center bg-gradient-to-r from-[#d4af37] to-[#c49d2f] text-[#0b1a30] py-3 rounded-xl font-bold text-xs"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        {currentUser && (
          <div className="p-6 border-t border-[#f0f5fa]/10 bg-black/5 space-y-3">
            {isAdmin && (
              <Link 
                to="/admin" 
                onClick={() => setIsOpen(false)} 
                className="block text-center bg-gradient-to-r from-[#d4af37] to-[#c49d2f] text-[#0b1a30] py-3 rounded-xl font-bold text-xs shadow-md"
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
    </nav>
  );
}

export default Navbar;
