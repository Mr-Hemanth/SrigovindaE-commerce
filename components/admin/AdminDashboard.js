'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import DashboardSidebar from '@/components/admin/dashboard/DashboardSidebar';
import StatsGrid from '@/components/admin/dashboard/StatsGrid';
import RevenueBreakdown from '@/components/admin/dashboard/RevenueBreakdown';
import RecentOrders from '@/components/admin/dashboard/RecentOrders';
import PromoSettingsForm from '@/components/admin/dashboard/PromoSettingsForm';
import RestockAlerts from '@/components/admin/dashboard/RestockAlerts';
import SalesTrend from '@/components/admin/dashboard/SalesTrend';
import BestSellers from '@/components/admin/dashboard/BestSellers';
import LowStockAlerts from '@/components/admin/dashboard/LowStockAlerts';

const SALES_TREND_DAYS = 14;
const LOW_STOCK_THRESHOLD = 5;

function toDateKey(value) {
  const d = value?.toDate ? value.toDate() : new Date(value);
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
}

function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, coupons: 0, revenue: 0 });
  const { isAdmin } = useAuth();

  const [promoSettings, setPromoSettings] = useState({
    enabled: false,
    text: 'Festive Flash Sale! Get 10% OFF on all items.',
    endDate: '',
    couponCode: 'FESTIVE10'
  });
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const productsSnap = await getDocs(collection(db, 'products'));
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const usersSnap = await getDocs(collection(db, 'users'));
        const couponsSnap = await getDocs(collection(db, 'coupons'));

        let totalRev = 0;
        let goldRevenue = 0;
        let silverRevenue = 0;
        let panchalohaRevenue = 0;
        let giftsRevenue = 0;

        const sortedOrders = ordersSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        // Build the last N days as a fixed set first so days with zero orders still show as 0.
        const revenueByDay = {};
        for (let i = SALES_TREND_DAYS - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          revenueByDay[d.toISOString().slice(0, 10)] = 0;
        }
        const revenueByProduct = {};

        ordersSnap.docs.forEach(d => {
          const data = d.data();
          if (data.status?.toLowerCase() !== 'cancelled') {
            const val = Number(data.finalTotal || data.total || 0);
            totalRev += val;

            const dayKey = toDateKey(data.createdAt);
            if (dayKey && dayKey in revenueByDay) {
              revenueByDay[dayKey] += val;
            }

            (data.items || []).forEach(item => {
              const cat = item.category?.toLowerCase() || '';
              const price = Number(item.discountedPrice || item.price || 0);
              const qty = Number(item.quantity || 1);
              const cost = price * qty;
              if (cat.includes('gold')) goldRevenue += cost;
              else if (cat.includes('silver')) silverRevenue += cost;
              else if (cat.includes('panchaloha')) panchalohaRevenue += cost;
              else giftsRevenue += cost;

              if (item.id) {
                if (!revenueByProduct[item.id]) revenueByProduct[item.id] = { id: item.id, name: item.name, revenue: 0, units: 0 };
                revenueByProduct[item.id].revenue += cost;
                revenueByProduct[item.id].units += qty;
              }
            });
          }
        });

        const dailyRevenue = Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue }));
        const topProducts = Object.values(revenueByProduct).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
        const lowStockProducts = productsSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(p => p.isActive !== false && Number(p.stock) <= LOW_STOCK_THRESHOLD)
          .sort((a, b) => Number(a.stock) - Number(b.stock))
          .slice(0, 8);

        const newStats = {
          products: productsSnap.size,
          orders: ordersSnap.size,
          users: usersSnap.size,
          coupons: couponsSnap.size,
          revenue: totalRev,
          goldRev: goldRevenue,
          silverRev: silverRevenue,
          panchaRev: panchalohaRevenue,
          giftsRev: giftsRevenue,
          recentOrders: sortedOrders.slice(0, 5),
          dailyRevenue,
          topProducts,
          lowStockProducts,
        };
        setStats(newStats);
        localStorage.setItem('admin_dashboard_stats', JSON.stringify(newStats));
      } catch (err) {
        console.warn('Admin stats load offline. Loading cached:', err);
        const cached = localStorage.getItem('admin_dashboard_stats');
        if (cached) {
          setStats(JSON.parse(cached));
        }
      }
    };

    if (isAdmin) fetchStats();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchPromo = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'promo'));
        if (docSnap.exists()) {
          setPromoSettings(docSnap.data());
        }
      } catch (err) {
        console.warn('Offline promo fetch:', err);
      }
    };
    fetchPromo();
  }, [isAdmin]);

  const [restockNotifications, setRestockNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchNotifications = async () => {
      setNotificationsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'notifications'));
        const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setRestockNotifications(list);
      } catch (err) {
        console.error('Error fetching restock alerts:', err);
      }
      setNotificationsLoading(false);
    };
    fetchNotifications();
  }, [isAdmin]);

  const handleMarkNotified = async (alertId) => {
    if (!window.confirm('Mark this customer restock lead as notified? This will remove it from the dashboard.')) return;
    try {
      await deleteDoc(doc(db, 'notifications', alertId));
      setRestockNotifications(prev => prev.filter(item => item.id !== alertId));
    } catch (err) {
      console.error('Error deleting restock alert:', err);
    }
  };

  const handleSavePromo = async (e) => {
    e.preventDefault();
    setPromoLoading(true);
    setPromoMessage('');
    try {
      await setDoc(doc(db, 'settings', 'promo'), {
        enabled: promoSettings.enabled || false,
        text: (promoSettings.text || '').trim(),
        endDate: promoSettings.endDate || '',
        couponCode: (promoSettings.couponCode || '').trim()
      });
      setPromoMessage('Promo Countdown Banner settings updated successfully!');
      setTimeout(() => setPromoMessage(''), 3000);
    } catch (err) {
      console.error('Error saving promo settings:', err);
      setPromoMessage('Failed to save settings. Please try again.');
    }
    setPromoLoading(false);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-brand-cream-100 to-brand-cream-200">
        <div className="text-center bg-white rounded-3xl elegant-shadow p-12 max-w-md">
          <h2 className="text-3xl font-bold text-brand-navy-900 mb-4 font-serif">Access Denied</h2>
          <p className="text-gray-600 mb-8 text-lg">You do not have permission to access this page.</p>
          <Link href="/" className="inline-block bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white px-8 py-4 rounded-xl hover:from-brand-navy-800 hover:to-brand-navy-900 transition-all duration-300 font-semibold text-lg shadow-lg">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-10">
        <DashboardSidebar />

        <main className="flex-1 min-w-0">
          <StatsGrid stats={stats} />

          {/* Welcome Intro Section */}
          <div className="bg-white rounded-2xl elegant-shadow p-8 mb-8 border border-gray-50 text-left">
            <h2 className="text-xl md:text-2xl font-bold text-brand-navy-900 mb-2 font-serif">Welcome to Admin Dashboard</h2>
            <p className="text-gray-600 text-sm">Manage your jewellery store efficiently. Add products, track orders, and create coupon codes for your Instagram followers!</p>
          </div>

          <div className="mb-8">
            <SalesTrend dailyRevenue={stats.dailyRevenue || []} />
          </div>

          {/* Dynamic Sales Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <RevenueBreakdown stats={stats} />
            <RecentOrders recentOrders={stats.recentOrders} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <BestSellers topProducts={stats.topProducts || []} />
            <LowStockAlerts lowStockProducts={stats.lowStockProducts || []} />
          </div>

          <PromoSettingsForm
            promoSettings={promoSettings}
            setPromoSettings={setPromoSettings}
            promoLoading={promoLoading}
            promoMessage={promoMessage}
            onSave={handleSavePromo}
          />

          <RestockAlerts
            restockNotifications={restockNotifications}
            notificationsLoading={notificationsLoading}
            onMarkNotified={handleMarkNotified}
          />
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
