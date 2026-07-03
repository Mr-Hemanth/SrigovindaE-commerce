import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { sampleJewelleryProducts } from '../data/products';
import ProductCard from '../components/ProductCard';

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();
  
  const { cart, addToCart, updateQuantity } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingState, setAddingState] = useState(false);

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

  // Load product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productDoc = await getDoc(doc(db, 'products', id));
        if (productDoc.exists()) {
          const data = productDoc.data();
          setProduct({ id: productDoc.id, ...data });
          setActiveImage(data.image || '');
        } else {
          const localProd = sampleJewelleryProducts.find(p => p.id === id);
          if (localProd) {
            setProduct(localProd);
            setActiveImage(localProd.image || '');
          } else {
            setProduct(null);
          }
        }
      } catch (err) {
        console.warn('ProductDetails offline fallback:', err);
        const localProd = sampleJewelleryProducts.find(p => p.id === id);
        if (localProd) {
          setProduct(localProd);
          setActiveImage(localProd.image || '');
        } else {
          setProduct(null);
        }
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

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
        
        // Fallback to local array if firestore is empty
        if (list.length === 0) {
          list = sampleJewelleryProducts.filter(
            p => p.category === product.category && p.id !== product.id
          );
        }
        
        // Limit to 4 items
        setRelatedProducts(list.slice(0, 4));
      } catch (err) {
        console.warn('Error loading related products, using fallback:', err);
        const list = sampleJewelleryProducts.filter(
          p => p.category === product.category && p.id !== product.id
        );
        setRelatedProducts(list.slice(0, 4));
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
          setAvgRating('5.0');
        }
        localStorage.setItem(`reviews_${product.id}`, JSON.stringify(list));
      } catch (err) {
        console.warn('Reviews loading offline. Loading cached:', err);
        const cached = localStorage.getItem(`reviews_${product.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setReviews(parsed);
          const sum = parsed.reduce((acc, r) => acc + r.rating, 0);
          setAvgRating(parsed.length > 0 ? (sum / parsed.length).toFixed(1) : '5.0');
        }
      }
      setReviewsLoading(false);
    };

    fetchReviews();
  }, [product]);

  const handleWishlistToggle = () => {
    if (!currentUser) {
      navigate('/login');
    } else {
      toggleWishlist(product);
    }
  };

  const handleAddToCart = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    setAddingState(true);
    const existingCartItem = cart.find(item => item.id === product.id);
    if (existingCartItem) {
      updateQuantity(product.id, existingCartItem.quantity + quantity);
    } else {
      for (let i = 0; i < quantity; i++) {
        addToCart(product);
      }
    }

    setTimeout(() => {
      setAddingState(false);
      showNotification(`${quantity} x ${product.name} added to your cart successfully!`, 'success');
    }, 500);
  };

  // Review submission is handled separately after purchase.

  const incrementQty = () => {
    if (quantity < (product.stock || 10)) {
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0f2a4a]"></div>
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
          to="/products"
          className="bg-[#0f2a4a] hover:bg-[#1b4965] text-white px-6 py-3 rounded-xl font-semibold shadow-md transition-all"
        >
          Back to Shop Catalog
        </Link>
      </div>
    );
  }

  const isFavorite = isInWishlist(product.id);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Breadcrumbs */}
      <div className="mb-8 animate-fade-in">
        <Link 
          to="/products"
          className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-[#0f2a4a] transition-colors gap-2"
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
            className="relative overflow-hidden rounded-2xl border border-gray-100/60 bg-gray-50 flex items-center justify-center cursor-zoom-in"
          >
            <img 
              src={activeImage || product.image} 
              alt={product.name} 
              style={{
                ...zoomStyle,
                transition: 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform-origin 0.05s ease-out'
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&auto=format&fit=crop&q=60";
              }}
              className="w-full h-80 sm:h-[400px] md:h-[480px] object-cover rounded-2xl"
            />
            
            <button
              onClick={handleWishlistToggle}
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
                    activeImage === img ? 'border-[#0f2a4a] scale-95 shadow-sm' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`Preview ${idx + 1}`} 
                    className="w-full h-full object-cover" 
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Spec / Cart Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="bg-[#f0f5fa] text-[#0f2a4a] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-[#0f2a4a]/10">
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
                  <span key={i}>{i < Math.round(Number(avgRating)) ? '★' : '☆'}</span>
                ))}
              </div>
              <span className="text-xs text-gray-500 font-semibold font-mono">
                {avgRating} ({reviews.length} customer reviews)
              </span>
            </div>

            {/* Pricing / Stock */}
            <div className="flex items-baseline gap-4 pt-2">
              {product.discountedPrice !== undefined && product.discountedPrice !== null && product.discountedPrice !== '' && Number(product.discountedPrice) > 0 ? (
                <>
                  <span className="text-3xl font-black text-[#0f2a4a]">₹{product.discountedPrice}</span>
                  <span className="text-gray-400 line-through text-lg">₹{product.price}</span>
                </>
              ) : (
                <span className="text-3xl font-black text-[#0f2a4a]">₹{product.price}</span>
              )}
              <span className={`px-3 py-1 rounded-full text-xxs font-bold uppercase tracking-wider ${
                (product.stock !== undefined && product.stock !== null ? Number(product.stock) : 10) > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {(product.stock !== undefined && product.stock !== null ? Number(product.stock) : 10) > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
              {product.description}
            </p>
          </div>

          <div className="space-y-6 pt-4 border-t border-gray-100">
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

            {/* Cart Trigger Button */}
            <button
              onClick={handleAddToCart}
              disabled={addingState || (product.stock || 0) <= 0}
              className="w-full bg-gradient-to-r from-[#0f2a4a] to-[#1b4965] text-white py-4 rounded-xl hover:from-[#1b4965] hover:to-[#0f2a4a] transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-40"
            >
              {addingState ? 'Adding Item...' : `Add to Cart • ₹${(
                (product.discountedPrice !== undefined && product.discountedPrice !== null && product.discountedPrice !== '' && Number(product.discountedPrice) > 0
                  ? Number(product.discountedPrice)
                  : Number(product.price)) * quantity
              ).toFixed(0)}`}
            </button>
          </div>

          {/* Premium Store Trust Badges */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100 mt-2 select-none">
            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-[#0f2a4a]/10 transition-colors duration-300">
              <svg className="w-5 h-5 text-[#d4af37] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <div>
                <p className="text-[11px] font-black text-gray-800 leading-tight">Handcrafted Artistry</p>
                <p className="text-[9px] text-gray-400 mt-0.5">Authentic German Silver</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-[#0f2a4a]/10 transition-colors duration-300">
              <svg className="w-5 h-5 text-[#d4af37] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <div>
                <p className="text-[11px] font-black text-gray-800 leading-tight">Free Express Shipping</p>
                <p className="text-[9px] text-gray-400 mt-0.5">Delivery Across India</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-[#0f2a4a]/10 transition-colors duration-300">
              <svg className="w-5 h-5 text-[#d4af37] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
              </svg>
              <div>
                <p className="text-[11px] font-black text-gray-800 leading-tight">7-Day Guarantee</p>
                <p className="text-[9px] text-gray-400 mt-0.5">Easy Exchanges & Returns</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-[#0f2a4a]/10 transition-colors duration-300">
              <svg className="w-5 h-5 text-[#d4af37] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="text-[11px] font-black text-gray-800 leading-tight">Secured Payments</p>
                <p className="text-[9px] text-gray-400 mt-0.5">SSL Encrypted Transactions</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Reviews block */}
      <div className="bg-white rounded-3xl elegant-shadow p-8 border border-gray-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 font-serif">Customer Reviews ({reviews.length})</h2>
        
        {reviewsLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0f2a4a] mx-auto"></div>
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
          <h2 className="text-2xl font-bold text-[#0f2a4a] mb-8 font-serif">Similar Jewellery Pieces</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default ProductDetails;
