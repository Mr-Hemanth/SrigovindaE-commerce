'use client';

import React from 'react';
import Link from 'next/link';

function RecentOrders({ recentOrders }) {
  return (
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
              {(!recentOrders || recentOrders.length === 0) ? (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-gray-400">No transactions recorded yet</td>
                </tr>
              ) : (
                recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/50">
                    <td className="py-2.5 font-bold uppercase text-brand-navy-900 font-mono">#{ord.id.slice(-6)}</td>
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
        href="/admin/orders"
        className="text-xxs font-bold text-brand-navy-900 hover:text-brand-navy-800 uppercase tracking-wider text-right block mt-4"
      >
        View all orders →
      </Link>
    </div>
  );
}

export default RecentOrders;
