import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';
import ProductCard from '../components/ProductCard';

function Wishlist() {
  const { wishlist } = useWishlist();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-[#8b5a2b] mb-10 font-serif">My Wishlist</h1>
      {wishlist.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl elegant-shadow border border-gray-100">
          <svg className="w-24 h-24 mx-auto text-[#8b5a2b] mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-2xl text-gray-600 mb-6 font-medium">Your wishlist is empty</p>
          <Link to="/products" className="inline-block bg-gradient-to-r from-[#8b5a2b] to-[#a07254] text-white px-8 py-4 rounded-xl hover:from-[#a07254] hover:to-[#8b5a2b] transition-all duration-300 font-semibold text-lg">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {wishlist.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
