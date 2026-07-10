'use client';

import React from 'react';

function RevenueBreakdown({ stats }) {
  return (
    <div className="bg-white rounded-2xl elegant-shadow p-6 border border-gray-50 text-left">
      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6">Sales Contribution by Category</h3>

      <div className="space-y-4">
        {[
          { name: "German Silver", value: stats.silverRev, color: "bg-brand-navy-900" },
          { name: "1 Gram Gold Jewellery", value: stats.goldRev, color: "bg-brand-gold-500" },
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
  );
}

export default RevenueBreakdown;
