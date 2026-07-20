'use client';

import React, { useState, useEffect, use } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import ProductCard from '@/components/ProductCard';
import { trackViewItem } from '@/lib/analytics';
import { useProductRatings } from '@/lib/hooks/useProductRatings';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';

function ProductDetails({ params, initialProduct = null }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();

  const { cart, addToCart, updateQuantity } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const ratingsById = useProductRatings();

  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  const [quantity, setQuantity] = useState(1);
  const [addingState, setAddingState] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(initialProduct?.variants?.[0] || null);

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState('0.0');
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Image & Related State
  const [activeImage, setActiveImage] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: 'center center', transform: 'scale(1)' });

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(1.8)'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)'
    });
  };

  // Touch devices don't have hover, so the zoom only makes sense while a finger is actually
  // on the image — zoom to the touch point while held, and snap back the instant it's released.
  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    if (!touch) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((touch.clientX - left) / width) * 100;
    const y = ((touch.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(1.8)'
    });
  };

  const handleTouchEnd = () => {
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)'
    });
  };

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  // Portal target must only resolve on the client (SSR has no document); mounting it once here
  // rather than conditionally creating the portal node each open avoids a first-paint issue where
  // a freshly-inserted fixed-position node's background can be skipped on its very first frame.
  const [lightboxMounted, setLightboxMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-mount flag, no cascading update
    setLightboxMounted(true);
  }, []);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') setIsLightboxOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLightboxOpen]);

  const [notifyContact, setNotifyContact] = useState('');
  const [isNotifiedSubmitted, setIsNotifiedSubmitted] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);

  // Review submission state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Automatically pre-fill contact details if logged in. Kept as an effect
  // (not derived during render) so the user can still edit/clear the field afterward.
  useEffect(() => {
    if (currentUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time seed of an editable field from auth state
      setNotifyContact(currentUser.email || currentUser.phone || '');
    }
  }, [currentUser]);

  const handleNotifyMe = async (e) => {
    e.preventDefault();
    if (!notifyContact.trim()) return;
    setNotifyLoading(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        productId: id,
        productName: product?.name || 'Premium Jewellery',
        contact: notifyContact.trim(),
        uid: currentUser ? currentUser.uid : 'Guest',
        createdAt: new Date().toISOString(),
        notified: false
      });
      setIsNotifiedSubmitted(true);
      showNotification('Thank you! You will be notified as soon as this item is restocked.', 'success');
    } catch (err) {
      console.error('Error saving stock notify request:', err);
      showNotification('Failed to submit request. Please try again.', 'error');
    }
    setNotifyLoading(false);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');

    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError('Please select a star rating.');
      return;
    }
    if (!reviewComment.trim()) {
      setReviewError('Please write a short review before submitting.');
      return;
    }

    setSubmittingReview(true);
    try {
      const newReview = {
        productId: product.id,
        userId: currentUser.uid,
        author: currentUser.name || currentUser.displayName || 'Customer',
        rating: reviewRating,
        comment: reviewComment.trim(),
        createdAt: new Date(),
      };
      const docRef = await addDoc(collection(db, 'reviews'), newReview);

      const updatedReviews = [{ id: docRef.id, ...newReview }, ...reviews];
      setReviews(updatedReviews);
      const sum = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
      setAvgRating((sum / updatedReviews.length).toFixed(1));

      setReviewRating(0);
      setReviewComment('');
      showNotification('Thank you! Your review has been posted.', 'success');
    } catch (err) {
      console.error('Error submitting review:', err);
      setReviewError('Could not submit your review. Please try again.');
    }
    setSubmittingReview(false);
  };

  // Server-rendered initialProduct already covers the common case (fast first paint, main
  // image starts loading immediately); this only hits Firestore client-side as a fallback when
  // that wasn't available (e.g. local dev without the Admin SDK configured).
  useEffect(() => {
    if (initialProduct) return;
    (async () => {
      try {
        const productDoc = await getDoc(doc(db, 'products', id));
        if (productDoc.exists()) {
          const data = productDoc.data();
          setProduct({ id: productDoc.id, ...data });
          setActiveImage(data.image || '');
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.warn('ProductDetails fetch failed:', err);
        setProduct(null);
      }
      setLoading(false);
    })();
  }, [id, initialProduct]);

  useEffect(() => {
    if (product) trackViewItem(product);
  }, [product]);

  // Default to the first variant once the product (and its variants) are known — covers the
  // fallback client-fetch path where product isn't available on the very first render.
  useEffect(() => {
    if (product?.variants?.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time default selection once variant data arrives
      setSelectedVariant(product.variants[0]);
    }
  }, [product]);

  // Log viewed product to localStorage for "Recently Viewed" section
  useEffect(() => {
    if (!product) return;
    try {
      const stored = localStorage.getItem('recently_viewed');
      let list = stored ? JSON.parse(stored) : [];

      list = list.filter(item => item.id !== product.id);
      list.unshift({
        id: product.id,
        name: product.name,
        image: product.image,
        category: product.category || '',
        price: product.price,
        discountedPrice: product.discountedPrice || '',
        description: product.description || '',
        isActive: product.isActive !== false
      });
      list = list.slice(0, 4);
      localStorage.setItem('recently_viewed', JSON.stringify(list));
    } catch (err) {
      console.warn('Recently viewed storage error:', err);
    }
  }, [product]);

  // Load related products
  useEffect(() => {
    if (!product || !product.category) return;

    const fetchRelated = async () => {
      try {
        const q = query(
          collection(db, 'products'),
          where('category', '==', product.category)
        );
        const snap = await getDocs(q);
        let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter out current product & inactive products
        list = list.filter(p => p.id !== product.id && p.isActive !== false);

        // Limit to 4 items
        setRelatedProducts(list.slice(0, 4));
      } catch (err) {
        console.warn('Error loading related products:', err);
      }
    };

    fetchRelated();
  }, [product]);

  // Load reviews dynamically
  useEffect(() => {
    if (!product) return;

    const fetchReviews = async () => {
      try {
        const q = query(collection(db, 'reviews'), where('productId', '==', product.id));
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort newest first
        list.sort((a, b) => {
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bDate - aDate;
        });

        setReviews(list);
        if (list.length > 0) {
          const sum = list.reduce((acc, r) => acc + r.rating, 0);
          setAvgRating((sum / list.length).toFixed(1));
        } else {
          setAvgRating('0.0');
        }
        localStorage.setItem(`reviews_${product.id}`, JSON.stringify(list));
      } catch (err) {
        console.warn('Reviews loading offline. Loading cached:', err);
        const cached = localStorage.getItem(`reviews_${product.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setReviews(parsed);
          const sum = parsed.reduce((acc, r) => acc + r.rating, 0);
          setAvgRating(parsed.length > 0 ? (sum / parsed.length).toFixed(1) : '0.0');
        }
      }
      setReviewsLoading(false);
    };

    fetchReviews();
  }, [product]);

  const handleWishlistToggle = () => {
    if (!currentUser) {
      router.push('/login');
    } else {
      toggleWishlist(product);
    }
  };

  const handleAddToCart = () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (product.variants?.length > 0 && !selectedVariant) {
      showNotification('Please select an option before adding to cart.', 'error');
      return;
    }

    setAddingState(true);
    const variant = product.variants?.length > 0 ? selectedVariant : null;
    const variantId = variant?.id || null;
    const existingCartItem = cart.find(item => item.id === product.id && (item.variantId || null) === variantId);
    if (existingCartItem) {
      updateQuantity(product.id, existingCartItem.quantity + quantity, variantId);
    } else {
      for (let i = 0; i < quantity; i++) {
        addToCart(product, variant);
      }
    }

    setTimeout(() => {
      setAddingState(false);
      showNotification(`${quantity} x ${product.name} added to your cart successfully!`, 'success');
    }, 500);
  };

  const handleBuyNow = () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (product.variants?.length > 0 && !selectedVariant) {
      showNotification('Please select an option before adding to cart.', 'error');
      return;
    }

    const variant = product.variants?.length > 0 ? selectedVariant : null;
    const variantId = variant?.id || null;
    const existingCartItem = cart.find(item => item.id === product.id && (item.variantId || null) === variantId);
    if (existingCartItem) {
      updateQuantity(product.id, existingCartItem.quantity + quantity, variantId);
    } else {
      for (let i = 0; i < quantity; i++) {
        addToCart(product, variant);
      }
    }

    if (!currentUser.phone || !/^\d{10}$/.test(currentUser.phone)) {
      showNotification('Please complete your profile by providing your primary 10-digit contact mobile number before proceeding to checkout.', 'error');
      router.push('/profile');
    } else {
      router.push('/checkout');
    }
  };

  // Review submission is handled separately after purchase.

  const incrementQty = () => {
    const stockCap = product.variants?.length > 0 ? (selectedVariant?.stock || 0) : (product.stock || 10);
    if (quantity < stockCap) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQty = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-navy-900"></div>
      </div>
    );
  }

  if (!product || product.isActive === false) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <span className="text-5xl block mb-4">🔍</span>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 font-serif">Product Not Available</h2>
        <p className="text-gray-500 mb-8 text-sm">The jewellery piece you are looking for does not exist, is disabled, or has been removed from our catalog.</p>
        <Link
          href="/products"
          className="bg-brand-navy-900 hover:bg-brand-navy-800 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition-all"
        >
          Back to Shop Catalog
        </Link>
      </div>
    );
  }

  const isFavorite = isInWishlist(product.id);

  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const basePrice = product.discountedPrice !== undefined && product.discountedPrice !== null && product.discountedPrice !== '' && Number(product.discountedPrice) > 0
    ? Number(product.discountedPrice)
    : Number(product.price);
  const effectivePrice = basePrice + (hasVariants ? (selectedVariant?.priceDelta || 0) : 0);
  const effectiveStock = hasVariants
    ? (selectedVariant?.stock !== undefined && selectedVariant?.stock !== null ? Number(selectedVariant.stock) : 0)
    : (product.stock !== undefined && product.stock !== null ? Number(product.stock) : 10);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Breadcrumbs */}
      <div className="mb-8 animate-fade-in">
        <Link
          href="/products"
          className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-brand-navy-900 transition-colors gap-2"
        >
          ← Back to Shop Catalog
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white rounded-3xl elegant-shadow p-6 md:p-10 border border-gray-100 mb-16 animate-fade-in">

        {/* Left Column: Image Gallery preview */}
        <div className="flex flex-col space-y-4">
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => setIsLightboxOpen(true)}
            role="button"
            tabIndex={0}
            aria-label="Open full-size product image"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsLightboxOpen(true); } }}
            className="relative h-80 sm:h-[400px] md:h-[480px] overflow-hidden rounded-2xl border border-gray-100/60 bg-gray-50 flex items-center justify-center cursor-zoom-in"
          >
            <Image
              src={optimizeCloudinaryUrl(activeImage || product.image, { width: 900 })}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{
                ...zoomStyle,
                transition: 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform-origin 0.05s ease-out'
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&auto=format&fit=crop&q=60";
              }}
              className="object-cover rounded-2xl"
            />

            <button
              onClick={(e) => { e.stopPropagation(); handleWishlistToggle(); }}
              aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={isFavorite}
              className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-3.5 rounded-full shadow-lg hover:bg-white transition-all hover:scale-110 z-10"
            >
              {isFavorite ? (
                <svg className="w-7 h-7 text-[#e74c3c]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </button>
          </div>

          {/* Thumbnails Row */}
          {product.images && Array.isArray(product.images) && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-1 scrollbar-thin select-none">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    activeImage === img ? 'border-brand-navy-900 scale-95 shadow-sm' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <Image
                    src={optimizeCloudinaryUrl(img, { width: 128 })}
                    alt={`Preview ${idx + 1}`}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {lightboxMounted && createPortal(
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 transition-opacity duration-150 ${
              isLightboxOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
            onClick={() => setIsLightboxOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Full-size product image"
            aria-hidden={!isLightboxOpen}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
              aria-label="Close full-size image"
              tabIndex={isLightboxOpen ? 0 : -1}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative w-full h-full max-w-4xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
              {lightboxMounted && (
                <Image
                  src={optimizeCloudinaryUrl(activeImage || product.image, { width: 1600 })}
                  alt={product.name}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&auto=format&fit=crop&q=60";
                  }}
                />
              )}
            </div>
          </div>,
          document.body
        )}

        {/* Right Column: Spec / Cart Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="bg-brand-cream-100 text-brand-navy-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-brand-navy-900/10">
                {product.category?.replace('-', ' ')}
              </span>
              {product.subcategory && (
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium capitalize">
                  {product.subcategory}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 font-serif leading-tight">
              {product.name}
            </h1>

            {/* Rating Stars Summary */}
            <div className="flex items-center gap-2">
              <div className="flex text-yellow-400 text-lg">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i}>{reviews.length > 0 && i < Math.round(Number(avgRating)) ? '★' : '☆'}</span>
                ))}
              </div>
              <span className="text-xs text-gray-500 font-semibold font-mono">
                {reviews.length > 0 ? `${avgRating} (${reviews.length} customer reviews)` : 'No reviews yet'}
              </span>
            </div>

            {/* Variant Selector */}
            {hasVariants && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Options</span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      aria-pressed={selectedVariant?.id === variant.id}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                        selectedVariant?.id === variant.id
                          ? 'border-brand-navy-900 bg-brand-navy-900 text-white'
                          : 'border-gray-200 text-gray-700 hover:border-brand-navy-900/50'
                      }`}
                    >
                      {variant.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing / Stock */}
            <div className="flex items-baseline gap-4 pt-2">
              {hasVariants ? (
                <span className="text-3xl font-black text-brand-navy-900">₹{effectivePrice.toFixed(0)}</span>
              ) : product.discountedPrice !== undefined && product.discountedPrice !== null && product.discountedPrice !== '' && Number(product.discountedPrice) > 0 ? (
                <>
                  <span className="text-3xl font-black text-brand-navy-900">₹{product.discountedPrice}</span>
                  <span className="text-gray-400 line-through text-lg">₹{product.price}</span>
                </>
              ) : (
                <span className="text-3xl font-black text-brand-navy-900">₹{product.price}</span>
              )}
              <span className={`px-3 py-1 rounded-full text-xxs font-bold uppercase tracking-wider ${
                effectiveStock > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {effectiveStock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
              {product.description}
            </p>
          </div>

          <div className="space-y-6 pt-4 border-t border-gray-100">
            {effectiveStock > 0 ? (
              <>
                {/* Quantity Selector Counter */}
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity</span>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={decrementQty}
                      className="px-4 py-2 bg-gray-50 hover:bg-gray-100 font-bold transition-colors text-gray-600 text-sm"
                    >
                      -
                    </button>
                    <span className="px-5 py-2 text-sm font-bold text-gray-800 min-w-[40px] text-center font-mono">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={incrementQty}
                      className="px-4 py-2 bg-gray-50 hover:bg-gray-100 font-bold transition-colors text-gray-600 text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Double checkout buttons grid */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={addingState}
                    className="flex-1 bg-brand-cream-100 hover:bg-brand-cream-200 text-brand-navy-900 py-4 rounded-xl transition-all duration-300 font-bold text-sm shadow-sm border border-gray-200/50"
                  >
                    {addingState ? 'Adding...' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white py-4 rounded-xl hover:from-brand-navy-800 hover:to-brand-navy-900 transition-all duration-300 font-bold text-sm shadow-lg hover:shadow-xl"
                  >
                    Buy Now
                  </button>
                </div>
              </>
            ) : (
              /* Out of Stock Notify Me form container */
              <div className="bg-red-50/50 border border-red-200/60 p-5 rounded-2xl text-left space-y-4">
                <div>
                  <p className="text-xs text-red-800 font-bold flex items-center gap-1.5 select-none">
                    <span>⏳</span>
                    <span>Temporarily Out of Stock</span>
                  </p>
                  <p className="text-xxs text-gray-500 mt-1 leading-normal">
                    This premium design is currently sold out. Register your email or contact phone number below, and we will contact you directly when it is back in stock!
                  </p>
                </div>

                {isNotifiedSubmitted ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xxs font-bold text-center animate-fade-in">
                    ✓ Request submitted! We will alert you soon.
                  </div>
                ) : (
                  <form onSubmit={handleNotifyMe} className="flex gap-2">
                    <input
                      type="text"
                      value={notifyContact}
                      onChange={(e) => setNotifyContact(e.target.value)}
                      placeholder="Enter Email or Phone number"
                      className="flex-1 px-3 py-2 border-2 border-gray-200 focus:border-brand-navy-900 focus:outline-none rounded-xl text-xs bg-white"
                      required
                    />
                    <button
                      type="submit"
                      disabled={notifyLoading}
                      className="bg-brand-navy-900 hover:bg-brand-navy-800 text-white px-4 py-2.5 rounded-xl text-xxs font-black uppercase tracking-wider transition-colors disabled:opacity-40"
                    >
                      {notifyLoading ? 'Submitting...' : 'Notify Me'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Premium Store Trust Badges */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100 mt-2 select-none">
            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-brand-navy-900/10 transition-colors duration-300">
              <svg className="w-5 h-5 text-brand-gold-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <div>
                <p className="text-[11px] font-black text-gray-800 leading-tight">Premium Artistry</p>
                <p className="text-[9px] text-gray-500 mt-0.5">Authentic German Silver</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-brand-navy-900/10 transition-colors duration-300">
              <svg className="w-5 h-5 text-brand-gold-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <div>
                <p className="text-[11px] font-black text-gray-800 leading-tight">Free Express Shipping</p>
                <p className="text-[9px] text-gray-500 mt-0.5">Delivery Across India</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-brand-navy-900/10 transition-colors duration-300">
              <svg className="w-5 h-5 text-brand-gold-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
              </svg>
              <div>
                <p className="text-[11px] font-black text-gray-800 leading-tight">7-Day Guarantee</p>
                <p className="text-[9px] text-gray-500 mt-0.5">Easy Exchanges & Returns</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-brand-navy-900/10 transition-colors duration-300">
              <svg className="w-5 h-5 text-brand-gold-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="text-[11px] font-black text-gray-800 leading-tight">Secured Payments</p>
                <p className="text-[9px] text-gray-500 mt-0.5">SSL Encrypted Transactions</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Reviews block */}
      <div className="bg-white rounded-3xl elegant-shadow p-8 border border-gray-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 font-serif">Customer Reviews ({reviews.length})</h2>

        {/* Review submission form */}
        <div className="mb-8 p-6 bg-gray-50/60 rounded-2xl border border-gray-100">
          {currentUser ? (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label htmlFor="review-rating" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Your Rating
                </label>
                <div id="review-rating" role="radiogroup" aria-label="Star rating" className="flex gap-1 text-2xl text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const starValue = i + 1;
                    return (
                      <button
                        key={i}
                        type="button"
                        role="radio"
                        aria-checked={reviewRating === starValue}
                        aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
                        onClick={() => setReviewRating(starValue)}
                        onMouseEnter={() => setReviewHoverRating(starValue)}
                        onMouseLeave={() => setReviewHoverRating(0)}
                        className="focus:outline-none focus:ring-2 focus:ring-brand-navy-900 rounded"
                      >
                        {(reviewHoverRating || reviewRating) >= starValue ? '★' : '☆'}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label htmlFor="review-comment" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Your Review
                </label>
                <textarea
                  id="review-comment"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  placeholder="Share your experience with this piece..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-brand-navy-900"
                />
              </div>
              {reviewError && (
                <p role="alert" className="text-xs font-semibold text-red-500">{reviewError}</p>
              )}
              <button
                type="submit"
                disabled={submittingReview}
                className="bg-brand-navy-900 hover:bg-brand-navy-800 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-500 text-center">
              <Link href="/login" className="font-bold text-brand-navy-900 hover:underline">Log in</Link> to write a review for this product.
            </p>
          )}
        </div>

        {reviewsLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-navy-900 mx-auto"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-150 rounded-2xl text-gray-400">
            <span className="text-4xl block mb-2">⭐</span>
            <p className="text-sm font-medium">No reviews yet for this jewelry piece.</p>
          </div>
        ) : (
          <div className="space-y-6 divide-y divide-gray-100 max-h-[500px] overflow-y-auto pr-2">
            {reviews.map((rev) => {
              const date = rev.createdAt?.toDate ? rev.createdAt.toDate() : new Date(rev.createdAt);
              return (
                <div key={rev.id} className="pt-6 first:pt-0 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800 text-sm">{rev.author}</span>
                    <span className="text-xxs text-gray-400 font-mono">
                      {date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex text-yellow-400 text-xs tracking-wider">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>{i < rev.rating ? '★' : '☆'}</span>
                    ))}
                  </div>
                  <p className="text-gray-600 text-xs leading-relaxed break-words">{rev.comment}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Related / Similar Products Section */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-gray-100 pt-16 mt-16">
          <h2 className="text-2xl font-bold text-brand-navy-900 mb-8 font-serif">Similar Jewellery Pieces</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} ratingOverride={ratingsById[p.id] || { avg: '0.0', count: 0 }} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default ProductDetails;
