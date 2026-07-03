import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useNotification } from '../contexts/NotificationContext';
import { db } from '../firebase';
import { doc, onSnapshot, collection, getDocs } from 'firebase/firestore';

function Navbar() {
  const { currentUser, isAdmin, logout } = useAuth();
  const { showNotification } = useNotification();
  const { 
    cart, 
    isCartOpen, 
    setCartOpen, 
    removeFromCart, 
    updateQuantity, 
    subtotal, 
    discountAmount, 
    total 
  } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Global search autocomplete states
  const [allProducts, setAllProducts] = useState([]);
  const [searchVal, setSearchVal] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Fetch active products list for Navbar search on mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(p => p.isActive !== false);
        setAllProducts(list);
      } catch (err) {
        console.warn('Navbar: offline/error loading search database:', err);
      }
    };
    fetchAll();
  }, []);

  const handleSearchChange = (val) => {
    setSearchVal(val);
    if (!val.trim()) {
      setSearchSuggestions([]);
      return;
    }
    const q = val.toLowerCase();
    const matches = allProducts.filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.category?.toLowerCase().includes(q) ||
      p.subcategory?.toLowerCase().includes(q)
    );
    setSearchSuggestions(matches.slice(0, 5));
  };

  // Promo and Countdown banner states
  const [promo, setPromo] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');

  // Listen to live database configuration changes
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'promo'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPromo(data);
      }
    }, (err) => {
      console.warn('Promo fetching offline settings:', err);
    });
    return () => unsub();
  }, []);

  // Update countdown clock difference
  useEffect(() => {
    if (!promo || !promo.enabled || !promo.endDate) return;

    const timer = setInterval(() => {
      const difference = +new Date(promo.endDate) - +new Date();
      if (difference <= 0) {
        setTimeLeft('ENDED');
        clearInterval(timer);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        const pad = (num) => String(num).padStart(2, '0');
        setTimeLeft(`${days > 0 ? `${days}d ` : ''}${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [promo]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      {/* Top Countdown Banner */}
      {promo && promo.enabled && timeLeft !== 'ENDED' && (
        <div className="bg-[#d4af37] text-[#0b1a30] text-center py-2 px-4 text-xs font-bold flex flex-col sm:flex-row justify-center items-center gap-2 select-none border-b border-[#0f2a4a]/10 relative z-50 animate-fade-in shadow-md">
          <div className="flex items-center gap-1.5 justify-center">
            <span className="animate-pulse">✨</span>
            <span>{promo.text}</span>
          </div>
          <div className="flex items-center gap-2.5 justify-center">
            <span className="bg-[#0b1a30] text-white px-2 py-0.5 rounded font-mono text-[10px] md:text-xs">
              Ends in: {timeLeft || '00:00:00'}
            </span>
            {promo.couponCode && (
              <span className="bg-[#0f2a4a]/10 px-2 py-0.5 rounded text-[10px]">
                🎫 {promo.couponCode}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Floating Incomplete Profile Warning Banner */}
      {currentUser && (!currentUser.phone || !/^\d{10}$/.test(currentUser.phone)) && (
        <div className="bg-[#e74c3c] text-white text-center py-2.5 px-4 text-xs font-bold flex justify-center items-center gap-2 select-none relative z-40 animate-fade-in shadow-inner border-b border-red-700/20">
          <span>⚠️ Profile Incomplete: Please add your 10-digit contact mobile number in your <Link to="/profile" className="underline text-amber-200 hover:text-white font-extrabold ml-1">Profile Settings</Link> to unlock checkout capabilities.</span>
        </div>
      )}

      <nav className="bg-gradient-to-r from-[#0b1a30] to-[#0f2a4a] shadow-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Title */}
          <Link to="/" className="flex items-center gap-3 select-none">
            <img src="/logo.jpg" alt="Srigovinda Collections" className="w-10 h-10 rounded-full border border-[#d4af37]/40 object-cover elegant-shadow" />
            <span className="text-lg md:text-2xl font-bold text-[#f0f5fa] font-serif tracking-wide">
              Srigovinda collections
            </span>
          </Link>

          {/* Desktop Search Bar with Autocomplete Suggestions */}
          <div className="hidden md:block relative w-80 max-w-xs select-none">
            <div className="relative">
              <input
                type="text"
                value={searchVal}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="Search jewellery..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-gray-900 placeholder-gray-400 focus:placeholder-gray-500 rounded-full text-xs transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 border border-white/10 focus:border-transparent"
              />
              <svg className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Autocomplete Dropdown suggestions list */}
            {isSearchFocused && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in divide-y divide-gray-50">
                {searchSuggestions.map((prod) => (
                  <Link
                    key={prod.id}
                    to={`/product/${prod.id}`}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <img 
                      src={prod.image} 
                      alt={prod.name} 
                      className="w-8 h-8 rounded-lg object-cover border border-gray-100" 
                    />
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-xs font-bold text-gray-800 truncate">{prod.name}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{prod.category?.replace('-', ' ')}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center space-x-7">
            <Link to="/" className="text-[#f0f5fa] hover:text-white transition-all duration-300 font-medium text-sm">Home</Link>
            <Link to="/products" className="text-[#f0f5fa] hover:text-white transition-all duration-300 font-medium text-sm">Products</Link>
            
            {currentUser ? (
              <>
                <Link to="/wishlist" className="text-[#f0f5fa] hover:text-white transition-all duration-300 relative flex items-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlist.length > 0 && (
                    <span className="absolute -top-2.5 -right-2.5 bg-[#d4af37] text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">{wishlist.length}</span>
                  )}
                </Link>
                <button 
                  onClick={() => setCartOpen(true)}
                  className="text-[#f0f5fa] hover:text-white transition-all duration-300 relative flex items-center focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                  </svg>
                  {totalCartItems > 0 && (
                    <span className="absolute -top-2.5 -right-2.5 bg-[#d4af37] text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">{totalCartItems}</span>
                  )}
                </button>
                <Link to="/orders" className="text-[#f0f5fa] hover:text-white transition-all duration-300 font-medium text-sm">Orders</Link>
                <Link to="/profile" className="text-[#f0f5fa] hover:text-white transition-all duration-300 font-medium text-sm">Profile</Link>
                {isAdmin && (
                  <Link to="/admin" className="bg-[#d4af37] text-[#0b1a30] px-5 py-2 rounded-xl hover:bg-[#c49d2f] transition-all duration-300 font-bold text-xs shadow-md">
                    Admin Panel
                  </Link>
                )}
                <button onClick={handleLogout} className="bg-[#c0392b] text-white px-5 py-2 rounded-xl hover:bg-[#a93226] transition-all duration-300 font-bold text-xs shadow-md">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-[#f0f5fa] hover:text-white transition-all duration-300 font-medium text-sm">Login</Link>
                <Link to="/signup" className="bg-[#d4af37] text-[#0b1a30] px-5 py-2 rounded-xl hover:bg-[#c49d2f] transition-all duration-300 font-bold text-xs shadow-md">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex lg:hidden items-center space-x-5">
            {currentUser && (
              <>
                <Link to="/wishlist" className="text-[#f0f5fa] relative flex items-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlist.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#d4af37] text-white text-[9px] rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold">{wishlist.length}</span>
                  )}
                </Link>
                <button 
                  onClick={() => setCartOpen(true)}
                  className="text-[#f0f5fa] relative flex items-center focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                  </svg>
                  {totalCartItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#d4af37] text-white text-[9px] rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold">{totalCartItems}</span>
                  )}
                </button>
              </>
            )}

            {/* Toggle Button */}
            <button
              onClick={() => setIsOpen(true)}
              className="text-[#f0f5fa] hover:text-white focus:outline-none"
              aria-label="Open navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop overlay for mobile drawer */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Slide-Over Navigation Drawer */}
      <div className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-gradient-to-b from-[#0b1a30] to-[#0f2a4a] text-[#f0f5fa] shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col justify-between border-l border-[#d4af37]/20 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#f0f5fa]/10">
          <div className="flex justify-between items-center mb-4">
            <span className="font-serif font-bold text-lg text-[#d4af37]">Store Menu</span>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white text-2xl font-semibold leading-none focus:outline-none"
            >
              ✕
            </button>
          </div>

          {/* User profile block */}
          {currentUser && (
            <div className="bg-black/10 p-3.5 rounded-xl border border-white/5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#d4af37]/20 flex items-center justify-center font-bold text-[#d4af37] border border-[#d4af37]/20">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'C'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{currentUser.name || 'Valued Customer'}</p>
                <p className="text-[10px] text-white/60 truncate">{currentUser.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Navigation Links */}
        <div className="flex-grow overflow-y-auto px-6 py-4 space-y-4">
          <Link to="/" onClick={() => setIsOpen(false)} className="block text-sm font-semibold hover:text-[#d4af37] py-2 transition-colors border-b border-white/5">🏠 Home Page</Link>
          <Link to="/products" onClick={() => setIsOpen(false)} className="block text-sm font-semibold hover:text-[#d4af37] py-2 transition-colors border-b border-white/5">🛍️ Shop Products</Link>
          
          {currentUser ? (
            <>
              <Link to="/orders" onClick={() => setIsOpen(false)} className="block text-sm font-semibold hover:text-[#d4af37] py-2 transition-colors border-b border-white/5">📦 Order Tracking</Link>
              <Link to="/profile" onClick={() => setIsOpen(false)} className="block text-sm font-semibold hover:text-[#d4af37] py-2 transition-colors border-b border-white/5">👤 My Account Profile</Link>
              <Link to="/wishlist" onClick={() => setIsOpen(false)} className="block text-sm font-semibold hover:text-[#d4af37] py-2 transition-colors border-b border-white/5">❤️ Wishlist ({wishlist.length})</Link>
              <button 
                onClick={() => { setIsOpen(false); setCartOpen(true); }}
                className="w-full text-left block text-sm font-semibold hover:text-[#d4af37] py-2 transition-colors border-b border-white/5 focus:outline-none"
              >
                🛒 Shopping Cart ({totalCartItems})
              </button>
            </>
          ) : (
            <div className="space-y-3 pt-4">
              <Link 
                to="/login" 
                onClick={() => setIsOpen(false)} 
                className="block text-center border border-[#d4af37]/50 text-[#f0f5fa] py-3 rounded-xl font-bold text-xs"
              >
                Log In
              </Link>
              <Link 
                to="/signup" 
                onClick={() => setIsOpen(false)} 
                className="block text-center bg-gradient-to-r from-[#d4af37] to-[#c49d2f] text-[#0b1a30] py-3 rounded-xl font-bold text-xs"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        {currentUser && (
          <div className="p-6 border-t border-[#f0f5fa]/10 bg-black/5 space-y-3">
            {isAdmin && (
              <Link 
                to="/admin" 
                onClick={() => setIsOpen(false)} 
                className="block text-center bg-gradient-to-r from-[#d4af37] to-[#c49d2f] text-[#0b1a30] py-3 rounded-xl font-bold text-xs shadow-md"
              >
                🛠️ Admin Dashboard
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="w-full bg-[#c0392b] text-white py-3 rounded-xl hover:bg-[#a93226] font-bold text-xs shadow-md transition-colors"
            >
              Log Out
            </button>
          </div>
        )}

      </div>
    </nav>

    {/* 🛒 Slide-Out Premium Cart Drawer Sidebar */}
    {isCartOpen && (
      <div className="fixed inset-0 z-50 overflow-hidden select-none">
        {/* Backdrop overlay */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
          onClick={() => setCartOpen(false)}
        />
        
        {/* Drawer Panel Container */}
        <div className="absolute inset-y-0 right-0 max-w-full flex">
          <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-gray-100/80 animate-slide-left">
            {/* Drawer Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-[#0b1a30] to-[#0f2a4a] text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🛒</span>
                <h2 className="text-lg font-bold font-serif">Your Cart ({totalCartItems})</h2>
              </div>
              <button 
                onClick={() => setCartOpen(false)}
                className="text-white/80 hover:text-white text-2xl font-semibold leading-none focus:outline-none"
              >
                ✕
              </button>
            </div>
            
            {/* Drawer Body - Items list */}
            <div className="flex-grow overflow-y-auto p-6 space-y-5 bg-gray-50/50">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <span className="text-5xl block mb-4">🛒</span>
                  <p className="font-semibold text-sm">Your shopping cart is empty</p>
                  <p className="text-xs mt-1">Add beautiful jewellery items to get started!</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4 bg-white p-4 rounded-2xl border border-gray-150/50 hover:shadow-md transition-shadow duration-300">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-20 h-20 rounded-xl object-cover border border-gray-100 flex-shrink-0" 
                    />
                    <div className="flex-grow min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                        <p className="text-[10px] text-gray-400 capitalize mt-0.5">{item.category?.replace('-', ' ')}</p>
                      </div>
                      
                      <div className="flex justify-between items-center mt-2">
                        {/* Quantity selector */}
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white scale-90 origin-left">
                          <button
                            onClick={() => {
                              if (item.quantity > 1) {
                                updateQuantity(item.id, item.quantity - 1);
                              }
                            }}
                            className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 font-bold transition-colors text-gray-600 text-xs"
                          >
                            -
                          </button>
                          <span className="px-3 py-0.5 text-xs font-bold text-gray-800 min-w-[24px] text-center font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 font-bold transition-colors text-gray-600 text-xs"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs font-black text-gray-800">₹{(Number(item.discountedPrice || item.price) * item.quantity).toFixed(0)}</span>
                      </div>
                    </div>
                    
                    {/* Delete button */}
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-300 hover:text-red-600 transition-colors self-start p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
            
            {/* Drawer Footer Summary & Checkout */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-gray-150 bg-white space-y-4 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
                <div className="space-y-1.5 text-xs text-gray-500 font-medium">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-gray-800 font-bold">₹{subtotal.toFixed(0)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon Savings</span>
                      <span>-₹{discountAmount.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-gray-800 pt-2 border-t border-gray-100">
                    <span>Total Amount</span>
                    <span className="text-[#0f2a4a] text-base font-black">₹{total.toFixed(0)}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setCartOpen(false);
                    if (!currentUser) {
                      navigate('/login');
                    } else if (!currentUser.phone || !/^\d{10}$/.test(currentUser.phone)) {
                      showNotification('Please complete your profile by providing your primary 10-digit contact mobile number before proceeding to checkout.', 'error');
                      navigate('/profile');
                    } else {
                      navigate('/checkout');
                    }
                  }}
                  className="w-full bg-gradient-to-r from-[#0f2a4a] to-[#1b4965] hover:from-[#1b4965] hover:to-[#0f2a4a] text-white py-3.5 rounded-xl font-bold text-center block text-xs shadow-md transition-all duration-300 uppercase tracking-wider"
                >
                  Proceed to Checkout
                </button>
                <button
                  onClick={() => setCartOpen(false)}
                  className="w-full text-center text-[#0f2a4a] hover:text-[#1b4965] font-bold text-xxs transition-colors py-1"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </>
);
}

export default Navbar;
