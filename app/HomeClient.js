'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { categories } from '@/lib/data/products';
import { db } from '@/lib/firebase/client';
import { collection, getDocs } from 'firebase/firestore';
import { useProductRatings } from '@/lib/hooks/useProductRatings';

function Home({ initialFeaturedProducts = [] }) {
  const [featuredProducts, setFeaturedProducts] = useState(initialFeaturedProducts);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [activeFaq, setActiveFaq] = useState(null);
  const ratingsById = useProductRatings();

  // Flash Sale Countdown State
  const [countdown, setCountdown] = useState({ hours: 24, minutes: 0, seconds: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const diff = endOfDay.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown({ hours: 24, minutes: 0, seconds: 0 });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ hours, minutes, seconds });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('recently_viewed');
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, not derivable during render
        setRecentlyViewed(JSON.parse(stored).filter(p => p.isActive !== false));
      }
    } catch (err) {
      console.warn('Failed to load recently viewed:', err);
    }
  }, []);

  useEffect(() => {
    if (initialFeaturedProducts.length > 0) return;
    (async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const prods = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(p => p.isActive !== false);
        setFeaturedProducts(prods.slice(0, 4));
      } catch (err) {
        console.warn('Home page products fetch failed:', err);
      }
    })();
  }, [initialFeaturedProducts]);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-brand-navy-950 to-brand-navy-900 text-white py-12 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h1 className="text-3xl md:text-6xl font-bold font-serif leading-tight">Srigovinda collections</h1>
          <p className="text-sm md:text-2xl opacity-90 max-w-2xl mx-auto leading-relaxed">
            Exquisite German Silver, One Gram Gold & Panchaloha Jewellery Designed with Care
          </p>
          <div className="pt-4">
            <Link
              href="/products"
              className="bg-white text-brand-navy-900 px-6 py-3 md:px-10 md:py-4 rounded-full font-bold text-sm md:text-lg hover:bg-brand-cream-100 transition-all duration-300 shadow-xl hover:shadow-2xl inline-block"
            >
              Explore Our Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Flash Sale Countdown Timer Announcement */}
      <section className="bg-gradient-to-r from-brand-gold-500 to-brand-gold-600 text-brand-navy-950 py-4 shadow-inner relative z-10 select-none text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <span className="font-extrabold text-sm md:text-base uppercase tracking-wider text-brand-navy-950">
              Flash Sale: 10% OFF site-wide! Code: <span className="bg-brand-navy-950 text-white px-2.5 py-1 rounded font-mono select-all text-xs font-black">FLASH10</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-navy-950/85 mr-2">ENDS IN:</span>
            <div className="flex gap-1.5 font-mono text-sm">
              <span className="bg-brand-navy-950 text-white px-3 py-1.5 rounded-xl font-bold">{String(countdown.hours).padStart(2, '0')}h</span>
              <span className="font-bold text-brand-navy-950 self-center">:</span>
              <span className="bg-brand-navy-950 text-white px-3 py-1.5 rounded-xl font-bold">{String(countdown.minutes).padStart(2, '0')}m</span>
              <span className="font-bold text-brand-navy-950 self-center">:</span>
              <span className="bg-brand-navy-950 text-white px-3 py-1.5 rounded-xl font-bold">{String(countdown.seconds).padStart(2, '0')}s</span>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Category Grid */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-gray-800 mb-8 md:mb-12 font-serif">Shop by Category</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
            {categories.map(category => {
              let iconSvg = null;
              if (category.id === 'german-silver') {
                iconSvg = (
                  <svg className="w-7 h-7 md:w-12 md:h-12 text-brand-navy-900 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5c.667 1 2 2.5 2 4.5 0 2.5-2 4-2 4s-2-1.5-2-4c0-2 1.333-3.5 2-4.5zM4 14.5c0-1.5 1-3.5 3-4.5m10 4.5c0-1.5-1-3.5-3-4.5M3 15h18c0 3-4 5-9 5s-9-2-9-5z" />
                  </svg>
                );
              } else if (category.id === 'one-gram-gold') {
                iconSvg = (
                  <svg className="w-7 h-7 md:w-12 md:h-12 text-brand-gold-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 3c1.5 5 4.5 9 6 9s4.5-4 6-9M12 12l-2 3.5h4L12 12zm-3-6h6M8 8h8" />
                  </svg>
                );
              } else if (category.id === 'panchaloha') {
                iconSvg = (
                  <svg className="w-7 h-7 md:w-12 md:h-12 text-[#8b5a2b] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2L4 7h16L12 2zm-6 5v10m12-10v10M2 17h20M5 21h14M12 9c-1 0-2 1-2 2 0 1.5 2 2.5 2 3.5m0-5.5c1 0 2 1 2 2 0 1.5-2 2.5-2 3.5" />
                  </svg>
                );
              } else if (category.id === 'gifts') {
                iconSvg = (
                  <svg className="w-7 h-7 md:w-12 md:h-12 text-[#e74c3c] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12v8H4v-8m16 0H4m16 0a2 2 0 002-2V8a2 2 0 00-2-2h-3.82c-.88-.88-2.3-1-3.18-.18L12 7.02l-1.00-1.20c-.88-.82-2.30-.70-3.18.18H4a2 2 0 00-2 2v2a2 2 0 002 2m16 0H4m8-6v14" />
                  </svg>
                );
              }

              return (
                <Link
                  key={category.id}
                  href={`/products?category=${category.id}`}
                  className="bg-white rounded-2xl md:rounded-3xl elegant-shadow p-3 sm:p-6 md:p-8 text-center hover:shadow-2xl transition-all duration-400 transform hover:-translate-y-2 border border-gray-50 flex flex-col justify-between min-h-[110px] sm:min-h-[180px] md:min-h-[220px]"
                >
                  <div className="flex flex-col items-center justify-center flex-1">
                    <div className="mb-2 sm:mb-5 select-none p-2 sm:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100/60 group-hover:bg-white transition-all">
                      {iconSvg}
                    </div>
                    <h3 className="text-xs sm:text-base md:text-lg font-black text-gray-800 font-serif leading-tight">{category.name}</h3>
                  </div>
                  <p className="text-brand-navy-900 text-[8px] sm:text-[10px] font-bold mt-1.5 sm:mt-4 uppercase tracking-wider">
                    Explore →
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>



      {/* Featured Pieces Grid */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-brand-cream-200 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-8 md:mb-12 text-center font-serif">Featured Pieces</h2>
          {featuredProducts.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">New pieces are on their way — check back soon!</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} ratingOverride={ratingsById[product.id] || { avg: '0.0', count: 0 }} />
              ))}
            </div>
          )}
          <div className="text-center mt-10 md:mt-16">
            <Link
              href="/products"
              className="inline-block bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white px-8 py-3.5 md:px-10 md:py-4 rounded-xl hover:from-brand-navy-800 hover:to-brand-navy-900 transition-all duration-300 font-semibold text-sm md:text-lg shadow-md hover:shadow-xl"
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
                <ProductCard key={product.id} product={product} ratingOverride={ratingsById[product.id] || { avg: '0.0', count: 0 }} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 🙋 Customer FAQ Accordion Section */}
      <section className="py-12 md:py-20 bg-brand-cream-100 border-t border-b border-gray-100/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-gray-800 mb-8 md:mb-12 font-serif">Customer Assistance & Care FAQ</h2>

          <div className="space-y-4">
            {[
              {
                q: "What is Panchaloha jewellery made of?",
                a: "Panchaloha is a sacred five-metal alloy consisting of Gold, Silver, Copper, Zinc, and Iron. It is traditionally crafted under precise temperatures to invite positive energy, spiritual balance, and long-lasting durability."
              },
              {
                q: "How should I clean and care for German Silver jewellery?",
                a: "To ensure your German Silver items preserve their premium antique finish, avoid contact with heavy water, chemical soaps, or perfumes. Gently wipe clean with a soft dry cotton cloth after wearing, and store them inside airtight zip lock pouches."
              },
              {
                q: "What is your shipping schedule and return policy?",
                a: "We offer Free Express shipping across all locations in India. Every order comes with a secure 7-Day return or exchange guarantee. If you receive a damaged article or wish to request replacements, contact us directly within 7 days."
              },
              {
                q: "Are the custom star ratings based on actual data?",
                a: "Yes! All customer reviews and star rating scores displayed on our product description pages are fetched live from our secure cloud database, representing verified user feedbacks submitted after buying."
              }
            ].map((faq, idx) => {
              const isExpanded = activeFaq === idx;
              return (
                <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
                  <button
                    onClick={() => setActiveFaq(isExpanded ? null : idx)}
                    className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50/50 transition-colors focus:outline-none"
                  >
                    <span className="text-xs md:text-sm font-bold text-gray-800">{faq.q}</span>
                    <span className={`text-xs text-gray-400 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="px-6 pb-5 pt-1 text-xxs md:text-xs text-gray-500 leading-relaxed border-t border-gray-50/50 animate-fade-in text-left">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social / Info Block */}
      <section className="py-10 md:py-16 bg-gradient-to-r from-brand-cream-100 to-brand-cream-200">
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
