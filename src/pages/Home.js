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
  const [activeFaq, setActiveFaq] = useState(null);

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
            Exquisite German Silver, One Gram Gold & Panchaloha Jewellery Designed with Care
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

      {/* Flash Sale Countdown Timer Announcement */}
      <section className="bg-gradient-to-r from-[#d4af37] to-[#c49d2f] text-[#0b1a30] py-4 shadow-inner relative z-10 select-none text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <span className="font-extrabold text-sm md:text-base uppercase tracking-wider text-[#0b1a30]">
              Flash Sale: 10% OFF site-wide! Code: <span className="bg-[#0b1a30] text-white px-2.5 py-1 rounded font-mono select-all text-xs font-black">FLASH10</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#0b1a30]/85 mr-2">ENDS IN:</span>
            <div className="flex gap-1.5 font-mono text-sm">
              <span className="bg-[#0b1a30] text-white px-3 py-1.5 rounded-xl font-bold">{String(countdown.hours).padStart(2, '0')}h</span>
              <span className="font-bold text-[#0b1a30] self-center">:</span>
              <span className="bg-[#0b1a30] text-white px-3 py-1.5 rounded-xl font-bold">{String(countdown.minutes).padStart(2, '0')}m</span>
              <span className="font-bold text-[#0b1a30] self-center">:</span>
              <span className="bg-[#0b1a30] text-white px-3 py-1.5 rounded-xl font-bold">{String(countdown.seconds).padStart(2, '0')}s</span>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Category Grid */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-gray-800 mb-8 md:mb-12 font-serif">Shop by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {categories.map(category => {
              let iconSvg = null;
              if (category.id === 'german-silver') {
                iconSvg = (
                  <svg className="w-12 h-12 text-[#0f2a4a] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5c.667 1 2 2.5 2 4.5 0 2.5-2 4-2 4s-2-1.5-2-4c0-2 1.333-3.5 2-4.5zM4 14.5c0-1.5 1-3.5 3-4.5m10 4.5c0-1.5-1-3.5-3-4.5M3 15h18c0 3-4 5-9 5s-9-2-9-5z" />
                  </svg>
                );
              } else if (category.id === 'one-gram-gold') {
                iconSvg = (
                  <svg className="w-12 h-12 text-[#d4af37] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 3c1.5 5 4.5 9 6 9s4.5-4 6-9M12 12l-2 3.5h4L12 12zm-3-6h6M8 8h8" />
                  </svg>
                );
              } else if (category.id === 'panchaloha') {
                iconSvg = (
                  <svg className="w-12 h-12 text-[#8b5a2b] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2L4 7h16L12 2zm-6 5v10m12-10v10M2 17h20M5 21h14M12 9c-1 0-2 1-2 2 0 1.5 2 2.5 2 3.5m0-5.5c1 0 2 1 2 2 0 1.5-2 2.5-2 3.5" />
                  </svg>
                );
              } else if (category.id === 'gifts') {
                iconSvg = (
                  <svg className="w-12 h-12 text-[#e74c3c] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12v8H4v-8m16 0H4m16 0a2 2 0 002-2V8a2 2 0 00-2-2h-3.82c-.88-.88-2.3-1-3.18-.18L12 7.02l-1.00-1.20c-.88-.82-2.30-.70-3.18.18H4a2 2 0 00-2 2v2a2 2 0 002 2m16 0H4m8-6v14" />
                  </svg>
                );
              }
              
              return (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className="bg-white rounded-3xl elegant-shadow p-6 md:p-8 text-center hover:shadow-2xl transition-all duration-400 transform hover:-translate-y-2 border border-gray-50 flex flex-col justify-between min-h-[220px]"
                >
                  <div className="flex flex-col items-center justify-center flex-1">
                    <div className="mb-5 select-none p-4 bg-gray-50 rounded-2xl border border-gray-100/60 group-hover:bg-white transition-all">
                      {iconSvg}
                    </div>
                    <h3 className="text-base md:text-lg font-black text-gray-800 font-serif leading-tight">{category.name}</h3>
                  </div>
                  <p className="text-[#0f2a4a] text-[10px] font-bold mt-4 uppercase tracking-wider">
                    Explore →
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Occasion-based Collections */}
      <section className="py-12 md:py-20 bg-[#fdfaf6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-gray-800 mb-2 font-serif">Curated for Occasions</h2>
          <p className="text-center text-gray-500 text-xs md:text-sm mb-10 md:mb-16">Traditional South Indian designs handpicked for your most celebrated milestones</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Wedding Season */}
            <Link 
              to="/products?category=german-silver" 
              className="group relative rounded-3xl overflow-hidden elegant-shadow aspect-[4/3] cursor-pointer"
            >
              <img 
                src="https://images.unsplash.com/photo-1605722243979-fe0be8158232?w=600&auto=format&fit=crop&q=80" 
                alt="Wedding Season" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-8 text-left">
                <span className="text-[10px] font-bold text-[#d4af37] tracking-widest uppercase mb-1">Bridal & Gifting</span>
                <h3 className="text-lg md:text-2xl font-bold text-white font-serif">👰 Wedding & Bridal Season</h3>
                <p className="text-xs text-white/80 mt-1.5 leading-relaxed">Exquisite German Silver plates, bowls, gift sets, and heavy bridal chokers.</p>
              </div>
            </Link>

            {/* Ugadi & Diwali Festivals */}
            <Link 
              to="/products?category=panchaloha" 
              className="group relative rounded-3xl overflow-hidden elegant-shadow aspect-[4/3] cursor-pointer"
            >
              <img 
                src="https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&auto=format&fit=crop&q=80" 
                alt="Festive Celebrations" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-8 text-left">
                <span className="text-[10px] font-bold text-[#d4af37] tracking-widest uppercase mb-1">Festive Sparkle</span>
                <h3 className="text-lg md:text-2xl font-bold text-white font-serif">🪔 Ugadi & Diwali Celebrations</h3>
                <p className="text-xs text-white/80 mt-1.5 leading-relaxed">Panchaloha rings, necklaces, and traditional One Gram Gold necklaces to invite prosperity.</p>
              </div>
            </Link>

            {/* Everyday Gifting */}
            <Link 
              to="/products?category=gifts" 
              className="group relative rounded-3xl overflow-hidden elegant-shadow aspect-[4/3] cursor-pointer"
            >
              <img 
                src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80" 
                alt="Gifting & Housewarming" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-8 text-left">
                <span className="text-[10px] font-bold text-[#d4af37] tracking-widest uppercase mb-1">Shubh Gifting</span>
                <h3 className="text-lg md:text-2xl font-bold text-white font-serif">🎁 Gifting & Housewarming</h3>
                <p className="text-xs text-white/80 mt-1.5 leading-relaxed">Premium gift articles, silver-plated sets, and customized luxury boxes for housewarming.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* WhatsApp Chat & Catalog Callout Banner */}
      <section className="py-8 bg-gradient-to-r from-green-500 to-green-600 text-white select-none text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="text-center lg:text-left">
            <h3 className="text-xl md:text-2xl font-extrabold">💬 Order Direct on WhatsApp</h3>
            <p className="text-xs md:text-sm text-green-50 mt-1 max-w-2xl">Prefer ordering through messaging? Chat directly with us, request real-time video clips of jewelry, or share screenshots of items you love!</p>
          </div>
          <a 
            href="https://wa.me/919966144888?text=Hi%20Srigovinda%20Collections,%20I'm%20interested%20in%20viewing%20your%20jewellery%20catalog." 
            target="_blank" 
            rel="noreferrer"
            className="bg-white text-green-600 hover:bg-green-50 px-6 py-3.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-300 shadow-md flex items-center gap-2 hover:scale-[1.03]"
          >
            <span>Open WhatsApp Catalog</span>
            <span>→</span>
          </a>
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

      {/* Video & Reels Gallery showcasing Jewelry on Models */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-gray-800 mb-2 font-serif">Style Reels & Lookbooks</h2>
          <p className="text-center text-gray-500 text-xs md:text-sm mb-10 md:mb-16">See our collections styled live on models for wedding wear inspiration</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Traditional German Silver Choker Set",
                desc: "Styled for grand wedding housewarming events.",
                url: "https://assets.mixkit.co/videos/preview/mixkit-woman-showing-silver-rings-41220-large.mp4"
              },
              {
                title: "One Gram Gold Kasu Mala Look",
                desc: "Draped elegantly on silk sarees for Ugadi festivals.",
                url: "https://assets.mixkit.co/videos/preview/mixkit-girl-wearing-golden-jewelry-41221-large.mp4"
              },
              {
                title: "Festive Panchaloha Kada & Rings",
                desc: "Elegant stackable rings styled with modern outfits.",
                url: "https://assets.mixkit.co/videos/preview/mixkit-woman-showing-silver-rings-41220-large.mp4"
              }
            ].map((reel, idx) => (
              <div key={idx} className="bg-white rounded-3xl elegant-shadow overflow-hidden border border-gray-100 flex flex-col justify-between h-full">
                <div className="relative aspect-[9/16] bg-black overflow-hidden group">
                  <video 
                    src={reel.url} 
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-5 text-left">
                    <span className="text-[9px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full w-max mb-2 animate-pulse uppercase">Live Lookbook</span>
                    <h4 className="text-sm font-black text-white">{reel.title}</h4>
                    <p className="text-[10px] text-gray-300 mt-1 leading-normal">{reel.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* "As Seen on Instagram" Shoppable Tiles */}
      <section className="py-12 md:py-20 bg-[#faf8f5] border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-gray-800 mb-2 font-serif">As Seen on Instagram</h2>
          <p className="text-center text-gray-500 text-xs md:text-sm mb-10 md:mb-16">Follow <a href="https://instagram.com/srigovindacollections" target="_blank" rel="noreferrer" className="text-[#0f2a4a] hover:underline font-bold">@srigovindacollections</a> and shop tagged favorites!</p>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                handle: "@srigovindacollections",
                img: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&auto=format&fit=crop&q=80",
                caption: "Traditional One Gram Gold haram styled with fresh jasmine flowers. 🌸✨",
                link: "/products?category=one-gram-gold"
              },
              {
                handle: "@srigovindacollections",
                img: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=400&auto=format&fit=crop&q=80",
                caption: "Antique German Silver jewelry cases and plates for luxury gifting. 🎁💍",
                link: "/products?category=german-silver"
              },
              {
                handle: "@srigovindacollections",
                img: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&auto=format&fit=crop&q=80",
                caption: "The timeless Panchaloha ring set, bringing positive vibes and traditional luster. 🪔💍",
                link: "/products?category=panchaloha"
              },
              {
                handle: "@srigovindacollections",
                img: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&auto=format&fit=crop&q=80",
                caption: "Grand festive gift boxes for Ugadi housewarmings. Order on WhatsApp! 📦💬",
                link: "/products?category=gifts"
              }
            ].map((post, idx) => (
              <div key={idx} className="bg-white rounded-3xl elegant-shadow overflow-hidden border border-gray-100 text-left flex flex-col justify-between group">
                <div>
                  <div className="p-4 flex items-center gap-2 border-b border-gray-50">
                    <div className="w-7.5 h-7.5 rounded-full bg-[#0f2a4a] text-white flex items-center justify-center font-bold text-[9px] select-none">SG</div>
                    <span className="text-[10px] font-bold text-gray-800">{post.handle}</span>
                  </div>
                  <div className="relative aspect-square overflow-hidden cursor-pointer" onClick={() => window.open(post.link, '_self')}>
                    <img 
                      src={post.img} 
                      alt="Instagram Post" 
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-white text-gray-900 text-[10px] font-extrabold px-3 py-2 rounded-xl shadow-lg uppercase tracking-wider">Shop Item</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] text-gray-600 leading-normal line-clamp-2">{post.caption}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog & Style Guide Teaser */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-4xl font-bold text-center text-gray-800 mb-2 font-serif">Style Guides & Inspiration</h2>
          <p className="text-center text-gray-500 text-xs md:text-sm mb-10 md:mb-16">Tips and guides from style experts on how to choose, pair, and style premium traditional jewelry</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {[
              {
                title: "How to Style Your Wedding Gifting Set: The Ultimate Guide",
                desc: "Planning a wedding? Discover how to choose matching German Silver plates, gifting sets, and accessory pieces that leave a premium lasting impression.",
                img: "https://images.unsplash.com/photo-1605722243979-fe0be8158232?w=600&auto=format&fit=crop&q=80",
                readTime: "5 min read"
              },
              {
                title: "Diwali & Ugadi Jewelry: Styling Traditional Panchaloha for Festivals",
                desc: "Learn the traditional value of five-metal alloy rings and kasu harams, and how to style them with silk Kanjeevarams for South Indian festivals.",
                img: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&auto=format&fit=crop&q=80",
                readTime: "4 min read"
              }
            ].map((blog, idx) => (
              <div key={idx} className="bg-white rounded-3xl elegant-shadow overflow-hidden border border-gray-100 text-left flex flex-col justify-between group">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img src={blog.img} alt={blog.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103" />
                  <span className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-[9px] font-bold text-[#0f2a4a] px-2.5 py-1 rounded-full shadow-sm">{blog.readTime}</span>
                </div>
                <div className="p-6 md:p-8 space-y-3">
                  <h4 className="text-base md:text-xl font-bold text-gray-800 font-serif leading-snug group-hover:text-[#0f2a4a] transition-colors">{blog.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{blog.desc}</p>
                  <Link to="/products" className="inline-block text-xs font-bold text-[#0f2a4a] hover:underline pt-2">
                    Read Full Article →
                  </Link>
                </div>
              </div>
            ))}
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

      {/* 🙋 Customer FAQ Accordion Section */}
      <section className="py-12 md:py-20 bg-[#fbf9f6] border-t border-b border-gray-100/50">
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
