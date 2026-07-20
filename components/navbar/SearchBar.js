'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase/client';
import { collection, getDocs } from 'firebase/firestore';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';

function SearchBar() {
  // Global search autocomplete states
  const [allProducts, setAllProducts] = useState([]);
  const [searchVal, setSearchVal] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Fetch active products list for Navbar search on mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(p => p.isActive !== false);
        setAllProducts(list);
      } catch (err) {
        console.warn('Navbar: offline/error loading search database:', err);
      }
    };
    fetchAll();
  }, []);

  const handleSearchChange = (val) => {
    setSearchVal(val);
    if (!val.trim()) {
      setSearchSuggestions([]);
      return;
    }
    const q = val.toLowerCase();
    const matches = allProducts.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.subcategory?.toLowerCase().includes(q)
    );
    setSearchSuggestions(matches.slice(0, 5));
  };

  return (
    <div className="hidden md:block relative w-80 max-w-xs select-none">
      <div className="relative">
        <input
          type="text"
          value={searchVal}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
          placeholder="Search jewellery..."
          className="w-full pl-10 pr-4 py-2.5 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-gray-900 placeholder-gray-400 focus:placeholder-gray-500 rounded-full text-xs transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/50 border border-white/10 focus:border-transparent"
        />
        <svg className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Autocomplete Dropdown suggestions list */}
      {isSearchFocused && searchSuggestions.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in divide-y divide-gray-50">
          {searchSuggestions.map((prod) => (
            <Link
              key={prod.id}
              href={`/product/${prod.id}`}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
            >
              <Image
                src={optimizeCloudinaryUrl(prod.image, { width: 64 })}
                alt={prod.name}
                width={32}
                height={32}
                className="w-8 h-8 rounded-lg object-cover border border-gray-100"
              />
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-bold text-gray-800 truncate">{prod.name}</p>
                <p className="text-[10px] text-gray-400 capitalize">{prod.category?.replace('-', ' ')}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
