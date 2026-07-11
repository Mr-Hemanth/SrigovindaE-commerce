'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="lg:w-72 flex-shrink-0">
      <div className="bg-white rounded-3xl elegant-shadow p-8 sticky top-28">
        <h2 className="text-2xl font-bold text-brand-navy-900 mb-8 font-serif">Admin Panel</h2>
        <nav className="space-y-3">
          <Link
            href="/admin"
            className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 ${pathname === '/admin' ? 'bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white shadow-lg' : 'text-gray-700 hover:bg-brand-cream-100'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard
          </Link>
          <Link
            href="/admin/products"
            className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 ${pathname === '/admin/products' ? 'bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white shadow-lg' : 'text-gray-700 hover:bg-brand-cream-100'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Products
          </Link>
          <Link
            href="/admin/orders"
            className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 ${pathname === '/admin/orders' ? 'bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white shadow-lg' : 'text-gray-700 hover:bg-brand-cream-100'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Orders
          </Link>
          <Link
            href="/admin/coupons"
            className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 ${pathname === '/admin/coupons' ? 'bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white shadow-lg' : 'text-gray-700 hover:bg-brand-cream-100'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            Coupons
          </Link>
          <Link
            href="/admin/reviews"
            className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 ${pathname === '/admin/reviews' ? 'bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white shadow-lg' : 'text-gray-700 hover:bg-brand-cream-100'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Reviews
          </Link>
          <Link
            href="/admin/subscribers"
            className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 ${pathname === '/admin/subscribers' ? 'bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white shadow-lg' : 'text-gray-700 hover:bg-brand-cream-100'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Subscribers
          </Link>
        </nav>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
