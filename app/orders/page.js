'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import OrderCard from '@/components/orders/OrderCard';
import RequestModal from '@/components/orders/RequestModal';
import { downloadOrderInvoice } from '@/lib/print-invoice';

function Orders() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { showNotification } = useNotification();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Request Cancellation / Return States
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestOrderId, setRequestOrderId] = useState(null);
  const [requestType, setRequestType] = useState('cancel');
  const [requestReason, setRequestReason] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

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

  const handleOpenRequestModal = (orderId, type) => {
    setRequestOrderId(orderId);
    setRequestType(type);
    setRequestReason('');
    setRequestModalOpen(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!requestReason.trim()) return;
    setSubmittingRequest(true);
    try {
      const updateData = {
        requestType,
        requestReason: requestReason.trim(),
        requestStatus: 'pending',
        requestDate: new Date().toISOString()
      };

      await updateDoc(doc(db, 'orders', requestOrderId), updateData);

      // Update local state dynamically
      setOrders(prev => prev.map(o =>
        o.id === requestOrderId ? { ...o, ...updateData } : o
      ));

      // Sync with local cache
      const cached = localStorage.getItem(`orders_${currentUser.uid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        const updatedCached = parsed.map(o =>
          o.id === requestOrderId ? { ...o, ...updateData } : o
        );
        localStorage.setItem(`orders_${currentUser.uid}`, JSON.stringify(updatedCached));
      }

      showNotification(`${requestType === 'cancel' ? 'Cancellation' : 'Return'} request submitted successfully.`, 'success');
      setRequestModalOpen(false);
      setRequestReason('');
    } catch (err) {
      console.error('Error submitting request:', err);
      showNotification('Could not submit request. Please try again.', 'error');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'packed':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
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
          <h1 className="text-2xl md:text-4xl font-bold text-brand-navy-900 font-serif">Order History</h1>
          <p className="text-sm text-gray-500 mt-1">Review all your previous orders, invoices, and shipment tracking.</p>
        </div>
        <Link
          href="/products"
          className="bg-brand-navy-900 hover:bg-brand-navy-800 text-white px-5 py-3 rounded-xl font-semibold shadow-md transition-all duration-300 text-sm"
        >
          Continue Shopping
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 bg-white rounded-3xl elegant-shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-navy-900 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Fetching your order history securely...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl elegant-shadow border border-gray-100">
          <span className="text-5xl block mb-4">📦</span>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 font-serif">No Orders Found</h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm">You haven&apos;t placed any orders yet. Explore our exquisite jewellery collections and check out your first order!</p>
          <Link
            href="/products"
            className="inline-block bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white px-8 py-4 rounded-xl hover:from-brand-navy-800 hover:to-brand-navy-900 transition-all duration-300 font-bold shadow-md hover:shadow-lg"
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
              aria-label="Search orders by ID or product name"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/5 bg-white elegant-shadow"
            />
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl elegant-shadow border border-dashed border-gray-250 text-gray-400">
              <span className="text-4xl block mb-2">🔍</span>
              <p className="text-sm font-semibold">No orders match your search query.</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs font-bold text-brand-navy-900 hover:underline"
              >
                Clear Search Query
              </button>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isExpanded={expandedOrderId === order.id}
                onToggleExpand={toggleExpandOrder}
                onDownloadInvoice={downloadOrderInvoice}
                onCancelOrder={handleCancelOrder}
                onOpenRequestModal={handleOpenRequestModal}
                getStatusBadgeClass={getStatusBadgeClass}
              />
            ))
          )}
        </div>
      )}
      {/* Cancellation / Return Request Modal Dialog */}
      {requestModalOpen && (
        <RequestModal
          requestType={requestType}
          requestReason={requestReason}
          setRequestReason={setRequestReason}
          submittingRequest={submittingRequest}
          onClose={() => setRequestModalOpen(false)}
          onSubmit={handleSubmitRequest}
        />
      )}
    </div>
  );
}

export default Orders;
