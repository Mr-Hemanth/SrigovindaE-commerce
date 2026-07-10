'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function AccountDropdown() {
  const { currentUser, isAdmin, logout } = useAuth();
  const router = useRouter();
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setIsAccountOpen(false);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (!currentUser) {
    return (
      <>
        <Link href="/login" className="text-brand-cream-100 hover:text-white transition-all duration-300 font-medium text-sm">Login</Link>
        <Link href="/signup" className="bg-brand-gold-500 text-brand-navy-950 px-5 py-2 rounded-xl hover:bg-brand-gold-600 transition-all duration-300 font-bold text-xs shadow-md">Sign Up</Link>
      </>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsAccountOpen(!isAccountOpen)}
        className="text-brand-cream-100 hover:text-white transition-all duration-300 flex items-center gap-1.5 focus:outline-none font-medium text-sm"
        title="Account Options"
      >
        👤 Account <span className="text-[8px] opacity-70">▼</span>
      </button>

      {isAccountOpen && (
        <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 text-left animate-slide-up text-gray-800">
          <div className="p-2 space-y-1">
            <Link
              href="/profile"
              onClick={() => setIsAccountOpen(false)}
              className="block px-4 py-2.5 text-xs font-bold hover:bg-gray-50 rounded-xl transition-colors"
            >
              👤 Profile Settings
            </Link>
            <Link
              href="/orders"
              onClick={() => setIsAccountOpen(false)}
              className="block px-4 py-2.5 text-xs font-bold hover:bg-gray-50 rounded-xl transition-colors"
            >
              📦 Order History
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsAccountOpen(false)}
                className="block px-4 py-2.5 text-xs font-bold hover:bg-gray-50 rounded-xl text-brand-gold-500 transition-colors"
              >
                🛠️ Admin Panel
              </Link>
            )}
            <button
              onClick={() => { setIsAccountOpen(false); handleLogout(); }}
              className="w-full text-left block px-4 py-2.5 text-xs font-bold hover:bg-red-50 text-red-600 rounded-xl transition-colors"
            >
              ✕ Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountDropdown;
