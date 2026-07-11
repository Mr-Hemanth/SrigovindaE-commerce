'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs } from 'firebase/firestore';

function ProductCard({ product, ratingOverride }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [ratingStats, setRatingStats] = useState({ avg: '5.0', count: 0 });
  const [imgSrc, setImgSrc] = useState(product.image);

  // If a parent already fetched ratings in bulk (see useProductRatings), use that instead of
  // this card running its own Firestore query — avoids an N+1 query per grid of cards.
  useEffect(() => {
    if (ratingOverride !== undefined) return;
    let active = true;
    const fetchStats = async () => {
      try {
        const q = query(collection(db, 'reviews'), where('productId', '==', product.id));
        const snap = await getDocs(q);
        if (!active) return;

        if (!snap.empty) {
          const list = snap.docs.map(d => d.data());
          const sum = list.reduce((acc, r) => acc + r.rating, 0);
          setRatingStats({
            avg: (sum / list.length).toFixed(1),
            count: list.length
          });
        }
      } catch (err) {
        console.warn('Error loading card ratings:', err);
      }
    };
    fetchStats();
    return () => { active = false; };
  }, [product.id, ratingOverride]);

  const displayedRating = ratingOverride !== undefined ? { avg: ratingOverride.avg, count: ratingOverride.count } : ratingStats;

  const handleWishlistClick = () => {
    if (!currentUser) {
      router.push('/login');
    } else {
      toggleWishlist(product);
    }
  };

  const handleAddToCart = () => {
    if (!currentUser) {
      router.push('/login');
    } else {
      addToCart(product);
      showNotification(`${product.name} added to your cart successfully!`, 'success');
    }
  };

  const hasDiscount = product.discountedPrice !== undefined && product.discountedPrice !== null && product.discountedPrice !== '' && Number(product.discountedPrice) > 0;
  const discountPercentage = hasDiscount ? Math.round(((product.price - product.discountedPrice) / product.price) * 100) : 0;

  return (
    <div className="bg-white rounded-3xl elegant-shadow overflow-hidden hover:scale-[1.02] transition-all duration-300 ease-out border border-gray-50/50 hover:border-brand-navy-900/20 relative group animate-fade-in flex flex-col justify-between h-full">
      <div className="relative h-48 md:h-64 cursor-pointer overflow-hidden" onClick={() => router.push(`/product/${product.id}`)}>
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          onError={() => setImgSrc("https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3")}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Discount Badge Ribbon */}
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-gradient-to-r from-brand-gold-500 to-brand-gold-600 text-brand-navy-950 font-black text-[8px] md:text-[9px] tracking-wider uppercase px-2 py-0.5 md:px-2.5 md:py-1 rounded-full shadow-md z-10 border border-brand-gold-600/20">
            SAVE {discountPercentage}%
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleWishlistClick();
          }}
          aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isInWishlist(product.id)}
          className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all duration-300 hover:scale-110 z-10"
        >
          {isInWishlist(product.id) ? (
            <svg className="w-4 h-4 md:w-5 md:h-5 text-[#e74c3c]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
        </button>
      </div>
      
      <div className="p-4 md:p-6 flex flex-col justify-between flex-grow">
        <div>
          <span className="text-[9px] md:text-[10px] font-bold text-brand-navy-900 uppercase tracking-widest">{product.category.replace('-', ' ')}</span>
          <h3 
            onClick={() => router.push(`/product/${product.id}`)}
            className="mt-1.5 text-sm md:text-lg font-bold text-gray-800 font-serif cursor-pointer hover:text-brand-navy-900 transition-colors line-clamp-1 leading-snug"
          >
            {product.name}
          </h3>
          
          {/* Star Rating Badge */}
          {displayedRating.count > 0 && (
            <div className="flex items-center gap-1 mt-1 select-none">
              <span className="text-brand-gold-700 text-[11px]">★</span>
              <span className="text-[11px] font-bold text-gray-700">{displayedRating.avg}</span>
              <span className="text-[9px] text-gray-500">({displayedRating.count})</span>
            </div>
          )}

          <p className="mt-1.5 text-gray-500 text-[10px] md:text-xs leading-relaxed line-clamp-2">{product.description}</p>
        </div>

        <div className="mt-4 flex items-center justify-between pt-3.5 border-t border-gray-50">
          <div className="flex items-baseline gap-1">
            {hasDiscount ? (
              <>
                <span className="text-base md:text-xl font-black text-brand-navy-900">₹{Number(product.discountedPrice).toFixed(0)}</span>
                <span className="text-gray-400 line-through text-[10px] md:text-[11px] font-medium">₹{Number(product.price).toFixed(0)}</span>
              </>
            ) : (
              <span className="text-base md:text-xl font-black text-brand-navy-900">₹{Number(product.price).toFixed(0)}</span>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            className="bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg md:rounded-xl hover:from-brand-navy-800 hover:to-brand-navy-900 transition-all duration-300 font-semibold text-[10px] md:text-xs shadow-md hover:shadow-lg"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;