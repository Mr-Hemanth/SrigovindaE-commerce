'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function NotFound() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen py-16 px-4 bg-gradient-to-br from-brand-cream-100 to-brand-cream-200 flex items-center justify-center select-none text-left">
      <div className="max-w-md w-full bg-white rounded-3xl elegant-shadow p-8 text-center border border-gray-100 space-y-6">

        {/* Animated header */}
        <div className="space-y-2">
          <span className="text-6xl md:text-8xl block animate-pulse">🧐</span>
          <h1 className="text-4xl font-extrabold text-brand-navy-900 font-serif">404 - Misplaced!</h1>
          <p className="text-xs text-gray-400">The jewellery article or page you requested cannot be found.</p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Search products instead..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-navy-900 bg-white text-gray-800 pr-10"
            required
          />
          <button
            type="submit"
            className="absolute right-3.5 top-3 text-brand-navy-900 font-bold text-sm"
          >
            🔍
          </button>
        </form>

        {/* Quick redirect recommendations */}
        <div className="space-y-4 border-t pt-6">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Or browse popular collections:</span>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/products?category=german-silver"
              className="bg-brand-cream-100 border border-brand-navy-900/10 hover:border-brand-navy-900 px-3.5 py-2 rounded-xl text-xxs font-bold text-brand-navy-900 transition-all"
            >
              German Silver
            </Link>
            <Link
              href="/products?category=one-gram-gold"
              className="bg-brand-cream-100 border border-brand-navy-900/10 hover:border-brand-navy-900 px-3.5 py-2 rounded-xl text-xxs font-bold text-brand-navy-900 transition-all"
            >
              One Gram Gold
            </Link>
            <Link
              href="/products?category=panchaloha"
              className="bg-brand-cream-100 border border-brand-navy-900/10 hover:border-brand-navy-900 px-3.5 py-2 rounded-xl text-xxs font-bold text-brand-navy-900 transition-all"
            >
              Panchaloha
            </Link>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-2 flex flex-col gap-2">
          <Link href="/" className="w-full bg-brand-navy-900 hover:bg-brand-navy-800 text-white py-3.5 rounded-xl font-bold text-xs shadow-md transition-all">
            Return to Home Page
          </Link>
          <Link href="/products" className="text-xs text-gray-400 font-bold hover:underline">
            View All Jewelry
          </Link>
        </div>

      </div>
    </div>
  );
}

export default NotFound;
