import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sampleJewelleryProducts } from '../data/products';
import ProductCard from '../components/ProductCard';
import { categories } from '../data/products';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('recently_viewed');
      if (stored) {
        setRecentlyViewed(JSON.parse(stored).filter(p => p.isActive !== false));
      }
    } catch (err) {
      console.warn('Failed to load recently viewed:', err);
    }
  }, []);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        if (querySnapshot.empty) {
          setFeaturedProducts(sampleJewelleryProducts.filter(p => p.isActive !== false).slice(0, 4));
        } else {
          const prods = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(p => p.isActive !== false);
          setFeaturedProducts(prods.slice(0, 4));
        }
      } catch (err) {
        console.warn('Home page products fetch offline. Loading defaults:', err);
        setFeaturedProducts(sampleJewelleryProducts.filter(p => p.isActive !== false).slice(0, 4));
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#0b1a30] to-[#0f2a4a] text-white py-12 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h1 className="text-3xl md:text-6xl font-bold font-serif leading-tight">Srigovinda collections</h1>
          <p className="text-sm md:text-2xl opacity-90 max-w-2xl mx-auto leading-relaxed">
            Exquisite German Silver, One Gram Gold & Panchaloha Jewellery Handcrafted with Love
          </p>
          <div className="pt-4">
            <Link 
              to="/products" 
              className="bg-white text-[#0f2a4a] px-6 py-3 md:px-10 md:py-4 rounded-full font-bold text-sm md:text-lg hover:bg-[#f0f4f8] transition-all duration-300 shadow-xl hover:shadow-2xl inline-block"
            >
              Explore Our Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Shop by Category Grid */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-gray-800 mb-8 md:mb-12 font-serif">Shop by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {categories.map(category => {
              let emoji = '⚜️';
              let desc = '';
              if (category.id === 'german-silver') {
                emoji = '⚜️';
                desc = 'Discover handcrafted silver masterpieces blending antique charm with contemporary design.';
              } else if (category.id === 'one-gram-gold') {
                emoji = '✨';
                desc = 'Explore elegant gold-plated designs crafted with premium shine for festive wear.';
              } else if (category.id === 'panchaloha') {
                emoji = '🪔';
                desc = 'Browse sacred five-metal alloy items designed to bring positivity and prosperity.';
              } else if (category.id === 'gifts') {
                emoji = '🎁';
                desc = 'Find curated premium tokens and presents perfect for celebrating special occasions.';
              }
              
              return (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className="bg-white rounded-3xl elegant-shadow p-6 md:p-8 text-center hover:shadow-2xl transition-all duration-400 transform hover:-translate-y-2 border border-gray-50 flex flex-col justify-between"
                >
                  <div>
                    <div className="text-4xl md:text-5xl mb-4 select-none">
                      {emoji}
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2.5 font-serif">{category.name}</h3>
                    <p className="text-gray-500 text-xxs md:text-xs leading-relaxed max-w-[240px] mx-auto">{desc}</p>
                  </div>
                  {category.subcategories.length > 0 && (
                    <p className="text-[#0f2a4a] text-[10px] font-bold mt-4 uppercase tracking-wider">
                      Explore {category.subcategories.length} Collections →
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Pieces Grid */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-[#f7f2ed] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-8 md:mb-12 text-center font-serif">Featured Pieces</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-10 md:mt-16">
            <Link 
              to="/products" 
              className="inline-block bg-gradient-to-r from-[#0f2a4a] to-[#1b4965] text-white px-8 py-3.5 md:px-10 md:py-4 rounded-xl hover:from-[#1b4965] hover:to-[#0f2a4a] transition-all duration-300 font-semibold text-sm md:text-lg shadow-md hover:shadow-xl"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Recently Viewed Grid Section */}
      {recentlyViewed.length > 0 && (
        <section className="py-12 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-8 md:mb-12 text-center font-serif">Recently Viewed</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10 animate-fade-in">
              {recentlyViewed.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Social / Info Block */}
      <section className="py-10 md:py-16 bg-gradient-to-r from-[#f0f4f8] to-[#eef3f7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h3 className="text-xl md:text-3xl font-bold text-gray-800 font-serif">Follow us on Instagram for Coupons! 📸</h3>
          <p className="text-gray-600 text-xs md:text-base max-w-xl mx-auto leading-relaxed">
            Get amazing discount codes by following our Instagram page. Apply them at checkout for instant savings on your favourite pieces!
          </p>
        </div>
      </section>
    </div>
  );
}

export default Home;
