import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

function Cart() {
  const { cart, removeFromCart, updateQuantity, subtotal, discountAmount, total, applyCoupon, removeCoupon, coupon, discount } = useCart();
  const { currentUser } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchCoupons = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'coupons'));
        const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const now = new Date();
        const active = list.filter(c => {
          const exp = c.expiryDate.toDate ? c.expiryDate.toDate() : new Date(c.expiryDate);
          return now <= exp;
        });
        setAvailableCoupons(active);
      } catch (err) {
        console.warn('Could not load active coupons for cart page:', err);
      }
    };
    fetchCoupons();
  }, [currentUser]);

  if (!currentUser) return null;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    const result = await applyCoupon(couponCode.trim());
    if (result.success) {
      setCouponMessage({ text: result.message, type: 'success' });
      setCouponCode('');
    } else {
      setCouponMessage({ text: result.message, type: 'error' });
    }
    setTimeout(() => setCouponMessage(''), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-[#8b5a2b] mb-10 font-serif">Your Shopping Cart</h1>
      {cart.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl elegant-shadow border border-gray-100">
          <svg className="w-32 h-32 mx-auto text-[#8b5a2b] mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
          </svg>
          <p className="text-2xl text-gray-600 mb-6 font-medium">Your cart is empty</p>
          <Link to="/products" className="inline-block bg-gradient-to-r from-[#8b5a2b] to-[#a07254] text-white px-8 py-4 rounded-xl hover:from-[#a07254] hover:to-[#8b5a2b] transition-all duration-300 font-semibold text-lg shadow-md">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6 animate-fade-in">
            {cart.map(item => (
              <div key={item.id} className="bg-white rounded-3xl elegant-shadow p-8 flex flex-col md:flex-row items-center gap-6 border border-gray-50/50 hover:scale-[1.01] transition-transform duration-300">
                <img src={item.image} alt={item.name} className="w-32 h-32 object-cover rounded-2xl elegant-shadow border border-gray-100" />
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-gray-800 font-serif leading-snug">{item.name}</h3>
                  <div className="mt-2 flex items-baseline justify-center md:justify-start gap-2">
                    {item.discountedPrice !== undefined && item.discountedPrice !== null && item.discountedPrice !== '' && Number(item.discountedPrice) > 0 ? (
                      <>
                        <span className="text-[#8b5a2b] font-bold text-lg">₹{item.discountedPrice}</span>
                        <span className="text-gray-400 line-through text-xs">₹{item.price}</span>
                      </>
                    ) : (
                      <span className="text-[#8b5a2b] font-bold text-lg">₹{item.price}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-10 h-10 flex items-center justify-center border-2 border-gray-200 rounded-xl hover:bg-[#fdf6e9] hover:border-[#8b5a2b] transition-all duration-300 text-lg font-semibold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-lg font-mono">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center border-2 border-gray-200 rounded-xl hover:bg-[#fdf6e9] hover:border-[#8b5a2b] transition-all duration-300 text-lg font-semibold"
                  >
                    +
                  </button>
                </div>
                <div className="text-center md:text-right min-w-[100px]">
                  <p className="text-xl font-black text-[#8b5a2b]">
                    ₹{(
                      (item.discountedPrice !== undefined && item.discountedPrice !== null && item.discountedPrice !== '' && Number(item.discountedPrice) > 0
                        ? Number(item.discountedPrice)
                        : Number(item.price)) * item.quantity
                    ).toFixed(0)}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 text-xs mt-2 font-bold hover:underline transition-all"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl elegant-shadow p-8 border border-gray-50 sticky top-28 space-y-6">
              <h2 className="text-2xl font-bold text-[#8b5a2b] font-serif border-b border-gray-50 pb-4">Order Summary</h2>

              {/* Coupon inputs */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider">Have a coupon?</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Check Instagram for coupon codes"
                    className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#8b5a2b]"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="bg-[#d4af37] text-white px-5 py-3 rounded-xl hover:bg-[#c49d2f] transition-all text-xs font-semibold"
                  >
                    Apply
                  </button>
                </div>
                {couponMessage && (
                  <p className={`text-xs font-bold ${couponMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {couponMessage.text}
                  </p>
                )}

                {/* Clickable Ticket badges list */}
                {availableCoupons.length > 0 && !coupon && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Available Coupons (Click to apply)</p>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
                      {availableCoupons.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={async () => {
                            setCouponCode(c.code);
                            const result = await applyCoupon(c.code);
                            if (result.success) {
                              setCouponMessage({ text: result.message, type: 'success' });
                              setCouponCode('');
                            } else {
                              setCouponMessage({ text: result.message, type: 'error' });
                            }
                            setTimeout(() => setCouponMessage(''), 3000);
                          }}
                          className="bg-[#fdf6e9] border border-[#d4af37]/30 hover:border-[#8b5a2b] hover:bg-[#fcf1db] px-3 py-1.5 rounded-xl text-[10px] font-bold text-[#8b5a2b] transition-all duration-300 flex items-center gap-1.5 shadow-sm"
                        >
                          🎟️ {c.code} <span className="text-[9px] bg-[#d4af37]/20 px-1 py-0.5 rounded font-black text-[#8b5a2b]">{c.discountPercentage}% OFF</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {coupon && (
                  <div className="flex items-center justify-between bg-green-50 px-4 py-3 rounded-xl border border-green-200 text-xs">
                    <span className="text-green-700 font-bold">🎟️ {coupon.code} - {coupon.discountPercentage}% OFF APPLIED</span>
                    <button onClick={removeCoupon} className="text-red-500 hover:text-red-700 text-lg font-black leading-none">×</button>
                  </div>
                )}
              </div>

              <div className="space-y-4 border-b border-gray-50 pb-6 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-800">₹{subtotal.toFixed(0)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toFixed(0)}</span>
                  </div>
                )}
                <div className="border-t pt-4 flex justify-between text-xl font-black text-[#8b5a2b]">
                  <span>Total</span>
                  <span>₹{total.toFixed(0)}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-[#8b5a2b] hover:bg-[#a07254] text-white py-4 px-6 rounded-xl transition-all duration-300 font-bold shadow-md hover:shadow-lg text-center block text-sm"
              >
                Proceed to Checkout
              </button>

              <Link to="/products" className="block text-center text-[#8b5a2b] hover:text-[#a07254] text-xs font-bold transition-colors">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
