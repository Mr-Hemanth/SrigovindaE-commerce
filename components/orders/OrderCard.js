'use client';

import React from 'react';
import Image from 'next/image';

function OrderCard({
  order,
  isExpanded,
  onToggleExpand,
  onPrintInvoice,
  onCancelOrder,
  onOpenRequestModal,
  getStatusBadgeClass
}) {
  const orderDate = order.createdAt?.toDate
    ? order.createdAt.toDate()
    : new Date(order.createdAt);

  return (
    <div
      className={`bg-white rounded-3xl border transition-all duration-300 elegant-shadow ${
        isExpanded ? 'border-brand-navy-900/30' : 'border-gray-100 hover:border-gray-200'
      }`}
    >
      {/* Order Summary Header */}
      <div
        onClick={() => onToggleExpand(order.id)}
        className="p-6 md:p-8 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-800 text-lg md:text-xl">
              Order #{order.id.slice(-8).toUpperCase()}
            </span>
            <span className={`px-3 py-1 rounded-full text-xxs font-bold uppercase tracking-wider border ${getStatusBadgeClass(order.status)}`}>
              {order.status}
            </span>
          </div>
          <p className="text-xs text-gray-400 font-medium">
            Placed on {orderDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} at {orderDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-8 border-t md:border-t-0 border-gray-50 pt-4 md:pt-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrintInvoice(order);
            }}
            className="bg-gray-50 hover:bg-brand-navy-900 text-gray-600 hover:text-white px-3.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 focus:outline-none border border-gray-100"
          >
            <span>📄</span>
            <span>Invoice</span>
          </button>

          <div className="text-left md:text-right">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Amount</p>
            <p className="text-2xl font-black text-brand-navy-900 font-serif">₹{Number(order.finalTotal || order.total || 0).toFixed(0)}</p>
          </div>
          <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors">
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Collapsible Order Details Block */}
      {isExpanded && (
        <div className="border-t border-gray-50 p-6 md:p-8 space-y-8 animate-fade-in bg-gray-50/30 rounded-b-3xl">

          {/* Shipping progress tracker timeline bar */}
          {(() => {
            const s = order.status?.toLowerCase();
            if (s === 'cancelled') {
              return (
                <div className="bg-red-50 border border-red-200/60 p-4 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold select-none">
                  <span className="text-lg">❌</span>
                  <span>Order Cancelled: This transaction has been cancelled. If any payment was deducted, refunds will process within 3-5 working days.</span>
                </div>
              );
            }
            const steps = ['Placed', 'Processing', 'Shipped', 'Delivered'];
            let activeIdx = 0;
            if (s === 'processing') activeIdx = 1;
            if (s === 'shipped') activeIdx = 2;
            if (s === 'delivered') activeIdx = 3;

            return (
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm select-none">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Delivery Progress Timeline</h4>
                <div className="flex items-center justify-between relative max-w-xl mx-auto px-4">
                  {/* Horizontal progress bar line background */}
                  <div className="absolute top-[15px] left-0 right-0 h-1 bg-gray-100 rounded-full z-0" />
                  <div
                    className="absolute top-[15px] left-0 h-1 bg-green-500 rounded-full z-0 transition-all duration-500"
                    style={{ width: `${(activeIdx / (steps.length - 1)) * 100}%` }}
                  />

                  {steps.map((step, idx) => {
                    const isDone = idx <= activeIdx;
                    const isStepActive = idx === activeIdx;
                    return (
                      <div key={step} className="flex flex-col items-center relative z-10">
                        {/* Circle dot indicator */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-xs transition-all duration-300 ${
                          isDone
                            ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-200'
                            : 'bg-white border-gray-200 text-gray-400'
                        } ${isStepActive ? 'ring-4 ring-green-100 scale-110' : ''}`}>
                          {isDone && idx < activeIdx ? '✓' : idx + 1}
                        </div>
                        <span className={`text-[10px] mt-2.5 font-bold transition-colors ${
                          isDone ? 'text-gray-800' : 'text-gray-400'
                        } ${isStepActive ? 'text-green-600 font-extrabold' : ''}`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Item Listing */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Purchased Items</h3>
            <div className="divide-y divide-gray-100 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={64}
                    height={64}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3";
                    }}
                    className="w-16 h-16 object-cover rounded-xl border border-gray-100 shadow-sm flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 text-sm truncate">{item.name}{item.variantLabel ? ` — ${item.variantLabel}` : ''}</h4>
                    <p className="text-xs text-gray-500 capitalize">{item.category?.replace('-', ' ')} • Qty: <span className="font-semibold text-gray-700">{item.quantity}</span></p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-800 text-sm">
                      ₹{(
                        (item.discountedPrice !== undefined && item.discountedPrice !== null && item.discountedPrice !== '' && Number(item.discountedPrice) > 0
                          ? Number(item.discountedPrice)
                          : Number(item.price)) * item.quantity
                      ).toFixed(0)}
                    </p>
                    <p className="text-[10px] text-gray-400">₹{item.discountedPrice || item.price} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Split details grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Shipping Address Summary */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Shipping Details</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-bold text-gray-800">{order.userName || 'Recipient'}</p>
                  <p className="break-words leading-relaxed">{order.shippingAddress}</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-50 text-xs text-gray-500">
                📞 Contact Number: <span className="font-semibold text-gray-700">{order.phone}</span>
              </div>
            </div>

            {/* Payment and Billing Calculations Summary */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Details</h4>

              <div className="space-y-2 text-sm border-b border-gray-50 pb-3">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-800">₹{Number(order.subtotal || order.total || 0).toFixed(0)}</span>
                </div>

                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Coupon Discount ({order.discount}%)</span>
                    <span>-₹{(Number(order.subtotal || order.total || 0) * (Number(order.discount || 0) / 100)).toFixed(0)}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-bold text-brand-navy-900 pt-1">
                  <span>Grand Total</span>
                  <span>₹{Number(order.finalTotal || order.total || 0).toFixed(0)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pb-2">
                <div>
                  <span className="text-gray-400 font-semibold block mb-0.5">Method</span>
                  <span className="font-bold text-gray-700 uppercase">{order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : order.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-semibold block mb-0.5">Payment Status</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                    order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                    order.paymentStatus === 'COD' ? 'bg-brand-gold-500/20 text-brand-navy-900' :
                    order.paymentStatus === 'Cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Print Invoice Action Button */}
              <button
                type="button"
                onClick={() => onPrintInvoice(order)}
                className="w-full bg-brand-navy-900 hover:bg-brand-navy-800 text-white font-bold py-2.5 rounded-xl transition-colors text-xs text-center focus:outline-none flex items-center justify-center gap-1.5 shadow-md mb-2"
              >
                🖨️ Print Invoice Receipt
              </button>

              {/* Cancellation/Return Requests */}
              {order.requestType ? (
                <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl text-[11px] space-y-1 mt-2 text-left select-none">
                  <p className="font-bold text-gray-700 capitalize flex items-center justify-between">
                    <span>{order.requestType === 'cancel' ? 'Cancellation' : 'Return'} Request:</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                      order.requestStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.requestStatus === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.requestStatus}
                    </span>
                  </p>
                  <p className="text-gray-500"><span className="font-semibold text-gray-600">Reason:</span> {order.requestReason}</p>
                </div>
              ) : (
                <>
                  {order.status?.toLowerCase() === 'pending' && (
                    <button
                      type="button"
                      onClick={() => onCancelOrder(order.id)}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-xl border border-red-200 transition-colors text-xs text-center focus:outline-none"
                    >
                      Cancel Order
                    </button>
                  )}
                  {['processing', 'shipped'].includes(order.status?.toLowerCase()) && (
                    <button
                      type="button"
                      onClick={() => onOpenRequestModal(order.id, 'cancel')}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-xl border border-red-200 transition-colors text-xs text-center focus:outline-none"
                    >
                      Request Cancellation
                    </button>
                  )}
                  {order.status?.toLowerCase() === 'delivered' && (
                    <button
                      type="button"
                      onClick={() => onOpenRequestModal(order.id, 'return')}
                      className="w-full bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold py-2.5 rounded-xl border border-orange-200 transition-colors text-xs text-center focus:outline-none"
                    >
                      Request Return
                    </button>
                  )}
                </>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
}

export default OrderCard;
