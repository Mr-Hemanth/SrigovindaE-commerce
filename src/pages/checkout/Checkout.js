import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { db } from '../../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Helper to dynamically load the Razorpay Checkout script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function Checkout() {
  const { cart, total, clearCart, discount, applyCoupon } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  // COD Captcha Security
  const [captchaCode, setCaptchaCode] = useState('');
  const [enteredCaptcha, setEnteredCaptcha] = useState('');
  const [validationError, setValidationError] = useState('');

  // New Address Modal States
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    area: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    phone: ''
  });
  const [modalValidationError, setModalValidationError] = useState('');

  const generateCaptcha = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(code);
    setEnteredCaptcha('');
  };

  const getEstimatedDates = (method) => {
    const start = new Date();
    const end = new Date();
    if (method === 'express') {
      start.setDate(start.getDate() + 2);
      end.setDate(end.getDate() + 3);
    } else {
      start.setDate(start.getDate() + 5);
      end.setDate(end.getDate() + 7);
    }
    const options = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  useEffect(() => {
    if (paymentMethod === 'cod') {
      generateCaptcha();
    }
    setValidationError('');
  }, [paymentMethod]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else if (!currentUser.phone || !/^\d{10}$/.test(currentUser.phone)) {
      showNotification('Please complete your profile by providing your primary 10-digit contact mobile number before proceeding to checkout.', 'error');
      navigate('/profile');
    }
  }, [currentUser, navigate, showNotification]);

  // Load user's saved addresses
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userAddrs = userDoc.data().addresses || [];
          setAddresses(userAddrs);
          
          const defaultAddr = userAddrs.find(a => a.isDefault) || userAddrs[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
          }
        }
      } catch (err) {
        console.warn('Checkout profile loading offline. Using local caches.', err);
        const cachedAddrs = localStorage.getItem(`addresses_${currentUser.uid}`);
        if (cachedAddrs) {
          const parsed = JSON.parse(cachedAddrs);
          setAddresses(parsed);
          const defaultAddr = parsed.find(a => a.isDefault) || parsed[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
          }
        }
      }
    };
    
    fetchData();
  }, [currentUser]);

  if (!currentUser) return null;

  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    setCouponError('');
    if (!couponCode.trim()) return;
    const result = await applyCoupon(couponCode.trim());
    setCouponError(result.message);
    if (result.success) {
      setCouponCode('');
    }
  };

  // Submit address form inside modal
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setModalValidationError('');

    if (addresses.length >= 4) {
      return setModalValidationError('You can add up to 4 addresses max. Delete one from Profile to add more.');
    }

    // Input Validations
    if (!addressForm.area.trim()) return setModalValidationError('Area / Street is required.');
    if (!addressForm.city.trim()) return setModalValidationError('City or Town is required.');
    if (!addressForm.state.trim()) return setModalValidationError('State is required.');
    if (!/^\d{6}$/.test(addressForm.pincode.trim())) return setModalValidationError('Pincode must be exactly 6 digits.');
    if (!/^\d{10}$/.test(addressForm.phone.trim())) return setModalValidationError('Phone number must be exactly 10 digits.');

    const newAddressId = `addr_${Date.now()}`;
    const newAddress = {
      id: newAddressId,
      ...addressForm,
      area: addressForm.area.trim(),
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      pincode: addressForm.pincode.trim(),
      phone: addressForm.phone.trim(),
      isDefault: addresses.length === 0 // Make default if it's the first one
    };

    const updatedAddresses = [...addresses, newAddress];
    setAddresses(updatedAddresses);

    try {
      localStorage.setItem(`addresses_${currentUser.uid}`, JSON.stringify(updatedAddresses));
      await setDoc(doc(db, 'users', currentUser.uid), {
        addresses: updatedAddresses
      }, { merge: true });
    } catch (err) {
      console.warn('Could not sync newly added address to Firestore. Saved locally.', err);
    }

    setSelectedAddressId(newAddressId);
    setShowAddressModal(false);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setValidationError('');

    const selectedAddr = addresses.find(a => a.id === selectedAddressId);
    if (!selectedAddr) {
      return setValidationError('Please select or add a shipping address.');
    }

    const shippingAddressText = `${selectedAddr.area}${selectedAddr.landmark ? ', Landmark: ' + selectedAddr.landmark : ''}, ${selectedAddr.city}, ${selectedAddr.state} - ${selectedAddr.pincode} (${selectedAddr.label})`;
    const contactPhone = selectedAddr.phone;

    if (paymentMethod === 'cod') {
      if (enteredCaptcha !== captchaCode) {
        return setValidationError('Incorrect security code. Please verify the code and try again.');
      }
    }

    const orderId = `SG_${currentUser.uid.slice(0, 5)}_${Date.now()}`;
    const shippingCost = shippingMethod === 'express' ? 150 : 0;
    const finalTotal = total * (1 - (discount / 100)) + shippingCost;

    if (paymentMethod === 'cod') {
      setLoading(true);
      try {
        const orderData = {
          orderId,
          userId: currentUser.uid,
          userName: currentUser.name || (currentUser.displayName || 'Customer'),
          userEmail: currentUser.email,
          shippingAddress: shippingAddressText,
          phone: contactPhone,
          items: cart,
          subtotal: total,
          discount,
          finalTotal,
          paymentMethod,
          paymentStatus: 'COD',
          status: 'processing',
          createdAt: new Date()
        };

        await setDoc(doc(db, 'orders', orderId), orderData);
        await clearCart();

        navigate('/order-success', {
          state: {
            orderId,
            finalTotal,
            paymentMethod,
            paymentStatus: 'COD',
            shippingAddress: shippingAddressText,
            phone: contactPhone,
            items: cart
          }
        });
      } catch (err) {
        console.error('Error placing COD order:', err);
        setValidationError(err.message || 'Failed to process order. Please try again.');
      }
      setLoading(false);
    } else {
      // Razorpay Secure Payment Checkout Flow
      setLoading(true);
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        setLoading(false);
        return setValidationError('Failed to load payment gateway checkout client. Please verify your connection.');
      }

      const options = {
        key: 'rzp_live_T86lT01h6x3r4y',
        amount: Math.round(finalTotal * 100), // Currency in paisa
        currency: 'INR',
        name: 'Srigovinda collections',
        description: `Secure checkout for Order #${orderId.slice(-8).toUpperCase()}`,
        image: 'https://srigovinda-collections.vercel.app/logo.jpg',
        handler: async function (response) {
          try {
            const orderData = {
              orderId,
              userId: currentUser.uid,
              userName: currentUser.name || (currentUser.displayName || 'Customer'),
              userEmail: currentUser.email,
              shippingAddress: shippingAddressText,
              phone: contactPhone,
              items: cart,
              subtotal: total,
              discount,
              finalTotal,
              paymentMethod: 'Razorpay Online',
              paymentStatus: 'Paid',
              razorpayPaymentId: response.razorpay_payment_id,
              status: 'processing',
              createdAt: new Date()
            };

            await setDoc(doc(db, 'orders', orderId), orderData);
            await clearCart();

            navigate('/order-success', {
              state: {
                orderId,
                finalTotal,
                paymentMethod: 'Razorpay Online',
                paymentStatus: 'Paid',
                shippingAddress: shippingAddressText,
                phone: contactPhone,
                items: cart
              }
            });
          } catch (err) {
            console.error('Error writing Razorpay order to database:', err);
            showNotification('Your payment was successful, but we ran into an error registering your order. Contact support with payment ID: ' + response.razorpay_payment_id, 'error');
          }
        },
        prefill: {
          name: currentUser.displayName || '',
          email: currentUser.email || '',
          contact: contactPhone || ''
        },
        notes: {
          shipping_address: shippingAddressText
        },
        theme: {
          color: '#0f2a4a'
        }
      };

      setLoading(false);
      try {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        console.error('Error launching Razorpay modal:', err);
        setValidationError('Error launching secure payment gateway.');
      }
    }
  };

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  const shippingCost = shippingMethod === 'express' ? 150 : 0;
  const finalTotal = total * (1 - (discount / 100)) + shippingCost;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-fade-in">
      <h1 className="text-2xl md:text-4xl font-bold text-[#0f2a4a] mb-6 font-serif">Checkout</h1>
      
      {validationError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold flex items-center gap-3 animate-fade-in">
          <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{validationError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Address selector + Payment choices */}
        <div className="lg:col-span-2 space-y-8 animate-fade-in">
          
          {/* Address Management */}
          <div className="bg-white rounded-3xl elegant-shadow p-5 md:p-8 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-2xl font-bold text-gray-800 font-serif">Shipping Address</h2>
              <button
                type="button"
                onClick={() => {
                  setModalValidationError('');
                  setAddressForm({ label: 'Home', area: '', landmark: '', city: '', state: '', pincode: '', phone: '' });
                  setShowAddressModal(true);
                }}
                className="text-xs font-bold text-[#0f2a4a] border border-[#0f2a4a] px-4 py-2 rounded-xl hover:bg-[#0f2a4a] hover:text-white transition-all duration-300 shadow-sm"
              >
                + Add New Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                <span className="text-3xl block mb-2">📍</span>
                <p className="text-gray-500 font-medium">No saved addresses found.</p>
                <p className="text-xs text-gray-400 mt-1">Please add a shipping address to proceed.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map(addr => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`border-2 rounded-2xl p-5 cursor-pointer relative transition-all duration-300 ${
                      selectedAddressId === addr.id
                        ? 'border-[#0f2a4a] bg-[#f0f5fa]/20 shadow-sm'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-[#0f2a4a] uppercase tracking-wider">
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[9px] bg-yellow-100 text-yellow-800 font-semibold px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-800 break-words">{addr.area}</p>
                    {addr.landmark && <p className="text-xs text-gray-400">Landmark: {addr.landmark}</p>}
                    <p className="text-xs text-gray-500 mt-1">{addr.city}, {addr.state} - {addr.pincode}</p>
                    <p className="text-xs text-gray-500 mt-1 font-semibold">📞 {addr.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery Method and Estimated Date */}
          <div className="bg-white rounded-3xl elegant-shadow p-5 md:p-8 border border-gray-100 select-none text-left">
            <h2 className="text-lg md:text-2xl font-bold mb-2 text-gray-800 font-serif">Delivery Method</h2>
            <p className="text-xs text-gray-400 mb-6">Choose how fast you want your exquisite jewellery items delivered</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Standard */}
              <label className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${shippingMethod === 'standard' ? 'border-[#0f2a4a] bg-[#f0f5fa]/20' : 'border-gray-100 hover:border-gray-200'}`}>
                <input 
                  type="radio" 
                  name="shipping" 
                  value="standard" 
                  checked={shippingMethod === 'standard'} 
                  onChange={(e) => setShippingMethod(e.target.value)}
                  className="w-4 h-4 text-[#0f2a4a] accent-[#0f2a4a]"
                />
                <div>
                  <span className="font-bold text-gray-800 text-sm block">Standard Free Shipping</span>
                  <span className="text-[10px] text-gray-400 font-mono">Est: {getEstimatedDates('standard')}</span>
                </div>
              </label>

              {/* Express */}
              <label className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${shippingMethod === 'express' ? 'border-[#0f2a4a] bg-[#f0f5fa]/20' : 'border-gray-100 hover:border-gray-200'}`}>
                <input 
                  type="radio" 
                  name="shipping" 
                  value="express" 
                  checked={shippingMethod === 'express'} 
                  onChange={(e) => setShippingMethod(e.target.value)}
                  className="w-4 h-4 text-[#0f2a4a] accent-[#0f2a4a]"
                />
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gray-800 text-sm block">Express Courier Delivery</span>
                    <span className="text-[10px] text-gray-400 font-mono">Est: {getEstimatedDates('express')}</span>
                  </div>
                  <span className="bg-[#0b1a30] text-white font-bold text-xs px-2.5 py-1 rounded-lg">₹150</span>
                </div>
              </label>

            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-3xl elegant-shadow p-5 md:p-8 border border-gray-100">
            <h2 className="text-lg md:text-2xl font-bold mb-6 text-gray-800 font-serif">Payment Method</h2>
            <div className="space-y-4">
              
              {/* Razorpay Online */}
              <label className={`flex items-center gap-4 p-4 md:p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${paymentMethod === 'online' ? 'border-[#0f2a4a] bg-[#f0f5fa]/40' : 'border-gray-100 hover:border-[#1b4965]'}`}>
                <input
                  type="radio"
                  name="payment"
                  value="online"
                  checked={paymentMethod === 'online'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-5 h-5 text-[#0f2a4a] focus:ring-[#0f2a4a]"
                />
                <div>
                  <span className="font-bold text-gray-800 text-sm md:text-lg flex items-center gap-2">
                    Secure Online Payment 
                    <span className="bg-[#d4af37]/20 text-[#0f2a4a] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#0f2a4a]/10">RAZORPAY</span>
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">Pay securely using Credit/Debit Cards, Netbanking, or UPI Apps (PhonePe, GPay, Paytm)</p>
                </div>
              </label>

              {/* COD */}
              <label className={`flex items-center gap-4 p-4 md:p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${paymentMethod === 'cod' ? 'border-[#0f2a4a] bg-[#f0f5fa]/40' : 'border-gray-100 hover:border-[#1b4965]'}`}>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-5 h-5 text-[#0f2a4a] focus:ring-[#0f2a4a]"
                />
                <div>
                  <span className="font-bold text-gray-800 text-sm md:text-lg">Cash on Delivery (COD)</span>
                  <p className="text-xs text-gray-400 mt-0.5">Pay cash on delivery (Requires safety captcha code)</p>
                </div>
              </label>

              {paymentMethod === 'cod' && (
                <div className="mt-6 p-6 bg-[#f0f5fa]/50 border border-dashed border-[#0f2a4a]/30 rounded-2xl animate-fade-in">
                  <h3 className="text-sm font-bold text-gray-800 mb-2 font-serif">Security Verification</h3>
                  <p className="text-xs text-gray-500 mb-4">Please input the security code shown below to confirm your COD checkout order.</p>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="select-none tracking-widest bg-gradient-to-r from-[#0f2a4a] to-[#1b4965] text-white px-5 py-2.5 rounded-xl font-mono text-lg font-bold italic line-through shadow-md">
                      {captchaCode}
                    </div>
                    <button 
                      type="button"
                      onClick={generateCaptcha}
                      className="text-xs font-bold text-[#0f2a4a] hover:text-[#1b4965] underline hover:no-underline"
                    >
                      Refresh
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={4}
                    value={enteredCaptcha}
                    onChange={(e) => setEnteredCaptcha(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0f2a4a] text-base"
                    placeholder="Enter security code"
                  />
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl elegant-shadow p-8 border border-gray-100 sticky top-28 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 font-serif border-b border-gray-50 pb-4">Order Summary</h2>
            
            {/* Coupon Code Block */}
            <div className="space-y-4">
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Check Instagram for coupon codes"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#0f2a4a]"
                />
                <button
                  type="submit"
                  className="bg-[#d4af37] text-white px-5 py-3 rounded-xl font-semibold hover:bg-[#c49d2f] transition-all text-xs"
                >
                  Apply
                </button>
              </form>
              
              {couponError && (
                <p className={`text-xs font-semibold ${couponError.includes('applied') ? 'text-green-600' : 'text-red-500'}`}>
                  {couponError}
                </p>
              )}

            </div>

            {/* Shopping cart products items breakdown */}
            <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1 border-b border-gray-50 pb-4">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-xs text-gray-600">
                  <span className="truncate pr-2">{item.name} <span className="font-bold">x {item.quantity}</span></span>
                  <span className="font-semibold text-gray-800">
                    ₹{(
                      (item.discountedPrice !== undefined && item.discountedPrice !== null && item.discountedPrice !== '' && Number(item.discountedPrice) > 0
                        ? Number(item.discountedPrice)
                        : Number(item.price)) * item.quantity
                    ).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>

            {/* Invoice Math */}
            <div className="space-y-3 border-b border-gray-50 pb-4 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-800">₹{total.toFixed(0)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount ({discount}%)</span>
                  <span>-₹{(total * (discount / 100)).toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-500">
                <span>Shipping Delivery</span>
                <span className="font-semibold text-gray-800">{shippingMethod === 'express' ? '₹150 (Express)' : 'FREE (Standard)'}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#0f2a4a] pt-1">
                <span>Grand Total</span>
                <span className="text-xl">₹{finalTotal.toFixed(0)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full bg-[#0f2a4a] hover:bg-[#1b4965] text-white py-4 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm mb-4"
            >
              {loading ? 'Processing Order...' : paymentMethod === 'cod' ? 'Place Order (COD)' : 'Proceed to Payment'}
            </button>

            {/* Trust Badges */}
            <div className="pt-4 flex flex-col items-center gap-2 border-t border-gray-50 text-[10px] text-gray-400 font-bold select-none uppercase tracking-wider">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">🔒 SSL Secure</span>
                <span className="flex items-center gap-1">🛡️ Razorpay Safe</span>
                <span className="flex items-center gap-1">✨ 100% Original</span>
              </div>
              <span className="text-[9px] text-gray-300">Secured with 256-bit encryption</span>
            </div>
          </div>
        </div>

      </div>

      {/* Inline Address Creation Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl elegant-shadow w-full max-w-lg overflow-hidden border border-gray-100 animate-fade-in">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#0f2a4a] text-white">
              <h3 className="text-xl font-bold font-serif">📍 Add New Shipping Address</h3>
              <button 
                onClick={() => setShowAddressModal(false)}
                className="text-white/80 hover:text-white text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {modalValidationError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                {modalValidationError}
              </div>
            )}

            <form onSubmit={handleAddressSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Address Label</label>
                  <select
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0f2a4a]"
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, '') })}
                    placeholder="10-digit number"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0f2a4a]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Area / Street / House No.</label>
                <input
                  type="text"
                  value={addressForm.area}
                  onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })}
                  placeholder="Flat No, Wing, Street address"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0f2a4a]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Landmark</label>
                <input
                  type="text"
                  value={addressForm.landmark}
                  onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                  placeholder="e.g. Near City Mall"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0f2a4a]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">City / Town</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0f2a4a]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">State</label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    placeholder="State"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0f2a4a]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '') })}
                    placeholder="6 digits"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0f2a4a] font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#0f2a4a] to-[#1b4965] text-white py-3 rounded-xl hover:from-[#1b4965] hover:to-[#0f2a4a] transition-all font-semibold text-sm shadow-md"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkout;
