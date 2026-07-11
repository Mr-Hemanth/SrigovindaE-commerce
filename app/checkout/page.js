'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { auth, db } from '@/lib/firebase/client';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { trackBeginCheckout } from '@/lib/analytics';
import { validateAddressForm } from '@/lib/shipping-validation';

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
  const { cart, total, clearCart, discount, applyCoupon, coupon } = useCart();
  const { currentUser } = useAuth();
  const router = useRouter();
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
  const [agreedToPolicies, setAgreedToPolicies] = useState(false);

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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- regenerates the CAPTCHA challenge, a stateful side effect not derivable during render
      generateCaptcha();
    }
    setValidationError('');
  }, [paymentMethod]);

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    } else if (!currentUser.phone || !/^\d{10}$/.test(currentUser.phone)) {
      showNotification('Please complete your profile by providing your primary 10-digit contact mobile number before proceeding to checkout.', 'error');
      router.push('/profile');
    }
  }, [currentUser, router, showNotification]);

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
    const addressError = validateAddressForm(addressForm);
    if (addressError) return setModalValidationError(addressError);

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

    if (!agreedToPolicies) {
      return setValidationError('Please agree to the Terms & Conditions and Refund Policy before placing your order.');
    }

    const shippingAddressText = `${selectedAddr.area}${selectedAddr.landmark ? ', Landmark: ' + selectedAddr.landmark : ''}, ${selectedAddr.city}, ${selectedAddr.state} - ${selectedAddr.pincode} (${selectedAddr.label})`;
    const contactPhone = selectedAddr.phone;

    if (paymentMethod === 'cod') {
      if (enteredCaptcha !== captchaCode) {
        return setValidationError('Incorrect security code. Please verify the code and try again.');
      }
    }

    const shippingCost = shippingMethod === 'express' ? 150 : 0;
    trackBeginCheckout(cart, total * (1 - discount / 100) + shippingCost);

    if (paymentMethod === 'cod') {
      setLoading(true);
      try {
        const idToken = await auth.currentUser.getIdToken();
        const res = await fetch('/api/checkout/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({
            items: cart,
            couponCode: coupon?.code || null,
            shippingAddress: shippingAddressText,
            shippingArea: selectedAddr.area,
            shippingLandmark: selectedAddr.landmark || '',
            shippingCity: selectedAddr.city,
            shippingState: selectedAddr.state,
            shippingPincode: selectedAddr.pincode,
            phone: contactPhone,
            userName: currentUser.name || currentUser.displayName || 'Customer',
            userEmail: currentUser.email,
            paymentMethod: 'cod',
            shippingCost,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to place order');

        await clearCart();
        router.push(`/order-success?orderId=${data.orderId}&finalTotal=${data.finalTotal}&paymentMethod=cod&paymentStatus=COD`);
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

      let orderInit;
      try {
        const idToken = await auth.currentUser.getIdToken();
        const createRes = await fetch('/api/checkout/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({
            items: cart,
            couponCode: coupon?.code || null,
            shippingAddress: shippingAddressText,
            shippingArea: selectedAddr.area,
            shippingLandmark: selectedAddr.landmark || '',
            shippingCity: selectedAddr.city,
            shippingState: selectedAddr.state,
            shippingPincode: selectedAddr.pincode,
            phone: contactPhone,
            userName: currentUser.name || currentUser.displayName || 'Customer',
            userEmail: currentUser.email,
            paymentMethod: 'online',
            shippingCost,
          }),
        });
        orderInit = await createRes.json();
        if (!createRes.ok) throw new Error(orderInit.error || 'Failed to start checkout');
      } catch (err) {
        console.error('Error creating order:', err);
        setLoading(false);
        return setValidationError(err.message || 'Failed to start checkout. Please try again.');
      }

      const idTokenForVerify = await auth.currentUser.getIdToken();

      const options = {
        key: orderInit.keyId,
        amount: orderInit.amount,
        currency: orderInit.currency,
        order_id: orderInit.razorpayOrderId,
        name: 'Srigovinda collections',
        description: `Secure checkout for Order #${orderInit.orderId.slice(-8).toUpperCase()}`,
        image: 'https://srigovinda-collections.vercel.app/logo.jpg',
        handler: async function (response) {
          try {
            const verifyRes = await fetch('/api/checkout/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idTokenForVerify}` },
              body: JSON.stringify({
                orderId: orderInit.orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.verified) throw new Error(verifyData.error || 'Payment verification failed');

            await clearCart();
            router.push(`/order-success?orderId=${orderInit.orderId}&finalTotal=${orderInit.finalTotal}&paymentMethod=${encodeURIComponent('Razorpay Online')}&paymentStatus=Paid`);
          } catch (err) {
            console.error('Payment verification error:', err);
            showNotification('Your payment was successful, but we could not verify/register your order automatically. Contact support with payment ID: ' + response.razorpay_payment_id, 'error');
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
          color: '#1a1a1a'
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
    router.push('/cart');
    return null;
  }

  const shippingCost = shippingMethod === 'express' ? 150 : 0;
  const finalTotal = total * (1 - (discount / 100)) + shippingCost;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-fade-in">
      <h1 className="text-2xl md:text-4xl font-bold text-brand-navy-900 mb-6 font-serif">Checkout</h1>

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
                className="text-xs font-bold text-brand-navy-900 border border-brand-navy-900 px-4 py-2 rounded-xl hover:bg-brand-navy-900 hover:text-white transition-all duration-300 shadow-sm"
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
                        ? 'border-brand-navy-900 bg-brand-cream-100/20 shadow-sm'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-brand-navy-900 uppercase tracking-wider">
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
              <label className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${shippingMethod === 'standard' ? 'border-brand-navy-900 bg-brand-cream-100/20' : 'border-gray-100 hover:border-gray-200'}`}>
                <input
                  type="radio"
                  name="shipping"
                  value="standard"
                  checked={shippingMethod === 'standard'}
                  onChange={(e) => setShippingMethod(e.target.value)}
                  className="w-4 h-4 text-brand-navy-900 accent-brand-navy-900"
                />
                <div>
                  <span className="font-bold text-gray-800 text-sm block">Standard Free Shipping</span>
                  <span className="text-[10px] text-gray-400 font-mono">Est: {getEstimatedDates('standard')}</span>
                </div>
              </label>

              {/* Express */}
              <label className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${shippingMethod === 'express' ? 'border-brand-navy-900 bg-brand-cream-100/20' : 'border-gray-100 hover:border-gray-200'}`}>
                <input
                  type="radio"
                  name="shipping"
                  value="express"
                  checked={shippingMethod === 'express'}
                  onChange={(e) => setShippingMethod(e.target.value)}
                  className="w-4 h-4 text-brand-navy-900 accent-brand-navy-900"
                />
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gray-800 text-sm block">Express Courier Delivery</span>
                    <span className="text-[10px] text-gray-400 font-mono">Est: {getEstimatedDates('express')}</span>
                  </div>
                  <span className="bg-brand-navy-950 text-white font-bold text-xs px-2.5 py-1 rounded-lg">₹150</span>
                </div>
              </label>

            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-3xl elegant-shadow p-5 md:p-8 border border-gray-100">
            <h2 className="text-lg md:text-2xl font-bold mb-6 text-gray-800 font-serif">Payment Method</h2>
            <div className="space-y-4">

              {/* Razorpay Online */}
              <label className={`flex items-center gap-4 p-4 md:p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${paymentMethod === 'online' ? 'border-brand-navy-900 bg-brand-cream-100/40' : 'border-gray-100 hover:border-brand-navy-800'}`}>
                <input
                  type="radio"
                  name="payment"
                  value="online"
                  checked={paymentMethod === 'online'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-5 h-5 text-brand-navy-900 focus:ring-brand-navy-900"
                />
                <div>
                  <span className="font-bold text-gray-800 text-sm md:text-lg flex items-center gap-2">
                    Secure Online Payment
                    <span className="bg-brand-gold-500/20 text-brand-navy-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-brand-navy-900/10">RAZORPAY</span>
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">Pay securely using Credit/Debit Cards, Netbanking, or UPI Apps (PhonePe, GPay, Paytm)</p>
                </div>
              </label>

              {/* COD */}
              <label className={`flex items-center gap-4 p-4 md:p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${paymentMethod === 'cod' ? 'border-brand-navy-900 bg-brand-cream-100/40' : 'border-gray-100 hover:border-brand-navy-800'}`}>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-5 h-5 text-brand-navy-900 focus:ring-brand-navy-900"
                />
                <div>
                  <span className="font-bold text-gray-800 text-sm md:text-lg">Cash on Delivery (COD)</span>
                  <p className="text-xs text-gray-400 mt-0.5">Pay cash on delivery (Requires safety captcha code)</p>
                </div>
              </label>

              {paymentMethod === 'cod' && (
                <div className="mt-6 p-6 bg-brand-cream-100/50 border border-dashed border-brand-navy-900/30 rounded-2xl animate-fade-in">
                  <h3 className="text-sm font-bold text-gray-800 mb-2 font-serif">Security Verification</h3>
                  <p className="text-xs text-gray-500 mb-4">Please input the security code shown below to confirm your COD checkout order.</p>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="select-none tracking-widest bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white px-5 py-2.5 rounded-xl font-mono text-lg font-bold italic line-through shadow-md">
                      {captchaCode}
                    </div>
                    <button
                      type="button"
                      onClick={generateCaptcha}
                      className="text-xs font-bold text-brand-navy-900 hover:text-brand-navy-800 underline hover:no-underline"
                    >
                      Refresh
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={4}
                    value={enteredCaptcha}
                    onChange={(e) => setEnteredCaptcha(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-navy-900 text-base"
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
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-navy-900"
                />
                <button
                  type="submit"
                  className="bg-brand-gold-500 text-white px-5 py-3 rounded-xl font-semibold hover:bg-brand-gold-600 transition-all text-xs"
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
              <div className="flex justify-between text-base font-bold text-brand-navy-900 pt-1">
                <span>Grand Total</span>
                <span className="text-xl">₹{finalTotal.toFixed(0)}</span>
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-gray-600 mb-4 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedToPolicies}
                onChange={(e) => setAgreedToPolicies(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-brand-navy-900 focus:ring-brand-navy-900 border-gray-300 rounded flex-shrink-0"
              />
              <span>
                I agree to the{' '}
                <Link href="/terms" target="_blank" className="font-bold text-brand-navy-900 hover:underline">
                  Terms &amp; Conditions
                </Link>{' '}
                and{' '}
                <Link href="/refund-policy" target="_blank" className="font-bold text-brand-navy-900 hover:underline">
                  Refund Policy
                </Link>
              </span>
            </label>

            <button
              onClick={handlePlaceOrder}
              disabled={loading || !agreedToPolicies}
              className="w-full bg-brand-navy-900 hover:bg-brand-navy-800 text-white py-4 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm mb-4"
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
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-brand-navy-900 text-white">
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-navy-900"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-navy-900"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-navy-900"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-navy-900"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-navy-900"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-navy-900"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-navy-900 font-mono"
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
                  className="flex-1 bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white py-3 rounded-xl hover:from-brand-navy-800 hover:to-brand-navy-900 transition-all font-semibold text-sm shadow-md"
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
