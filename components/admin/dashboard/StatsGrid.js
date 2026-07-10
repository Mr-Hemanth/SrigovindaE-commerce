'use client';

import React from 'react';

function StatsGrid({ stats }) {
  return (
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
        <span className="text-xl p-2 bg-brand-gold-500/15 rounded-xl">📈</span>
      </div>

      {/* Total Revenue */}
      <div className="bg-white rounded-2xl elegant-shadow p-5 border border-gray-50 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Total Revenue</p>
          <p className="text-xl font-black text-brand-gold-500 font-serif mt-1">₹{Number(stats.revenue || 0).toFixed(0)}</p>
        </div>
        <span className="text-xl p-2 bg-yellow-50 rounded-xl">💸</span>
      </div>
    </div>
  );
}

export default StatsGrid;
