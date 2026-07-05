import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function NotFound() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen py-16 px-4 bg-gradient-to-br from-[#f0f5fa] to-[#f7f2ed] flex items-center justify-center select-none text-left">
      <div className="max-w-md w-full bg-white rounded-3xl elegant-shadow p-8 text-center border border-gray-100 space-y-6">
        
        {/* Animated header */}
        <div className="space-y-2">
          <span className="text-6xl md:text-8xl block animate-pulse">🧐</span>
          <h1 className="text-4xl font-extrabold text-[#0f2a4a] font-serif">404 - Misplaced!</h1>
          <p className="text-xs text-gray-400">The jewellery article or page you requested cannot be found.</p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Search products instead..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#0f2a4a] bg-white text-gray-800 pr-10"
            required
          />
          <button
            type="submit"
            className="absolute right-3.5 top-3 text-[#0f2a4a] font-bold text-sm"
          >
            🔍
          </button>
        </form>

        {/* Quick redirect recommendations */}
        <div className="space-y-4 border-t pt-6">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Or browse popular collections:</span>
          <div className="flex flex-wrap justify-center gap-2">
            <Link 
              to="/products?category=german-silver" 
              className="bg-[#f0f5fa] border border-[#0f2a4a]/10 hover:border-[#0f2a4a] px-3.5 py-2 rounded-xl text-xxs font-bold text-[#0f2a4a] transition-all"
            >
              German Silver
            </Link>
            <Link 
              to="/products?category=one-gram-gold" 
              className="bg-[#f0f5fa] border border-[#0f2a4a]/10 hover:border-[#0f2a4a] px-3.5 py-2 rounded-xl text-xxs font-bold text-[#0f2a4a] transition-all"
            >
              One Gram Gold
            </Link>
            <Link 
              to="/products?category=panchaloha" 
              className="bg-[#f0f5fa] border border-[#0f2a4a]/10 hover:border-[#0f2a4a] px-3.5 py-2 rounded-xl text-xxs font-bold text-[#0f2a4a] transition-all"
            >
              Panchaloha
            </Link>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-2 flex flex-col gap-2">
          <Link to="/" className="w-full bg-[#0f2a4a] hover:bg-[#1b4965] text-white py-3.5 rounded-xl font-bold text-xs shadow-md transition-all">
            Return to Home Page
          </Link>
          <Link to="/products" className="text-xs text-gray-400 font-bold hover:underline">
            View All Jewelry
          </Link>
        </div>

      </div>
    </div>
  );
}

export default NotFound;
