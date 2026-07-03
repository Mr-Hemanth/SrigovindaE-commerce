import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Navbar from './components/Navbar';
import EngagementWidgets from './components/EngagementWidgets';
import Home from './pages/Home';
import Products from './pages/Products';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import ProductDetails from './pages/ProductDetails';
import Footer from './components/Footer';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import RefundPolicy from './pages/RefundPolicy';
import ShippingPolicy from './pages/ShippingPolicy';
import Contact from './pages/Contact';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCoupons from './pages/admin/AdminCoupons';
import { useAuth } from './contexts/AuthContext';

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
          <p className="text-gray-600 mt-2">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }
  
  return children;
}

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <Navbar />
                <EngagementWidgets />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-success" element={<OrderSuccess />} />
                  <Route path="/admin" element={
                    <AdminRoute>
                      <div className="flex">
                        <div className="flex-1">
                          <AdminDashboard />
                        </div>
                      </div>
                    </AdminRoute>
                  } />
                  <Route path="/admin/products" element={
                    <AdminRoute>
                      <div className="flex">
                        <aside className="w-64 hidden lg:block bg-white shadow-lg">
                          <div className="p-6 sticky top-16">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">Admin Panel</h2>
                            <nav className="space-y-2">
                              <a href="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                Dashboard
                              </a>
                              <a href="/admin/products" className="flex items-center gap-3 px-4 py-3 bg-gray-100 text-blue-600 rounded-lg font-medium">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                Products
                              </a>
                              <a href="/admin/orders" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Orders
                              </a>
                              <a href="/admin/coupons" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                                Coupons
                              </a>
                            </nav>
                          </div>
                        </aside>
                        <main className="flex-1 p-8">
                          <AdminProducts />
                        </main>
                      </div>
                    </AdminRoute>
                  } />
                  <Route path="/admin/orders" element={
                    <AdminRoute>
                      <div className="flex">
                        <aside className="w-64 hidden lg:block bg-white shadow-lg">
                          <div className="p-6 sticky top-16">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">Admin Panel</h2>
                            <nav className="space-y-2">
                              <a href="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                Dashboard
                              </a>
                              <a href="/admin/products" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                Products
                              </a>
                              <a href="/admin/orders" className="flex items-center gap-3 px-4 py-3 bg-gray-100 text-blue-600 rounded-lg font-medium">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Orders
                              </a>
                              <a href="/admin/coupons" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                                Coupons
                              </a>
                            </nav>
                          </div>
                        </aside>
                        <main className="flex-1 p-8">
                          <AdminOrders />
                        </main>
                      </div>
                    </AdminRoute>
                  } />
                  <Route path="/admin/coupons" element={
                    <AdminRoute>
                      <div className="flex">
                        <aside className="w-64 hidden lg:block bg-white shadow-lg">
                          <div className="p-6 sticky top-16">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">Admin Panel</h2>
                            <nav className="space-y-2">
                              <a href="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                Dashboard
                              </a>
                              <a href="/admin/products" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                Products
                              </a>
                              <a href="/admin/orders" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Orders
                              </a>
                              <a href="/admin/coupons" className="flex items-center gap-3 px-4 py-3 bg-gray-100 text-blue-600 rounded-lg font-medium">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                                Coupons
                              </a>
                            </nav>
                          </div>
                        </aside>
                        <main className="flex-1 p-8">
                          <AdminCoupons />
                        </main>
                      </div>
                    </AdminRoute>
                  } />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/refund-policy" element={<RefundPolicy />} />
                  <Route path="/shipping-policy" element={<ShippingPolicy />} />
                  <Route path="/contact" element={<Contact />} />
                </Routes>
                <Footer />
              </div>
            </Router>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
