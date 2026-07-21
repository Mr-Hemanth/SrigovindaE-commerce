'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { categories } from '@/lib/data/products';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';
import ProductCard from '@/components/ProductCard';
import { db } from '@/lib/firebase/client';
import { collection, getDocs } from 'firebase/firestore';
import { useProductRatings } from '@/lib/hooks/useProductRatings';
import { searchProducts } from '@/lib/fuzzy-search';

const UNSPECIFIED = 'Unspecified';

function Products({ initialProducts = [] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);

  // Custom Filter States
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [selectedMaterial, setSelectedMaterial] = useState('all');
  const [selectedOccasion, setSelectedOccasion] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedGiftingTier, setSelectedGiftingTier] = useState('all');

  const [sortBy, setSortBy] = useState('default');
  const [priceRange, setPriceRange] = useState(20000);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();

  // Grid/List Toggle & Pagination States
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // productId -> { avg, count }, built from the real reviews collection
  const ratingsById = useProductRatings();

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seeds filter state from the URL on navigation
      setSelectedCategory(cat);
      setSelectedSubcategory('all');
      setCurrentPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    const search = searchParams.get('search');
    if (search) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seeds filter state from the URL on navigation
      setSearchQuery(search);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // "Did you mean" logic for common typos — pure function of searchQuery, no effect needed
  const didYouMean = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q === 'chokr' || q === 'chokre' || q === 'chokar') return 'choker';
    if (q === 'ringg' || q === 'rin') return 'ring';
    if (q === 'erring' || q === 'earing' || q === 'earings') return 'earrings';
    if (q === 'necklacee' || q === 'necklas') return 'necklace';
    return '';
  }, [searchQuery]);

  // Server-rendered initialProducts already covers the common case (fast first paint, images
  // start loading immediately); this only hits Firestore client-side as a fallback when that
  // wasn't available (e.g. local dev without the Admin SDK configured).
  useEffect(() => {
    if (initialProducts.length > 0) return;
    (async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.warn('Firebase query failed:', err);
      }
    })();
  }, [initialProducts]);

  // Only reflects real product data set by the admin — never fabricates values.
  const getProductMeta = (p) => ({
    material: p.material || null,
    occasion: p.occasion || null,
    color: p.color || null,
    giftingTier: p.giftingTier || null,
  });

  const getCreatedAtMs = (p) => {
    if (!p.createdAt) return 0;
    if (p.createdAt.toDate) return p.createdAt.toDate().getTime();
    return new Date(p.createdAt).getTime() || 0;
  };

  const filteredProducts = useMemo(() => {
    let temp = [...products];

    // Filter by Search Query — exact substring matches first, then a typo-tolerant fuzzy
    // fallback (e.g. "neklace" or "earings" still finds the right products).
    if (searchQuery.trim() !== '') {
      temp = searchProducts(temp, searchQuery);
    }

    // Filter by Category
    if (selectedCategory !== 'all') {
      temp = temp.filter(p => p.category === selectedCategory);
    }

    // Filter by Subcategory
    if (selectedSubcategory !== 'all') {
      temp = temp.filter(p => p.subcategory === selectedSubcategory);
    }

    // Filter by Price Range
    temp = temp.filter(p => {
      const activePrice = p.discountedPrice !== undefined && p.discountedPrice !== null && p.discountedPrice !== '' && Number(p.discountedPrice) > 0
        ? Number(p.discountedPrice)
        : Number(p.price);
      return activePrice <= priceRange;
    });

    // Custom Category Filter tags
    temp = temp.filter(p => {
      const meta = getProductMeta(p);
      if (selectedMaterial !== 'all' && meta.material !== selectedMaterial) return false;
      if (selectedOccasion !== 'all' && meta.occasion !== selectedOccasion) return false;
      if (selectedColor !== 'all' && meta.color !== selectedColor) return false;
      if (selectedGiftingTier !== 'all' && meta.giftingTier !== selectedGiftingTier) return false;
      return true;
    });

    // Sort products
    if (sortBy === 'price-low') {
      temp.sort((a, b) => {
        const pA = a.discountedPrice !== undefined && a.discountedPrice !== null && a.discountedPrice !== '' && Number(a.discountedPrice) > 0 ? Number(a.discountedPrice) : Number(a.price);
        const pB = b.discountedPrice !== undefined && b.discountedPrice !== null && b.discountedPrice !== '' && Number(b.discountedPrice) > 0 ? Number(b.discountedPrice) : Number(b.price);
        return pA - pB;
      });
    } else if (sortBy === 'price-high') {
      temp.sort((a, b) => {
        const pA = a.discountedPrice !== undefined && a.discountedPrice !== null && a.discountedPrice !== '' && Number(a.discountedPrice) > 0 ? Number(a.discountedPrice) : Number(a.price);
        const pB = b.discountedPrice !== undefined && b.discountedPrice !== null && b.discountedPrice !== '' && Number(b.discountedPrice) > 0 ? Number(b.discountedPrice) : Number(b.price);
        return pB - pA;
      });
    } else if (sortBy === 'newest') {
      temp.sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));
    } else if (sortBy === 'rating') {
      temp.sort((a, b) => (ratingsById[b.id]?.avg || 0) - (ratingsById[a.id]?.avg || 0));
    }

    return temp.filter(p => p.isActive !== false);
  }, [products, selectedCategory, selectedSubcategory, selectedMaterial, selectedOccasion, selectedColor, selectedGiftingTier, priceRange, sortBy, searchQuery, ratingsById]);

  const renderListCard = (product) => {
    const hasDiscount = product.discountedPrice !== undefined && product.discountedPrice !== null && product.discountedPrice !== '' && Number(product.discountedPrice) > 0;
    const discountPercentage = hasDiscount ? Math.round(((product.price - product.discountedPrice) / product.price) * 100) : 0;
    const meta = getProductMeta(product);

    return (
      <div key={product.id} className="bg-white rounded-3xl elegant-shadow p-5 flex flex-col md:flex-row items-center gap-6 border border-gray-50/50 hover:border-brand-navy-900/20 transition-all duration-300 select-none text-left">
        <div className="relative w-full md:w-48 h-48 rounded-2xl overflow-hidden cursor-pointer flex-shrink-0" onClick={() => router.push(`/product/${product.id}`)}>
          <Image src={optimizeCloudinaryUrl(product.image, { width: 400 })} alt={product.name} fill sizes="(max-width: 768px) 100vw, 192px" className="object-cover" />
          {hasDiscount && (
            <span className="absolute top-3 left-3 bg-brand-gold-500 text-brand-navy-950 font-black text-[9px] px-2 py-0.5 rounded-full shadow">
              SAVE {discountPercentage}%
            </span>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-between py-1 space-y-4">
          <div>
            <span className="text-[10px] font-bold text-brand-gold-700 tracking-wider uppercase">{product.category?.replace('-', ' ')}</span>
            <h3 className="text-lg font-bold text-gray-800 font-serif leading-tight mt-1 hover:text-brand-navy-900 cursor-pointer" onClick={() => router.push(`/product/${product.id}`)}>{product.name}</h3>
            <p className="text-xs text-gray-500 line-clamp-2 mt-2 leading-relaxed">{product.description}</p>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-bold">{meta.material || UNSPECIFIED}</span>
              <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-bold">{meta.occasion || UNSPECIFIED}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-50 pt-4">
            <div className="flex items-baseline gap-2">
              {hasDiscount ? (
                <>
                  <span className="text-xl font-extrabold text-brand-navy-900">₹{Number(product.discountedPrice).toFixed(0)}</span>
                  <span className="text-gray-400 line-through text-xs">₹{Number(product.price).toFixed(0)}</span>
                </>
              ) : (
                <span className="text-xl font-extrabold text-brand-navy-900">₹{Number(product.price).toFixed(0)}</span>
              )}
            </div>
            <button
              onClick={() => router.push(`/product/${product.id}`)}
              className="bg-brand-navy-900 hover:bg-brand-navy-800 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  };
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const currentCategory = categories.find(c => c.id === selectedCategory);
  const availableSubcategories = currentCategory?.subcategories || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">

      {/* Breadcrumb Navigation */}
      <nav className="text-[10px] text-gray-500 mb-4 flex items-center gap-1.5 select-none font-bold uppercase tracking-wider">
        <Link href="/" className="hover:text-brand-navy-900 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-brand-navy-900 transition-colors">Products</Link>
        {selectedCategory !== 'all' && (
          <>
            <span>/</span>
            <span className="text-gray-800">{categories.find(c => c.id === selectedCategory)?.name}</span>
          </>
        )}
      </nav>

      <h1 className="text-2xl md:text-4xl font-bold text-brand-navy-900 mb-2 font-serif">Srigovinda collections</h1>
      <p className="text-gray-600 text-xs md:text-lg mb-6">Explore our exquisite jewellery collection in German Silver, One Gram Gold, and Panchaloha</p>

      {/* Search Input Bar */}
      <div className="mb-4 relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
          🔍
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          placeholder="Search for jewellery items (e.g. necklace, ring, earrings)..."
          className="w-full pl-10 pr-4 py-3 md:py-3.5 border border-gray-200 rounded-2xl text-xs md:text-sm focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/5 bg-white elegant-shadow"
        />
      </div>

      {didYouMean && (
        <div className="mb-6 text-xs font-bold text-gray-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-left select-none">
          🔍 Did you mean: <button onClick={() => setSearchQuery(didYouMean)} className="text-brand-navy-900 hover:underline font-extrabold">{didYouMean}</button>?
        </div>
      )}

      {/* Filters Toggle Button */}
      <button
        type="button"
        onClick={() => setShowFilters(!showFilters)}
        className="w-full flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl elegant-shadow border border-gray-100 font-bold text-xs text-brand-navy-900 mb-6 transition-all hover:bg-brand-cream-100"
      >
        <span className="flex items-center gap-2">🔍 {showFilters ? 'Hide Filters' : 'Show Filters'}</span>
        <span>{showFilters ? '▲' : '▼'}</span>
      </button>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className={`lg:w-72 flex-shrink-0 ${showFilters ? 'block animate-fade-in' : 'hidden'}`}>
          <div className="bg-white rounded-3xl elegant-shadow p-5 md:p-6 sticky top-28 border border-gray-100 space-y-6">

            {/* Header */}
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-brand-navy-900 font-serif">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-xs font-semibold text-gray-500 hover:text-red-600"
              >
                Close ✕
              </button>
            </div>

            {/* Categories */}
            <div>
              <h4 className="font-bold mb-2.5 text-gray-800 text-xs md:text-sm uppercase tracking-wider">Category</h4>
              <div className="grid grid-cols-2 gap-1.5 lg:flex lg:flex-col lg:space-y-1">
                <label className="flex items-center gap-2 cursor-pointer p-1.5 lg:p-2 rounded-xl hover:bg-brand-cream-100 transition-colors border border-gray-100/50 lg:border-none">
                  <input
                    type="radio"
                    name="category"
                    value="all"
                    checked={selectedCategory === 'all'}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedSubcategory('all');
                      setCurrentPage(1);
                    }}
                    className="w-4 h-4 text-brand-navy-900 accent-brand-navy-900"
                  />
                  <span className="text-gray-700 font-medium text-xs lg:text-sm">All Categories</span>
                </label>
                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer p-1.5 lg:p-2 rounded-xl hover:bg-brand-cream-100 transition-colors border border-gray-100/50 lg:border-none">
                    <input
                      type="radio"
                      name="category"
                      value={cat.id}
                      checked={selectedCategory === cat.id}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setSelectedSubcategory('all');
                        setCurrentPage(1);
                      }}
                      className="w-4 h-4 text-brand-navy-900 accent-brand-navy-900"
                    />
                    <span className="text-gray-700 font-medium text-xs lg:text-sm truncate">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Subcategories */}
            {selectedCategory !== 'all' && availableSubcategories.length > 0 && (
              <div>
                <h4 className="font-bold mb-2.5 text-gray-800 text-xs md:text-sm uppercase tracking-wider">Subcategory</h4>
                <div className="grid grid-cols-2 gap-1.5 lg:flex lg:flex-col lg:space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 lg:p-2 rounded-xl hover:bg-brand-cream-100 transition-colors border border-gray-100/50 lg:border-none">
                    <input
                      type="radio"
                      name="subcategory"
                      value="all"
                      checked={selectedSubcategory === 'all'}
                      onChange={(e) => setSelectedSubcategory(e.target.value)}
                      className="w-4 h-4 text-brand-navy-900 accent-brand-navy-900"
                    />
                    <span className="text-gray-700 font-medium text-xs lg:text-sm">All</span>
                  </label>
                  {availableSubcategories.map(sub => (
                    <label key={sub} className="flex items-center gap-2 cursor-pointer p-1.5 lg:p-2 rounded-xl hover:bg-brand-cream-100 transition-colors border border-gray-100/50 lg:border-none">
                      <input
                        type="radio"
                        name="subcategory"
                        value={sub}
                        checked={selectedSubcategory === sub}
                        onChange={(e) => { setSelectedSubcategory(e.target.value); setCurrentPage(1); }}
                        className="w-4 h-4 text-brand-navy-900 accent-brand-navy-900"
                      />
                      <span className="text-gray-700 font-medium text-xs lg:text-sm truncate">{sub}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price Slider */}
            <div>
              <label htmlFor="filter-price" className="block font-bold mb-2 text-gray-800 text-xs md:text-sm uppercase tracking-wider">Price: ₹{priceRange}</label>
              <input
                id="filter-price"
                type="range"
                min="100"
                max="20000"
                value={priceRange}
                onChange={(e) => { setPriceRange(Number(e.target.value)); setCurrentPage(1); }}
                className="w-full accent-brand-navy-900"
              />
            </div>

            {/* Material */}
            <div>
              <label htmlFor="filter-material" className="block font-bold mb-2 text-gray-800 text-xs md:text-sm uppercase tracking-wider">Material</label>
              <select
                id="filter-material"
                value={selectedMaterial}
                onChange={(e) => { setSelectedMaterial(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-brand-navy-900 bg-white text-gray-700"
              >
                <option value="all">All Materials</option>
                <option value="German Silver">German Silver</option>
                <option value="Gold Plated">Gold Plated</option>
                <option value="Panchaloha">Panchaloha</option>
                <option value="Brass">Brass</option>
              </select>
            </div>

            {/* Occasion */}
            <div>
              <label htmlFor="filter-occasion" className="block font-bold mb-2 text-gray-800 text-xs md:text-sm uppercase tracking-wider">Occasion</label>
              <select
                id="filter-occasion"
                value={selectedOccasion}
                onChange={(e) => { setSelectedOccasion(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-brand-navy-900 bg-white text-gray-700"
              >
                <option value="all">All Occasions</option>
                <option value="Wedding">Wedding Wear</option>
                <option value="Festival">Festivals</option>
                <option value="Gifting">Gifting Shubh</option>
                <option value="Casual">Casual Wear</option>
              </select>
            </div>

            {/* Color */}
            <div>
              <label htmlFor="filter-color" className="block font-bold mb-2 text-gray-800 text-xs md:text-sm uppercase tracking-wider">Color</label>
              <select
                id="filter-color"
                value={selectedColor}
                onChange={(e) => { setSelectedColor(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-brand-navy-900 bg-white text-gray-700"
              >
                <option value="all">All Colors</option>
                <option value="Gold">Antique Gold</option>
                <option value="Silver">Silver White</option>
                <option value="Ruby Red">Ruby Red</option>
                <option value="Emerald Green">Emerald Green</option>
              </select>
            </div>

            {/* Gifting Tier */}
            <div>
              <label htmlFor="filter-gifting-tier" className="block font-bold mb-2 text-gray-800 text-xs md:text-sm uppercase tracking-wider">Gifting Tier</label>
              <select
                id="filter-gifting-tier"
                value={selectedGiftingTier}
                onChange={(e) => { setSelectedGiftingTier(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-brand-navy-900 bg-white text-gray-700"
              >
                <option value="all">All Budgets</option>
                <option value="Budget">Budget Gifts (Under ₹1,000)</option>
                <option value="Premium">Premium Gifts (₹1,000 - ₹5,000)</option>
                <option value="Luxury">Luxury Gifting (Above ₹5,000)</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label htmlFor="filter-sort" className="block font-bold mb-2 text-gray-800 text-xs md:text-sm uppercase tracking-wider">Sort By</label>
              <select
                id="filter-sort"
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/5 bg-white text-gray-700"
              >
                <option value="default">Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest Arrival</option>
                <option value="rating">Average Rating</option>
              </select>
            </div>

          </div>
        </div>

        <div className="flex-grow">
          {/* Header Row: Products count and Grid/List view mode toggle */}
          <div className="flex justify-between items-center mb-6 bg-white px-5 py-4 rounded-2xl elegant-shadow border border-gray-50/50">
            <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wide">
              Showing {filteredProducts.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} items
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg border transition-all ${viewMode === 'grid' ? 'bg-brand-navy-900 border-brand-navy-900 text-white' : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-600'}`}
                title="Grid View"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg border transition-all ${viewMode === 'list' ? 'bg-brand-navy-900 border-brand-navy-900 text-white' : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-600'}`}
                title="List View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Active Filter Pills */}
          {(selectedCategory !== 'all' || selectedSubcategory !== 'all' || priceRange < 20000 || searchQuery !== '' || selectedMaterial !== 'all' || selectedOccasion !== 'all' || selectedColor !== 'all' || selectedGiftingTier !== 'all') && (
            <div className="flex flex-wrap gap-2 mb-6">
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-brand-cream-100 text-brand-navy-900 border border-brand-navy-900/10">
                  Search: &quot;{searchQuery}&quot;
                  <button onClick={() => setSearchQuery('')} className="hover:text-red-500 font-extrabold text-xs ml-1">✕</button>
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-brand-cream-100 text-brand-navy-900 border border-brand-navy-900/10 capitalize">
                  Category: {categories.find(c => c.id === selectedCategory)?.name || selectedCategory}
                  <button onClick={() => { setSelectedCategory('all'); setSelectedSubcategory('all'); }} className="hover:text-red-500 font-extrabold text-xs ml-1">✕</button>
                </span>
              )}
              {selectedSubcategory !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-brand-cream-100 text-brand-navy-900 border border-brand-navy-900/10 capitalize">
                  Subcategory: {selectedSubcategory}
                  <button onClick={() => setSelectedSubcategory('all')} className="hover:text-red-500 font-extrabold text-xs ml-1">✕</button>
                </span>
              )}
              {selectedMaterial !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-brand-cream-100 text-brand-navy-900 border border-brand-navy-900/10 capitalize">
                  Material: {selectedMaterial}
                  <button onClick={() => setSelectedMaterial('all')} className="hover:text-red-500 font-extrabold text-xs ml-1">✕</button>
                </span>
              )}
              {selectedOccasion !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-brand-cream-100 text-brand-navy-900 border border-brand-navy-900/10 capitalize">
                  Occasion: {selectedOccasion}
                  <button onClick={() => setSelectedOccasion('all')} className="hover:text-red-500 font-extrabold text-xs ml-1">✕</button>
                </span>
              )}
              {selectedColor !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-brand-cream-100 text-brand-navy-900 border border-brand-navy-900/10 capitalize">
                  Color: {selectedColor}
                  <button onClick={() => setSelectedColor('all')} className="hover:text-red-500 font-extrabold text-xs ml-1">✕</button>
                </span>
              )}
              {selectedGiftingTier !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-brand-cream-100 text-brand-navy-900 border border-brand-navy-900/10 capitalize">
                  Tier: {selectedGiftingTier}
                  <button onClick={() => setSelectedGiftingTier('all')} className="hover:text-red-500 font-extrabold text-xs ml-1">✕</button>
                </span>
              )}
              {priceRange < 20000 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-brand-cream-100 text-brand-navy-900 border border-brand-navy-900/10">
                  Under ₹{priceRange}
                  <button onClick={() => setPriceRange(20000)} className="hover:text-red-500 font-extrabold text-xs ml-1">✕</button>
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSubcategory('all');
                  setSelectedMaterial('all');
                  setSelectedOccasion('all');
                  setSelectedColor('all');
                  setSelectedGiftingTier('all');
                  setPriceRange(20000);
                  setSearchQuery('');
                  setSortBy('default');
                }}
                className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline px-2.5 py-1.5"
              >
                Reset All
              </button>
            </div>
          )}

          {/* Catalog items display */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-10">
              {currentProducts.map(product => (
                <ProductCard key={product.id} product={product} ratingOverride={ratingsById[product.id] || { avg: '0.0', count: 0 }} />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {currentProducts.map(product => renderListCard(product))}
            </div>
          )}

          {/* Fallback empty view with helpful suggestions */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 elegant-shadow p-8 select-none">
              <span className="text-5xl block mb-4">🔍</span>
              <p className="text-lg text-gray-600 font-serif font-black">No matching jewellery items found.</p>
              <p className="text-xs text-gray-400 mt-2">Try checking standard spellings or browse recommended styles below:</p>

              <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                {['Choker', 'Silver Plate', 'Panchaloha Ring', 'Kasu Mala', 'German Silver'].map(term => (
                  <button
                    key={term}
                    onClick={() => {
                      setSearchQuery(term);
                      setSelectedCategory('all');
                      setSelectedSubcategory('all');
                      setPriceRange(20000);
                      setSelectedMaterial('all');
                      setSelectedOccasion('all');
                      setSelectedColor('all');
                      setSelectedGiftingTier('all');
                    }}
                    className="bg-brand-cream-100 border border-brand-navy-900/10 hover:border-brand-navy-900 px-3.5 py-2 rounded-xl text-[10px] font-bold text-brand-navy-900 transition-all"
                  >
                    &quot;{term}&quot;
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSubcategory('all');
                  setSelectedMaterial('all');
                  setSelectedOccasion('all');
                  setSelectedColor('all');
                  setSelectedGiftingTier('all');
                  setPriceRange(20000);
                  setSearchQuery('');
                  setSortBy('default');
                }}
                className="mt-8 text-xs font-bold text-red-500 hover:underline hover:text-red-700"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12 pt-6 border-t border-gray-100 select-none">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold bg-white text-brand-navy-900 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                ◀ Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  onClick={() => setCurrentPage(num)}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold border transition-all ${currentPage === num ? 'bg-brand-navy-900 border-brand-navy-900 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {num}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold bg-white text-brand-navy-900 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Next ▶
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Products;
