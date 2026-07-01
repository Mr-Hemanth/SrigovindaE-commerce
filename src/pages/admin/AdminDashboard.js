import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, coupons: 0 });
  const { isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const productsSnap = await getDocs(collection(db, 'products'));
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const usersSnap = await getDocs(collection(db, 'users'));
        const couponsSnap = await getDocs(collection(db, 'coupons'));
        
        const newStats = {
          products: productsSnap.size,
          orders: ordersSnap.size,
          users: usersSnap.size,
          coupons: couponsSnap.size
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#f0f5fa] to-[#f7f2ed]">
        <div className="text-center bg-white rounded-3xl elegant-shadow p-12 max-w-md">
          <h2 className="text-3xl font-bold text-[#0f2a4a] mb-4 font-serif">Access Denied</h2>
          <p className="text-gray-600 mb-8 text-lg">You do not have permission to access this page.</p>
          <Link to="/" className="inline-block bg-gradient-to-r from-[#0f2a4a] to-[#1b4965] text-white px-8 py-4 rounded-xl hover:from-[#1b4965] hover:to-[#0f2a4a] transition-all duration-300 font-semibold text-lg shadow-lg">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-3xl elegant-shadow p-8 sticky top-28">
            <h2 className="text-2xl font-bold text-[#0f2a4a] mb-8 font-serif">Admin Panel</h2>
            <nav className="space-y-3">
              <Link 
                to="/admin" 
                className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 ${location.pathname === '/admin' ? 'bg-gradient-to-r from-[#0f2a4a] to-[#1b4965] text-white shadow-lg' : 'text-gray-700 hover:bg-[#f0f5fa]'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Dashboard
              </Link>
              <Link 
                to="/admin/products" 
                className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 ${location.pathname === '/admin/products' ? 'bg-gradient-to-r from-[#0f2a4a] to-[#1b4965] text-white shadow-lg' : 'text-gray-700 hover:bg-[#f0f5fa]'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Products
              </Link>
              <Link 
                to="/admin/orders" 
                className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 ${location.pathname === '/admin/orders' ? 'bg-gradient-to-r from-[#0f2a4a] to-[#1b4965] text-white shadow-lg' : 'text-gray-700 hover:bg-[#f0f5fa]'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Orders
              </Link>
              <Link 
                to="/admin/coupons" 
                className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 ${location.pathname === '/admin/coupons' ? 'bg-gradient-to-r from-[#0f2a4a] to-[#1b4965] text-white shadow-lg' : 'text-gray-700 hover:bg-[#f0f5fa]'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                Coupons
              </Link>
            </nav>
          </div>
        </aside>

        <main className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="bg-white rounded-2xl elegant-shadow p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Products</p>
                  <p className="text-4xl font-bold text-[#0f2a4a]">{stats.products}</p>
                </div>
                <div className="w-14 h-14 bg-[#f0f5fa] rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-[#0f2a4a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl elegant-shadow p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Orders</p>
                  <p className="text-4xl font-bold text-[#0f2a4a]">{stats.orders}</p>
                </div>
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl elegant-shadow p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Users</p>
                  <p className="text-4xl font-bold text-[#0f2a4a]">{stats.users}</p>
                </div>
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl elegant-shadow p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Active Coupons</p>
                  <p className="text-4xl font-bold text-[#0f2a4a]">{stats.coupons}</p>
                </div>
                <div className="w-14 h-14 bg-[#d4af37]/20 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl elegant-shadow p-10">
            <h2 className="text-2xl font-bold text-[#0f2a4a] mb-4 font-serif">Welcome to Admin Dashboard</h2>
            <p className="text-gray-600 text-lg">Manage your jewellery store efficiently. Add products, track orders, and create coupon codes for your Instagram followers!</p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
