import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, coupons: 0, revenue: 0 });
  const { isAdmin } = useAuth();
  const location = useLocation();

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

        ordersSnap.docs.forEach(d => {
          const data = d.data();
          if (data.status?.toLowerCase() !== 'cancelled') {
            const val = Number(data.finalTotal || data.total || 0);
            totalRev += val;
            (data.items || []).forEach(item => {
              const cat = item.category?.toLowerCase() || '';
              const price = Number(item.discountedPrice || item.price || 0);
              const qty = Number(item.quantity || 1);
              const cost = price * qty;
              if (cat.includes('gold')) goldRevenue += cost;
              else if (cat.includes('silver')) silverRevenue += cost;
              else if (cat.includes('panchaloha')) panchalohaRevenue += cost;
              else giftsRevenue += cost;
            });
          }
        });

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
          recentOrders: sortedOrders.slice(0, 5)
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-5 mb-10">
            {/* Total Products */}
            <div className="bg-white rounded-2xl elegant-shadow p-5 border border-gray-50 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Total Products</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.products}</p>
              </div>
              <span className="text-xl p-2 bg-gray-50 rounded-xl">📦</span>
            </div>

            {/* Total Orders */}
            <div className="bg-white rounded-2xl elegant-shadow p-5 border border-gray-50 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.orders}</p>
              </div>
              <span className="text-xl p-2 bg-green-50 rounded-xl">🛒</span>
            </div>

            {/* Total Users */}
            <div className="bg-white rounded-2xl elegant-shadow p-5 border border-gray-50 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Total Users</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.users}</p>
              </div>
              <span className="text-xl p-2 bg-purple-50 rounded-xl">👤</span>
            </div>

            {/* Active Coupons */}
            <div className="bg-white rounded-2xl elegant-shadow p-5 border border-gray-50 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Active Coupons</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.coupons}</p>
              </div>
              <span className="text-xl p-2 bg-amber-50 rounded-xl">🎫</span>
            </div>

            {/* Average Order Value */}
            <div className="bg-white rounded-2xl elegant-shadow p-5 border border-gray-50 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Avg Order Value</p>
                <p className="text-xl font-bold text-gray-800 mt-1">₹{Number((stats.revenue || 0) / (stats.orders || 1)).toFixed(0)}</p>
              </div>
              <span className="text-xl p-2 bg-[#d4af37]/15 rounded-xl">📈</span>
            </div>

            {/* Total Revenue */}
            <div className="bg-white rounded-2xl elegant-shadow p-5 border border-gray-50 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Total Revenue</p>
                <p className="text-xl font-black text-[#d4af37] font-serif mt-1">₹{Number(stats.revenue || 0).toFixed(0)}</p>
              </div>
              <span className="text-xl p-2 bg-yellow-50 rounded-xl">💸</span>
            </div>
          </div>

          {/* Welcome Intro Section */}
          <div className="bg-white rounded-2xl elegant-shadow p-8 mb-8 border border-gray-50 text-left">
            <h2 className="text-xl md:text-2xl font-bold text-[#0f2a4a] mb-2 font-serif">Welcome to Admin Dashboard</h2>
            <p className="text-gray-600 text-sm">Manage your jewellery store efficiently. Add products, track orders, and create coupon codes for your Instagram followers!</p>
          </div>

          {/* Dynamic Sales Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Box: Category Sales Progress Bars */}
            <div className="bg-white rounded-2xl elegant-shadow p-6 border border-gray-50 text-left">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6">Sales Contribution by Category</h3>
              
              <div className="space-y-4">
                {[
                  { name: "German Silver", value: stats.silverRev, color: "bg-[#0f2a4a]" },
                  { name: "1 Gram Gold Jewellery", value: stats.goldRev, color: "bg-[#d4af37]" },
                  { name: "Panchaloha", value: stats.panchaRev, color: "bg-[#8b5a2b]" },
                  { name: "Gift Articles", value: stats.giftsRev, color: "bg-[#e74c3c]" }
                ].map((item) => {
                  const pct = stats.revenue > 0 ? (item.value / stats.revenue) * 100 : 0;
                  return (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-gray-700">{item.name}</span>
                        <span className="font-semibold text-gray-400">₹{Number(item.value || 0).toFixed(0)} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Box: Recent Orders Mini Table */}
            <div className="bg-white rounded-2xl elegant-shadow p-6 border border-gray-50 text-left flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-5">Recent Store Transactions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-gray-600">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase">
                        <th className="py-2.5">OrderID</th>
                        <th className="py-2.5">Customer</th>
                        <th className="py-2.5">Total</th>
                        <th className="py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(!stats.recentOrders || stats.recentOrders.length === 0) ? (
                        <tr>
                          <td colSpan="4" className="text-center py-6 text-gray-400">No transactions recorded yet</td>
                        </tr>
                      ) : (
                        stats.recentOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-gray-50/50">
                            <td className="py-2.5 font-bold uppercase text-[#0f2a4a] font-mono">#{ord.id.slice(-6)}</td>
                            <td className="py-2.5 truncate max-w-[100px]">{ord.userName || 'Anonymous'}</td>
                            <td className="py-2.5 font-bold">₹{(ord.finalTotal || ord.total || 0).toFixed(0)}</td>
                            <td className="py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                ord.status?.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-800' :
                                ord.status?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {ord.status || 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <Link 
                to="/admin/orders" 
                className="text-xxs font-bold text-[#0f2a4a] hover:text-[#1b4965] uppercase tracking-wider text-right block mt-4"
              >
                View all orders →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl elegant-shadow p-8 mt-8 border border-gray-100">
            <h2 className="text-xl md:text-2xl font-bold text-[#0f2a4a] mb-6 font-serif flex items-center gap-2">
              ⏱️ Festive Flash Sale Banner Control
            </h2>

            {promoMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-semibold">
                {promoMessage}
              </div>
            )}

            <form onSubmit={handleSavePromo} className="space-y-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="promoEnabled"
                  checked={promoSettings.enabled || false}
                  onChange={(e) => setPromoSettings({ ...promoSettings, enabled: e.target.checked })}
                  className="w-5 h-5 text-[#0f2a4a] border-gray-300 rounded focus:ring-[#0f2a4a]"
                />
                <label htmlFor="promoEnabled" className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider cursor-pointer select-none">
                  Enable Promotional Countdown Banner
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Banner Announcement Text</label>
                  <input
                    type="text"
                    value={promoSettings.text || ''}
                    onChange={(e) => setPromoSettings({ ...promoSettings, text: e.target.value })}
                    placeholder="e.g. Festive Flash Sale! Get 10% OFF"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-[#0f2a4a]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Countdown End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={promoSettings.endDate || ''}
                    onChange={(e) => setPromoSettings({ ...promoSettings, endDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-[#0f2a4a]"
                    required={promoSettings.enabled}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Promo Code Hint (Instagram coupons)</label>
                <input
                  type="text"
                  value={promoSettings.couponCode || ''}
                  onChange={(e) => setPromoSettings({ ...promoSettings, couponCode: e.target.value })}
                  placeholder="e.g. follow @srigovindacollections for coupons!"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-[#0f2a4a] max-w-md"
                />
              </div>

              <button
                type="submit"
                disabled={promoLoading}
                className="bg-gradient-to-r from-[#0f2a4a] to-[#1b4965] text-white px-6 py-3.5 rounded-xl hover:from-[#1b4965] hover:to-[#0f2a4a] transition-all font-semibold text-xs md:text-sm shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {promoLoading ? 'Saving Settings...' : 'Save Promo Banner Settings'}
              </button>
            </form>
          </div>

          {/* 🔔 Customer Restock Alerts / Leads Manager */}
          <div className="bg-white rounded-2xl elegant-shadow p-8 mt-8 border border-gray-100 text-left">
            <h2 className="text-xl md:text-2xl font-bold text-[#0f2a4a] mb-2 font-serif flex items-center gap-2">
              <span>🔔</span>
              <span>Customer Restock Alerts & Leads</span>
            </h2>
            <p className="text-gray-500 text-xxs md:text-xs mb-6 leading-relaxed">
              Below are requests submitted by customers who wish to be notified when out-of-stock jewellery items are restocked. Click on the contact details to email or message them, and click 'Mark Notified' once you have updated your inventory!
            </p>

            {notificationsLoading ? (
              <div className="text-center py-10 text-xs text-gray-400">Loading restock alert lists...</div>
            ) : restockNotifications.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                No customer restock leads recorded currently.
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs text-gray-600 font-sans">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase select-none">
                      <th className="p-4">Customer Contact</th>
                      <th className="p-4">Requested Product</th>
                      <th className="p-4">Requested On</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {restockNotifications.map((alert) => (
                      <tr key={alert.id} className="hover:bg-gray-50/30">
                        <td className="p-4 font-semibold text-gray-800">
                          {alert.contact.includes('@') ? (
                            <a href={`mailto:${alert.contact}`} className="text-[#0f2a4a] hover:underline flex items-center gap-1">
                              <span>✉️</span>
                              <span>{alert.contact}</span>
                            </a>
                          ) : (
                            <a href={`tel:${alert.contact}`} className="text-[#0f2a4a] hover:underline flex items-center gap-1">
                              <span>📞</span>
                              <span>{alert.contact}</span>
                            </a>
                          )}
                        </td>
                        <td className="p-4 font-medium text-gray-700">
                          <Link to={`/product/${alert.productId}`} className="text-gray-800 hover:text-[#0f2a4a] hover:underline">
                            {alert.productName}
                          </Link>
                        </td>
                        <td className="p-4 text-gray-400">
                          {new Date(alert.createdAt || Date.now()).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleMarkNotified(alert.id)}
                            className="bg-green-50 hover:bg-green-600 text-green-700 hover:text-white px-3 py-1.5 rounded-lg text-xxs font-bold transition-all border border-green-200"
                          >
                            ✓ Mark Notified
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
