import React, { useState, useEffect, useCallback } from 'react';
import { sampleJewelleryProducts as sampleProducts, categories } from '../data/products';
import ProductCard from '../components/ProductCard';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

function Products() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [priceRange, setPriceRange] = useState(10000);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        if (querySnapshot.empty) {
          setProducts(sampleProducts);
        } else {
          setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } catch (err) {
        console.warn('Firebase query failed. Loading local items:', err);
        setProducts(sampleProducts);
      }
    };
    fetchProducts();
  }, []);

  const applyFilters = useCallback(() => {
    let temp = [...products];

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
    }

    setFilteredProducts(temp.filter(p => p.isActive !== false));
  }, [products, selectedCategory, selectedSubcategory, priceRange, sortBy]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const currentCategory = categories.find(c => c.id === selectedCategory);
  const availableSubcategories = currentCategory?.subcategories || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
      <h1 className="text-2xl md:text-4xl font-bold text-[#0f2a4a] mb-2 font-serif">Srigovinda collections</h1>
      <p className="text-gray-600 text-xs md:text-lg mb-6">Explore our exquisite jewellery collection in German Silver, One Gram Gold, and Panchaloha</p>
      
      {/* Filters Toggle Button for Mobile */}
      <button
        type="button"
        onClick={() => setShowFiltersMobile(!showFiltersMobile)}
        className="lg:hidden w-full flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl elegant-shadow border border-gray-100 font-bold text-xs text-[#0f2a4a] mb-6 transition-all hover:bg-[#f0f5fa]"
      >
        <span className="flex items-center gap-2">🔍 {showFiltersMobile ? 'Hide Filters' : 'Show Filters'}</span>
        <span>{showFiltersMobile ? '▲' : '▼'}</span>
      </button>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className={`lg:w-72 flex-shrink-0 ${showFiltersMobile ? 'block animate-fade-in' : 'hidden lg:block'}`}>
          <div className="bg-white rounded-3xl elegant-shadow p-5 md:p-6 sticky top-28 border border-gray-100 space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-[#0f2a4a] font-serif">Filters</h3>
              {showFiltersMobile && (
                <button 
                  onClick={() => setShowFiltersMobile(false)}
                  className="text-xs font-semibold text-gray-400 hover:text-red-500"
                >
                  Close ✕
                </button>
              )}
            </div>
            
            {/* Categories */}
            <div>
              <h4 className="font-bold mb-2.5 text-gray-800 text-xs md:text-sm uppercase tracking-wider">Category</h4>
              <div className="grid grid-cols-2 gap-1.5 lg:flex lg:flex-col lg:space-y-1">
                <label className="flex items-center gap-2 cursor-pointer p-1.5 lg:p-2 rounded-xl hover:bg-[#f0f5fa] transition-colors border border-gray-100/50 lg:border-none">
                  <input
                    type="radio"
                    name="category"
                    value="all"
                    checked={selectedCategory === 'all'}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedSubcategory('all');
                    }}
                    className="w-4 h-4 text-[#0f2a4a] accent-[#0f2a4a]"
                  />
                  <span className="text-gray-700 font-medium text-xs lg:text-sm">All Categories</span>
                </label>
                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer p-1.5 lg:p-2 rounded-xl hover:bg-[#f0f5fa] transition-colors border border-gray-100/50 lg:border-none">
                    <input
                      type="radio"
                      name="category"
                      value={cat.id}
                      checked={selectedCategory === cat.id}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setSelectedSubcategory('all');
                      }}
                      className="w-4 h-4 text-[#0f2a4a] accent-[#0f2a4a]"
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
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 lg:p-2 rounded-xl hover:bg-[#f0f5fa] transition-colors border border-gray-100/50 lg:border-none">
                    <input
                      type="radio"
                      name="subcategory"
                      value="all"
                      checked={selectedSubcategory === 'all'}
                      onChange={(e) => setSelectedSubcategory(e.target.value)}
                      className="w-4 h-4 text-[#0f2a4a] accent-[#0f2a4a]"
                    />
                    <span className="text-gray-700 font-medium text-xs lg:text-sm">All</span>
                  </label>
                  {availableSubcategories.map(sub => (
                    <label key={sub} className="flex items-center gap-2 cursor-pointer p-1.5 lg:p-2 rounded-xl hover:bg-[#f0f5fa] transition-colors border border-gray-100/50 lg:border-none">
                      <input
                        type="radio"
                        name="subcategory"
                        value={sub}
                        checked={selectedSubcategory === sub}
                        onChange={(e) => setSelectedSubcategory(e.target.value)}
                        className="w-4 h-4 text-[#0f2a4a] accent-[#0f2a4a]"
                      />
                      <span className="text-gray-700 font-medium text-xs lg:text-sm truncate">{sub}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price Slider */}
            <div>
              <h4 className="font-bold mb-2 text-gray-800 text-xs md:text-sm uppercase tracking-wider">Price: ₹{priceRange}</h4>
              <input
                type="range"
                min="100"
                max="20000"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-[#0f2a4a]"
              />
            </div>

            {/* Sort */}
            <div>
              <h4 className="font-bold mb-2 text-gray-800 text-xs md:text-sm uppercase tracking-wider">Sort By</h4>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-[#0f2a4a] focus:ring-4 focus:ring-[#0f2a4a]/5 bg-white text-gray-700"
              >
                <option value="default">Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-grow">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-10">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <span className="text-5xl block mb-4">🔍</span>
              <p className="text-lg text-gray-500 font-medium font-serif">No products found matching filters.</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSubcategory('all');
                  setPriceRange(20000);
                  setSortBy('default');
                }}
                className="mt-4 text-xs font-bold text-[#0f2a4a] hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Products;
