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
    <nav className="bg-gradient-to-r from-[#8b5a2b] to-[#a07254] shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Title */}
          <Link to="/" className="text-xl md:text-2xl font-bold text-[#fdf6e9] font-serif tracking-wide select-none">
            🙏 Srigovinda collections
          </Link>
          
          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center space-x-7">
            <Link to="/" className="text-[#fdf6e9] hover:text-white transition-all duration-300 font-medium text-sm">Home</Link>
            <Link to="/products" className="text-[#fdf6e9] hover:text-white transition-all duration-300 font-medium text-sm">Products</Link>
            
            {currentUser ? (
              <>
                <Link to="/wishlist" className="text-[#fdf6e9] hover:text-white transition-all duration-300 relative flex items-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlist.length > 0 && (
                    <span className="absolute -top-2.5 -right-2.5 bg-[#d4af37] text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">{wishlist.length}</span>
                  )}
                </Link>
                <Link to="/cart" className="text-[#fdf6e9] hover:text-white transition-all duration-300 relative flex items-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                  </svg>
                  {totalCartItems > 0 && (
                    <span className="absolute -top-2.5 -right-2.5 bg-[#d4af37] text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">{totalCartItems}</span>
                  )}
                </Link>
                <Link to="/orders" className="text-[#fdf6e9] hover:text-white transition-all duration-300 font-medium text-sm">Orders</Link>
                <Link to="/profile" className="text-[#fdf6e9] hover:text-white transition-all duration-300 font-medium text-sm">Profile</Link>
                {isAdmin && (
                  <Link to="/admin" className="bg-[#d4af37] text-[#5a3d1d] px-5 py-2 rounded-xl hover:bg-[#c49d2f] transition-all duration-300 font-bold text-xs shadow-md">
                    Admin Panel
                  </Link>
                )}
                <button onClick={handleLogout} className="bg-[#c0392b] text-white px-5 py-2 rounded-xl hover:bg-[#a93226] transition-all duration-300 font-bold text-xs shadow-md">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-[#fdf6e9] hover:text-white transition-all duration-300 font-medium text-sm">Login</Link>
                <Link to="/signup" className="bg-[#d4af37] text-[#5a3d1d] px-5 py-2 rounded-xl hover:bg-[#c49d2f] transition-all duration-300 font-bold text-xs shadow-md">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex lg:hidden items-center space-x-5">
            {currentUser && (
              <>
                <Link to="/wishlist" className="text-[#fdf6e9] relative flex items-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlist.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#d4af37] text-white text-[9px] rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold">{wishlist.length}</span>
                  )}
                </Link>
                <Link to="/cart" className="text-[#fdf6e9] relative flex items-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                  </svg>
                  {totalCartItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#d4af37] text-white text-[9px] rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold">{totalCartItems}</span>
                  )}
                </Link>
              </>
            )}

            {/* Toggle Dropdown Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-[#fdf6e9] hover:text-white focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown panel */}
        {isOpen && (
          <div className="lg:hidden block border-t border-[#fdf6e9]/10 pb-5 pt-3 space-y-3 animate-fade-in">
            <Link to="/" onClick={() => setIsOpen(false)} className="block text-[#fdf6e9] hover:text-white font-medium py-1.5 text-sm">Home</Link>
            <Link to="/products" onClick={() => setIsOpen(false)} className="block text-[#fdf6e9] hover:text-white font-medium py-1.5 text-sm">Products</Link>
            
            {currentUser ? (
              <>
                <Link to="/orders" onClick={() => setIsOpen(false)} className="block text-[#fdf6e9] hover:text-white font-medium py-1.5 text-sm">Orders</Link>
                <Link to="/profile" onClick={() => setIsOpen(false)} className="block text-[#fdf6e9] hover:text-white font-medium py-1.5 text-sm">Profile</Link>
                <div className="pt-2 flex flex-wrap gap-3 items-center">
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setIsOpen(false)} className="bg-[#d4af37] text-[#5a3d1d] px-4 py-2 rounded-xl font-bold text-xs shadow-md">
                      Admin Panel
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout} 
                    className="bg-[#c0392b] text-white px-4 py-2 rounded-xl hover:bg-[#a93226] font-bold text-xs shadow-md"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-4 pt-2">
                <Link to="/login" onClick={() => setIsOpen(false)} className="text-[#fdf6e9] hover:text-white font-medium text-sm flex items-center">Login</Link>
                <Link to="/signup" onClick={() => setIsOpen(false)} className="bg-[#d4af37] text-[#5a3d1d] px-5 py-2 rounded-xl font-bold text-xs shadow-md">Sign Up</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
