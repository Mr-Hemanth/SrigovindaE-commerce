import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function OrderSuccess() {
  const location = useLocation();
  const { orderId, finalTotal, paymentMethod, paymentStatus, shippingAddress, phone, items } = location.state || {};

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'phonepe': return 'PhonePe UPI';
      case 'upi': return 'UPI Payment';
      case 'card': return 'Credit/Debit Card';
      case 'cod': return 'Cash on Delivery';
      default: return 'Online Payment';
    }
  };

  return (
    <div className="min-h-screen py-16 px-4 bg-gradient-to-br from-[#fdf6e9] to-[#f7f2ed] flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl elegant-shadow overflow-hidden border border-gray-100">
        
        {/* Success Header banner */}
        <div className="bg-[#8b5a2b] text-white p-8 text-center relative">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white/10 mb-4 animate-pulse">
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold font-serif mb-2">Order Confirmed! 🎉</h1>
          <p className="text-white/80 text-sm">Thank you for shopping with Srigovinda collections. Your order has been registered.</p>
        </div>

        <div className="p-8 space-y-8">
          {orderId ? (
            <>
              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-100">
                <div>
                  <span className="text-xs uppercase text-gray-400 font-bold block mb-1">Order Reference</span>
                  <span className="font-mono text-gray-800 font-bold text-sm">{orderId}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase text-gray-400 font-bold block mb-1">Date</span>
                  <span className="text-gray-800 font-semibold text-sm">{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {/* Items Breakdown */}
              <div>
                <h3 className="text-base font-bold text-gray-800 mb-4 font-serif">Items Purchased</h3>
                <div className="bg-gray-50 rounded-2xl p-4 divide-y divide-gray-200/60 max-h-56 overflow-y-auto">
                  {items && items.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0 text-sm">
                      <div className="flex items-center gap-4">
                        {item.image && (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-12 h-12 object-cover rounded-xl border border-gray-200/50 shadow-sm"
                          />
                        )}
                        <div className="text-left">
                          <span className="font-semibold text-gray-800 block leading-tight">{item.name}</span>
                          <span className="text-xs text-gray-500 mt-1 block">Qty: {item.quantity} • ₹{item.price}</span>
                        </div>
                      </div>
                      <span className="font-bold text-gray-800">₹{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total details */}
              <div className="bg-[#fdf6e9]/40 border border-[#8b5a2b]/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span className="text-gray-500 font-medium">Payment Mode</span>
                  <span className="font-semibold text-gray-800">{getPaymentMethodLabel(paymentMethod)}</span>
                </div>
                <div className="flex justify-between items-center mb-4 text-sm col-span-2">
                  <span className="text-gray-500 font-medium">Payment Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                    paymentStatus === 'COD' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {paymentStatus || 'Pending'}
                  </span>
                </div>
                <div className="border-t border-[#8b5a2b]/10 pt-4 flex justify-between items-center">
                  <span className="text-base font-bold text-gray-800">Total Price</span>
                  <span className="text-2xl font-extrabold text-[#8b5a2b]">₹{finalTotal?.toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-base font-bold text-gray-800 mb-3 font-serif">Shipping Details</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-medium text-gray-800">{shippingAddress}</p>
                  <p>Contact Phone: <span className="font-semibold">{phone}</span></p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600 text-lg mb-4">
                Thank you for your purchase. Your order has been placed and is being processed. 
                We'll notify you as soon as it's on its way!
              </p>
            </div>
          )}

          {/* Action Links */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <Link 
              to="/" 
              className="block w-full text-center bg-gradient-to-r from-[#8b5a2b] to-[#a07254] text-white py-4 px-6 rounded-xl hover:from-[#a07254] hover:to-[#8b5a2b] transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              Continue Shopping
            </Link>
            <Link 
              to="/profile" 
              className="block w-full text-center border-2 border-[#8b5a2b] text-[#8b5a2b] py-4 px-6 rounded-xl hover:bg-[#fdf6e9] transition-all duration-300 font-semibold text-lg"
            >
              View My Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;
