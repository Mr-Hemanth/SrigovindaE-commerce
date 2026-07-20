'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { auth, db } from '@/lib/firebase/client';
import { collection, getDocs } from 'firebase/firestore';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [trackingDrafts, setTrackingDrafts] = useState({});
  const [savingTrackingId, setSavingTrackingId] = useState(null);

  const fetchOrders = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      ordersData.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bDate - aDate;
      });
      setOrders(ordersData);
      localStorage.setItem('admin_orders_cache', JSON.stringify(ordersData));
    } catch (err) {
      console.warn('Admin orders loading offline. Loading cached:', err);
      const cached = localStorage.getItem('admin_orders_cache');
      if (cached) {
        setOrders(JSON.parse(cached));
      }
    }
  };

  useEffect(() => {
    (async () => {
      await fetchOrders();
    })();
  }, []);

  const callUpdateOrderStatus = async (body) => {
    const idToken = await auth.currentUser.getIdToken();
    const res = await fetch('/api/admin/update-order-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to update order');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    await callUpdateOrderStatus({ orderId, status: newStatus });
    fetchOrders();
  };

  const getTrackingDraft = (order) => trackingDrafts[order.id] ?? {
    courierName: order.courierName || '',
    trackingNumber: order.trackingNumber || '',
    trackingUrl: order.trackingUrl || '',
  };

  const setTrackingField = (orderId, order, field, value) => {
    setTrackingDrafts((prev) => ({
      ...prev,
      [orderId]: { ...getTrackingDraft(order), ...prev[orderId], [field]: value },
    }));
  };

  const saveTracking = async (orderId, order) => {
    const draft = getTrackingDraft(order);
    setSavingTrackingId(orderId);
    try {
      await callUpdateOrderStatus({ orderId, ...draft });
      await fetchOrders();
    } catch (err) {
      console.error('Failed to save tracking info:', err);
    }
    setSavingTrackingId(null);
  };

  const handleRequestDecision = async (orderId, nextStatus, decision) => {
    const body = { orderId, requestStatus: decision };
    if (decision === 'approved') {
      if (nextStatus === 'cancelled') {
        body.status = 'cancelled';
        body.paymentStatus = 'Cancelled';
      } else if (nextStatus === 'returned') {
        body.status = 'returned';
        body.paymentStatus = 'Refunded';
      }
    }
    await callUpdateOrderStatus(body);
    fetchOrders();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'packed': return 'bg-indigo-100 text-indigo-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'returned': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-brand-navy-900 font-serif">Orders</h1>

      <div className="bg-white rounded-3xl elegant-shadow overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-gray-500 text-lg">No orders yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map((order) => (
              <div key={order.id} className="p-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-5 mb-3">
                      <h3 className="font-bold text-gray-800 text-xl">Order #{order.id.slice(0, 8)}</h3>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-base text-gray-600 mb-2">
                      Customer: <span className="font-semibold text-gray-800">{order.userName}</span> ({order.userEmail})
                    </p>
                    {order.phone && (
                      <p className="text-base text-gray-600 mb-2">
                        Phone Number: <span className="font-semibold text-brand-navy-900">{order.phone}</span>
                      </p>
                    )}
                    <p className="text-base text-gray-600 mb-2">
                      Payment Details: <span className="font-medium text-gray-800 uppercase">{order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : order.paymentMethod}</span> ({order.paymentStatus})
                    </p>
                    <p className="text-base text-gray-600 mb-2">
                      Date: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : new Date(order.createdAt).toLocaleString()}
                    </p>
                    {order.shippingAddress && (
                      <p className="text-base text-gray-600 mb-2">
                        Address: <span className="font-medium">{order.shippingAddress}</span>
                      </p>
                    )}
                    <p className="text-lg font-bold text-brand-navy-900 mt-3">
                      Total: ₹{Number(order.finalTotal || order.total || 0).toFixed(2)}
                    </p>

                    {order.requestType && (
                      <div className="mt-4 p-4 rounded-2xl text-left border select-none max-w-lg bg-orange-50 border-orange-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                            <p className="text-sm font-black text-orange-900 capitalize">
                              ⚠️ {order.requestType === 'cancel' ? 'Cancellation' : 'Return'} Requested
                            </p>
                            <p className="text-xs text-orange-700 mt-1">
                              <span className="font-bold">Reason:</span> {order.requestReason}
                            </p>
                          </div>
                          {order.requestStatus === 'pending' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRequestDecision(order.id, order.requestType === 'cancel' ? 'cancelled' : 'returned', 'approved')}
                                className="bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 rounded-xl text-xxs font-black uppercase transition-all duration-300"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRequestDecision(order.id, null, 'rejected')}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xxs font-black uppercase transition-all duration-300"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <div className="text-xxs font-black uppercase tracking-wider">
                              {order.requestStatus === 'approved' ? (
                                <span className="text-green-700">✓ Approved</span>
                              ) : (
                                <span className="text-red-700">✗ Rejected</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-start lg:items-end gap-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="px-5 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/10 transition-all duration-300"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="packed">Packed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="returned">Returned</option>
                    </select>

                    <div className="text-base text-gray-500 font-medium">
                      Items: {order.items.length}
                    </div>

                    <div className="w-full lg:w-72 bg-brand-cream-100/60 border border-gray-200 rounded-2xl p-4 space-y-2.5 text-left">
                      <p className="text-xxs font-black text-gray-500 uppercase tracking-wider">Shipment Tracking</p>
                      <input
                        type="text"
                        value={getTrackingDraft(order).courierName}
                        onChange={(e) => setTrackingField(order.id, order, 'courierName', e.target.value)}
                        placeholder="Courier name (e.g. Delhivery)"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-navy-900"
                      />
                      <input
                        type="text"
                        value={getTrackingDraft(order).trackingNumber}
                        onChange={(e) => setTrackingField(order.id, order, 'trackingNumber', e.target.value)}
                        placeholder="Tracking / AWB number"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-navy-900"
                      />
                      <input
                        type="url"
                        value={getTrackingDraft(order).trackingUrl}
                        onChange={(e) => setTrackingField(order.id, order, 'trackingUrl', e.target.value)}
                        placeholder="Tracking URL (optional)"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-navy-900"
                      />
                      <button
                        type="button"
                        onClick={() => saveTracking(order.id, order)}
                        disabled={savingTrackingId === order.id}
                        className="w-full bg-brand-navy-900 hover:bg-brand-navy-800 text-white py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {savingTrackingId === order.id ? 'Saving...' : 'Save Tracking Info'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex flex-wrap gap-5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-brand-cream-100 px-5 py-4 rounded-2xl">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={56}
                          height={56}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3";
                          }}
                          className="w-14 h-14 object-cover rounded-xl elegant-shadow"
                        />
                        <div>
                          <p className="text-base font-semibold text-gray-800">{item.name}{item.variantLabel ? ` — ${item.variantLabel}` : ''}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity} • ₹{Number(item.discountedPrice || item.price || 0).toFixed(0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminOrders;
