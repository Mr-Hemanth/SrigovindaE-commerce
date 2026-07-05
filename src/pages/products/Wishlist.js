import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useNotification } from '../../contexts/NotificationContext';

function Wishlist() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 select-none text-left">
      <h1 className="text-2xl md:text-4xl font-bold text-[#0f2a4a] mb-10 font-serif">My Wishlist</h1>
      {wishlist.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl elegant-shadow border border-gray-100 animate-fade-in">
          <svg className="w-24 h-24 mx-auto text-[#0f2a4a] mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-xl text-gray-600 mb-6 font-medium">Your wishlist is empty</p>
          <Link to="/products" className="inline-block bg-gradient-to-r from-[#0f2a4a] to-[#1b4965] text-white px-8 py-3.5 rounded-xl hover:from-[#1b4965] hover:to-[#0f2a4a] transition-all duration-300 font-semibold text-base shadow-md">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
          {wishlist.map(product => {
            const isOutOfStock = product.stock === 0 || product.stockStatus === 'out-of-stock';
            const hasDiscount = product.discountedPrice !== undefined && product.discountedPrice !== null && product.discountedPrice !== '' && Number(product.discountedPrice) > 0;
            
            return (
              <div key={product.id} className="bg-white rounded-3xl elegant-shadow border border-gray-50 flex flex-col justify-between overflow-hidden relative group">
                {/* Remove button */}
                <button
                  onClick={() => {
                    removeFromWishlist(product.id);
                    showNotification('Item removed from wishlist.', 'info');
                  }}
                  className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-red-500 shadow-md hover:scale-105 transition-transform font-bold"
                  title="Remove from Wishlist"
                >
                  ✕
                </button>
                
                {/* Image */}
                <div className="relative aspect-square overflow-hidden cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103" />
                  
                  {/* Stock Status Label */}
                  <span className={`absolute bottom-3 left-3 px-2 py-0.5 rounded text-[8px] font-bold shadow uppercase ${isOutOfStock ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                    {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                  </span>
                </div>
                
                {/* Content details */}
                <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                  <div className="text-left">
                    <span className="text-[9px] font-bold text-[#d4af37] tracking-widest uppercase">{product.category?.replace('-', ' ')}</span>
                    <h3 className="text-xs md:text-sm font-bold text-gray-800 font-serif line-clamp-1 mt-0.5 cursor-pointer hover:text-[#0f2a4a]" onClick={() => navigate(`/product/${product.id}`)}>{product.name}</h3>
                    
                    <div className="mt-1 flex items-baseline gap-1.5">
                      {hasDiscount ? (
                        <>
                          <span className="text-xs md:text-sm font-bold text-[#0f2a4a]">₹{product.discountedPrice}</span>
                          <span className="text-gray-400 line-through text-[9px]">₹{product.price}</span>
                        </>
                      ) : (
                        <span className="text-xs md:text-sm font-bold text-[#0f2a4a]">₹{product.price}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <button
                    disabled={isOutOfStock}
                    onClick={() => {
                      addToCart(product);
                      removeFromWishlist(product.id);
                      showNotification(`"${product.name}" moved to cart!`, 'success');
                    }}
                    className="w-full bg-[#0f2a4a] hover:bg-[#1b4965] text-white py-2 px-3 rounded-xl transition-all font-bold text-[10px] shadow-sm hover:shadow text-center disabled:opacity-50"
                  >
                    Move to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
