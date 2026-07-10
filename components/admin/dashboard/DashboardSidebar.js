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
        </nav>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
