import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

function Navbar() {
  const { currentUser, isAdmin, logout } = useAuth();
  const { cart } = useCart();
  const { wishlist } = useWishlist();

  return (
    <nav className="bg-gradient-to-r from-[#8b5a2b] to-[#a07254] shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          <Link to="/" className="text-2xl font-bold text-[#fdf6e9] font-serif">🙏 Srigovinda collections</Link>
          
          <div className="flex items-center space-x-7">
            <Link to="/" className="text-[#fdf6e9] hover:text-white transition-all duration-300 font-medium">Home</Link>
            <Link to="/products" className="text-[#fdf6e9] hover:text-white transition-all duration-300 font-medium">Products</Link>
            
            {currentUser ? (
              <>
                <Link to="/wishlist" className="text-[#fdf6e9] hover:text-white transition-all duration-300 relative">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlist.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#d4af37] text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold">{wishlist.length}</span>
                  )}
                </Link>
                <Link to="/cart" className="text-[#fdf6e9] hover:text-white transition-all duration-300 relative">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                  </svg>
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#d4af37] text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold">{cart.reduce((acc, item) => acc + item.quantity, 0)}</span>
                  )}
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="bg-[#d4af37] text-[#5a3d1d] px-5 py-2 rounded-xl hover:bg-[#c49d2f] transition-all duration-300 font-semibold shadow-md">
                    Admin
                  </Link>
                )}
                <Link to="/orders" className="text-[#fdf6e9] hover:text-white transition-all duration-300 font-medium">Orders</Link>
                <Link to="/profile" className="text-[#fdf6e9] hover:text-white transition-all duration-300 font-medium">Profile</Link>
                <button onClick={logout} className="bg-[#c0392b] text-white px-5 py-2 rounded-xl hover:bg-[#a93226] transition-all duration-300 font-semibold shadow-md">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-[#fdf6e9] hover:text-white transition-all duration-300 font-medium">Login</Link>
                <Link to="/signup" className="bg-[#d4af37] text-[#5a3d1d] px-5 py-2 rounded-xl hover:bg-[#c49d2f] transition-all duration-300 font-semibold shadow-md">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
