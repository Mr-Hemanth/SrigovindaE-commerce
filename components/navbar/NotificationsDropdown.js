'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { db } from '@/lib/firebase/client';
import { doc, onSnapshot, collection, getDocs, query, where } from 'firebase/firestore';

// `mobile` switches between the desktop icon-row styling and the compact
// mobile-controls styling; each rendered instance manages its own bell +
// dropdown open state (see Navbar.js notes on why this isn't shared).
function NotificationsDropdown({ mobile = false }) {
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();

  // Promo state is needed here too so the "Live Discount Offer" notification
  // entry can be generated (mirrors the promo listener in Navbar.js).
  const [promo, setPromo] = useState(null);

  // Notifications center states
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const qOrders = query(collection(db, 'orders'), where('userId', '==', currentUser.uid));
        const snap = await getDocs(qOrders);
        const userOrders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const list = [];

        list.push({
          id: 'welcome',
          title: '✨ Welcome to Srigovinda Collections!',
          message: 'Explore our premium One Gram Gold, German Silver & Panchaloha collections.',
          time: 'Registration'
        });

        if (promo && promo.enabled && promo.couponCode) {
          list.push({
            id: 'promo-offer',
            title: '🔥 Live Discount Offer Active!',
            message: `Use coupon code "${promo.couponCode}" to get special discounts on your order.`,
            time: 'Active Offer'
          });
        }

        userOrders.forEach(order => {
          const formattedId = order.id.slice(0, 8).toUpperCase();
          let title = '';
          let message = '';

          if (order.status === 'pending') {
            title = '📦 Order Received';
            message = `We received your order #${formattedId}. We are verifying details.`;
          } else if (order.status === 'processing') {
            title = '⚙️ Order Processing';
            message = `Order #${formattedId} is currently being packaged with care.`;
          } else if (order.status === 'shipped') {
            title = '🚚 Order Shipped';
            message = `Good news! Order #${formattedId} has been shipped. It will arrive soon.`;
          } else if (order.status === 'delivered') {
            title = '🎉 Order Delivered';
            message = `Order #${formattedId} has been delivered successfully. Please leave a review!`;
          } else if (order.status === 'cancelled') {
            title = '❌ Order Cancelled';
            message = `Order #${formattedId} was cancelled. Refund processed if paid online.`;
          } else if (order.status === 'returned') {
            title = '↩️ Order Returned';
            message = `Return request for order #${formattedId} was approved and item returned.`;
          }

          if (title) {
            list.push({
              id: `order-update-${order.id}`,
              title,
              message,
              time: order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()
            });
          }
        });

        const lastReadTime = Number(localStorage.getItem('srigovinda_notifications_read_time') || 0);
        let unread = 0;

        const processedList = list.map(n => {
          const isOlder = lastReadTime > 0;
          if (isOlder) {
            return { ...n, unread: false };
          }
          unread++;
          return { ...n, unread: true };
        });

        setNotifications(processedList);
        setUnreadCount(unread);
      } catch (err) {
        console.warn('Notifications fetch offline/failed:', err);
      }
    };

    fetchNotifications();
  }, [currentUser, promo]);

  const handleMarkAllRead = () => {
    localStorage.setItem('srigovinda_notifications_read_time', String(Date.now()));
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    setUnreadCount(0);
    showNotification('All notifications marked as read.', 'success');
  };

  if (mobile) {
    return (
      <>
        <button
          onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          className="text-brand-cream-100 relative flex items-center focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold animate-pulse">{unreadCount}</span>
          )}
        </button>

        {isNotificationsOpen && (
          <div className="absolute right-4 top-16 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 text-left animate-slide-up select-none">
            <div className="p-4 bg-gradient-to-r from-brand-navy-950 to-brand-navy-900 text-white flex justify-between items-center">
              <h4 className="text-xs font-black font-serif">Notifications Center</h4>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-full font-bold transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 text-gray-800">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs font-semibold">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notif, index) => (
                  <div key={notif.id || index} className={`p-4 transition-colors ${notif.unread ? 'bg-blue-50/40 hover:bg-blue-50/60' : 'hover:bg-gray-50'}`}>
                    <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <span>{notif.title}</span>
                      {notif.unread && (
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0" />
                      )}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1 leading-normal">{notif.message}</p>
                    <span className="text-[8px] text-gray-400 font-bold block mt-1.5 uppercase tracking-wider">{notif.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
        className="text-brand-cream-100 hover:text-white transition-all duration-300 relative flex items-center focus:outline-none"
        title="View Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-2.5 -right-2.5 bg-red-600 text-white text-[9px] rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">{unreadCount}</span>
        )}
      </button>

      {isNotificationsOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 text-left animate-slide-up select-none">
          <div className="p-4 bg-gradient-to-r from-brand-navy-950 to-brand-navy-900 text-white flex justify-between items-center">
            <h4 className="text-xs font-black font-serif">Notifications Center</h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-full font-bold transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs font-semibold">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif, index) => (
                <div key={notif.id || index} className={`p-4 transition-colors ${notif.unread ? 'bg-blue-50/40 hover:bg-blue-50/60' : 'hover:bg-gray-50'}`}>
                  <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <span>{notif.title}</span>
                    {notif.unread && (
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0" />
                    )}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1 leading-normal">{notif.message}</p>
                  <span className="text-[8px] text-gray-400 font-bold block mt-1.5 uppercase tracking-wider">{notif.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsDropdown;
