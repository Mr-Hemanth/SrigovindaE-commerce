import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

function Orders() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchOrders = async () => {
      try {
        const ordersQuery = query(collection(db, 'orders'), where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(ordersQuery);
        const ordersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => {
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bDate - aDate;
        });

        setOrders(ordersData);
        localStorage.setItem(`orders_${currentUser.uid}`, JSON.stringify(ordersData));
      } catch (err) {
        console.warn('Orders page offline. Loading cached orders from localStorage:', err);
        const cached = localStorage.getItem(`orders_${currentUser.uid}`);
        if (cached) {
          setOrders(JSON.parse(cached));
        }
      }
      setLoading(false);
    };

    fetchOrders();
  }, [currentUser]);

  const handlePrintInvoice = (order) => {
    const orderDate = order.createdAt?.toDate 
      ? order.createdAt.toDate() 
      : new Date(order.createdAt);
    const formattedDate = orderDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    const invoiceWindow = window.open('', '_blank');
    invoiceWindow.document.write(`
      <html>
        <head>
          <title>Invoice - Order #${order.id.slice(-8).toUpperCase()}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f2a4a; padding-bottom: 20px; }
            .brand { color: #0f2a4a; font-size: 24px; font-weight: bold; }
            .details { margin-top: 30px; display: flex; justify-content: space-between; font-size: 14px; }
            .details div { max-width: 45%; }
            table { width: 100%; border-collapse: collapse; margin-top: 40px; }
            th { background: #0f2a4a; color: #fff; padding: 12px; text-align: left; }
            td { padding: 12px; border-bottom: 1px solid #eee; }
            .total-section { margin-top: 30px; display: flex; flex-direction: column; align-items: flex-end; font-size: 14px; }
            .total-row { display: flex; width: 300px; justify-content: space-between; margin-bottom: 8px; }
            .grand-total { font-size: 18px; font-weight: bold; color: #0f2a4a; border-top: 2px solid #0f2a4a; padding-top: 8px; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">Srigovinda collections</div>
              <div style="font-size:12px; color:#666; margin-top:5px;">Devangula Street, Amalapuram, AP, India<br/>Phone: +91 9533866777</div>
            </div>
            <div style="text-align:right;">
              <h2 style="margin:0; color:#0f2a4a;">INVOICE</h2>
              <div style="margin-top:5px; font-size:13px;">Order ID: ${order.id.toUpperCase()}</div>
              <div style="font-size:13px;">Date: ${formattedDate}</div>
            </div>
          </div>
          
          <div class="details">
            <div>
              <strong style="color:#0f2a4a;">Shipping Address:</strong>
              <div style="margin-top:5px; line-height:1.4;">
                ${order.userName || 'Recipient'}<br/>
                ${order.shippingAddress}<br/>
                Phone: ${order.phone}
              </div>
            </div>
            <div style="text-align:right;">
              <strong style="color:#0f2a4a;">Transaction Details:</strong>
              <div style="margin-top:5px; line-height:1.4;">
                Method: ${order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : order.paymentMethod.toUpperCase()}<br/>
                Payment Status: ${order.paymentStatus}
              </div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Product Description</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Price</th>
                <th style="text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td style="text-align:center;">${item.quantity}</td>
                  <td style="text-align:right;">₹${(item.discountedPrice || item.price)}</td>
                  <td style="text-align:right;">₹${((item.discountedPrice || item.price) * item.quantity).toFixed(0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${(order.subtotal || order.total).toFixed(0)}</span>
            </div>
            ${order.discount > 0 ? `
              <div class="total-row" style="color:green;">
                <span>Discount (${order.discount}%):</span>
                <span>-₹${((order.subtotal || order.total) * (order.discount / 100)).toFixed(0)}</span>
              </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>Grand Total:</span>
              <span>₹${(order.finalTotal || order.total).toFixed(0)}</span>
            </div>
          </div>
          
          <div class="footer">
            Thank you for shopping with Srigovinda collections! SSL Secured Payment Receipt.
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    invoiceWindow.document.close();
  };

  const toggleExpandOrder = (orderId) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          status: 'Cancelled',
          paymentStatus: 'Cancelled'
        });

        // Update local state dynamically
        setOrders(prev => prev.map(o => 
          o.id === orderId ? { ...o, status: 'Cancelled', paymentStatus: 'Cancelled' } : o
        ));

        // Sync with local cache
        const cached = localStorage.getItem(`orders_${currentUser.uid}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          const updatedCached = parsed.map(o => 
            o.id === orderId ? { ...o, status: 'Cancelled', paymentStatus: 'Cancelled' } : o
          );
          localStorage.setItem(`orders_${currentUser.uid}`, JSON.stringify(updatedCached));
        }

        showNotification('Order cancelled successfully.', 'success');
      } catch (err) {
        console.error('Error cancelling order:', err);
        showNotification('Could not cancel order. Please try again.', 'error');
      }
    }
  };



  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!currentUser) return null;

  const filteredOrders = orders.filter(order => {
    const orderNum = order.id.slice(-8).toUpperCase();
    const matchesId = order.id.toLowerCase().includes(searchQuery.toLowerCase()) || orderNum.includes(searchQuery.toUpperCase());
    const matchesItemName = order.items.some(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesId || matchesItemName;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-[#0f2a4a] font-serif">Order History</h1>
          <p className="text-sm text-gray-500 mt-1">Review all your previous orders, invoices, and shipment tracking.</p>
        </div>
        <Link 
          to="/products"
          className="bg-[#0f2a4a] hover:bg-[#1b4965] text-white px-5 py-3 rounded-xl font-semibold shadow-md transition-all duration-300 text-sm"
        >
          Continue Shopping
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 bg-white rounded-3xl elegant-shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0f2a4a] mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Fetching your order history securely...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl elegant-shadow border border-gray-100">
          <span className="text-5xl block mb-4">📦</span>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 font-serif">No Orders Found</h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm">You haven't placed any orders yet. Explore our exquisite jewellery collections and check out your first order!</p>
          <Link
            to="/products"
            className="inline-block bg-gradient-to-r from-[#0f2a4a] to-[#1b4965] text-white px-8 py-4 rounded-xl hover:from-[#1b4965] hover:to-[#0f2a4a] transition-all duration-300 font-bold shadow-md hover:shadow-lg"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          
          {/* Search bar input */}
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders by ID (#1234ABCD) or product name..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#0f2a4a] focus:ring-4 focus:ring-[#0f2a4a]/5 bg-white elegant-shadow"
            />
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl elegant-shadow border border-dashed border-gray-250 text-gray-400">
              <span className="text-4xl block mb-2">🔍</span>
              <p className="text-sm font-semibold">No orders match your search query.</p>
              <button 
                onClick={() => setSearchQuery('')} 
                className="mt-2 text-xs font-bold text-[#0f2a4a] hover:underline"
              >
                Clear Search Query
              </button>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const orderDate = order.createdAt?.toDate 
                ? order.createdAt.toDate() 
                : new Date(order.createdAt);

              return (
                <div 
                  key={order.id} 
                  className={`bg-white rounded-3xl border transition-all duration-300 elegant-shadow ${
                    isExpanded ? 'border-[#0f2a4a]/30' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {/* Order Summary Header */}
                  <div 
                    onClick={() => toggleExpandOrder(order.id)}
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
                          handlePrintInvoice(order);
                        }}
                        className="bg-gray-50 hover:bg-[#0f2a4a] text-gray-600 hover:text-white px-3.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 focus:outline-none border border-gray-100"
                      >
                        <span>📄</span>
                        <span>Invoice</span>
                      </button>

                      <div className="text-left md:text-right">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Amount</p>
                        <p className="text-2xl font-black text-[#0f2a4a] font-serif">₹{(order.finalTotal || order.total).toFixed(0)}</p>
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
                                const isActive = idx === activeIdx;
                                return (
                                  <div key={step} className="flex flex-col items-center relative z-10">
                                    {/* Circle dot indicator */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-xs transition-all duration-300 ${
                                      isDone 
                                        ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-200' 
                                        : 'bg-white border-gray-200 text-gray-400'
                                    } ${isActive ? 'ring-4 ring-green-100 scale-110' : ''}`}>
                                      {isDone && idx < activeIdx ? '✓' : idx + 1}
                                    </div>
                                    <span className={`text-[10px] mt-2.5 font-bold transition-colors ${
                                      isDone ? 'text-gray-800' : 'text-gray-400'
                                    } ${isActive ? 'text-green-600 font-extrabold' : ''}`}>
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
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3";
                                }}
                                className="w-16 h-16 object-cover rounded-xl border border-gray-100 shadow-sm flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4>
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
                              <span className="font-medium text-gray-800">₹{order.subtotal?.toFixed(0) || order.total?.toFixed(0)}</span>
                            </div>
                            
                            {order.discount > 0 && (
                              <div className="flex justify-between text-green-600 font-medium">
                                <span>Coupon Discount ({order.discount}%)</span>
                                <span>-₹{((order.subtotal || order.total) * (order.discount / 100)).toFixed(0)}</span>
                              </div>
                            )}

                            <div className="flex justify-between text-base font-bold text-[#0f2a4a] pt-1">
                              <span>Grand Total</span>
                              <span>₹{(order.finalTotal || order.total).toFixed(0)}</span>
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
                                order.paymentStatus === 'COD' ? 'bg-[#d4af37]/20 text-[#0f2a4a]' :
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
                            onClick={() => handlePrintInvoice(order)}
                            className="w-full bg-[#0f2a4a] hover:bg-[#1b4965] text-white font-bold py-2.5 rounded-xl transition-colors text-xs text-center focus:outline-none flex items-center justify-center gap-1.5 shadow-md mb-2"
                          >
                            🖨️ Print Invoice Receipt
                          </button>

                          {/* Cancel Order Action Button */}
                          {['pending', 'processing'].includes(order.status?.toLowerCase()) && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(order.id)}
                              className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-xl border border-red-200 transition-colors text-xs text-center focus:outline-none"
                            >
                              Cancel Order
                            </button>
                          )}
                        </div>

                      </div>

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default Orders;
