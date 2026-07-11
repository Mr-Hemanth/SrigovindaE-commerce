'use client';

import React from 'react';
import Link from 'next/link';

// lowStockProducts: [{ id, name, stock }, ...] sorted ascending by stock, already filtered to <= threshold
function LowStockAlerts({ lowStockProducts }) {
  return (
    <div className="bg-white rounded-2xl elegant-shadow p-6 border border-gray-50 text-left">
      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6 flex items-center gap-2">
        <span>⚠️</span> Low Stock
      </h3>
      {lowStockProducts.length === 0 ? (
        <p className="text-xs text-gray-400 py-10 text-center">All products are adequately stocked.</p>
      ) : (
        <div className="space-y-3">
          {lowStockProducts.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 text-xs">
              <span className="font-bold text-gray-700 truncate">{p.name}</span>
              <span className={`flex-shrink-0 px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${
                p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
              </span>
            </div>
          ))}
          <Link href="/admin/products" className="block text-xs font-bold text-brand-navy-900 hover:underline pt-2">
            Manage inventory →
          </Link>
        </div>
      )}
    </div>
  );
}

export default LowStockAlerts;
