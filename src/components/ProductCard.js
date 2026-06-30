import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleWishlistClick = () => {
    if (!currentUser) {
      navigate('/login');
    } else {
      toggleWishlist(product);
    }
  };

  const handleAddToCart = () => {
    if (!currentUser) {
      navigate('/login');
    } else {
      addToCart(product);
      alert(`${product.name} added to your cart successfully!`);
    }
  };

  const hasDiscount = product.discountedPrice !== undefined && product.discountedPrice !== null && product.discountedPrice !== '' && Number(product.discountedPrice) > 0;
  const discountPercentage = hasDiscount ? Math.round(((product.price - product.discountedPrice) / product.price) * 100) : 0;

  return (
    <div className="bg-white rounded-3xl elegant-shadow overflow-hidden hover:scale-[1.02] transition-all duration-300 ease-out border border-gray-50/50 hover:border-[#8b5a2b]/20 relative group animate-fade-in flex flex-col justify-between h-full">
      <div className="relative cursor-pointer overflow-hidden" onClick={() => navigate(`/product/${product.id}`)}>
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105" 
        />
        
        {/* Discount Badge Ribbon */}
        {hasDiscount && (
          <span className="absolute top-4 left-4 bg-gradient-to-r from-[#d4af37] to-[#c49d2f] text-[#5a3d1d] font-black text-[9px] tracking-wider uppercase px-2.5 py-1 rounded-full shadow-md z-10 border border-[#c49d2f]/20">
            SAVE {discountPercentage}%
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleWishlistClick();
          }}
          className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-2.5 rounded-full shadow-lg hover:bg-white transition-all duration-300 hover:scale-110 z-10"
        >
          {isInWishlist(product.id) ? (
            <svg className="w-5 h-5 text-[#e74c3c]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
        </button>
      </div>
      
      <div className="p-6 flex flex-col justify-between flex-grow">
        <div>
          <span className="text-[10px] font-bold text-[#8b5a2b] uppercase tracking-widest">{product.category.replace('-', ' ')}</span>
          <h3 
            onClick={() => navigate(`/product/${product.id}`)}
            className="mt-2 text-lg font-bold text-gray-800 font-serif cursor-pointer hover:text-[#8b5a2b] transition-colors line-clamp-1 leading-snug"
          >
            {product.name}
          </h3>
          <p className="mt-2 text-gray-500 text-xxs leading-relaxed line-clamp-2">{product.description}</p>
        </div>

        <div className="mt-5 flex items-center justify-between pt-4 border-t border-gray-50">
          <div className="flex items-baseline gap-1.5">
            {hasDiscount ? (
              <>
                <span className="text-xl font-black text-[#8b5a2b]">₹{Number(product.discountedPrice).toFixed(0)}</span>
                <span className="text-gray-400 line-through text-[11px] font-medium">₹{Number(product.price).toFixed(0)}</span>
              </>
            ) : (
              <span className="text-xl font-black text-[#8b5a2b]">₹{Number(product.price).toFixed(0)}</span>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            className="bg-gradient-to-r from-[#8b5a2b] to-[#a07254] text-white px-4 py-2.5 rounded-xl hover:from-[#a07254] hover:to-[#8b5a2b] transition-all duration-300 font-semibold text-xs shadow-md hover:shadow-lg"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
