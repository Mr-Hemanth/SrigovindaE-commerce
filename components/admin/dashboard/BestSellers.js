'use client';

import React from 'react';

// topProducts: [{ id, name, revenue, units }, ...] sorted desc by revenue, already sliced to top N
function BestSellers({ topProducts }) {
  const maxRevenue = Math.max(1, ...topProducts.map((p) => p.revenue));

  return (
    <div className="bg-white rounded-2xl elegant-shadow p-6 border border-gray-50 text-left">
      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6">Best Sellers</h3>
      {topProducts.length === 0 ? (
        <p className="text-xs text-gray-400 py-10 text-center">No sales recorded yet.</p>
      ) : (
        <div className="space-y-4">
          {topProducts.map((p, idx) => {
            const pct = (p.revenue / maxRevenue) * 100;
            return (
              <div key={p.id} className="space-y-1.5">
                <div className="flex justify-between items-baseline gap-2 text-xs">
                  <span className="font-bold text-gray-700 truncate flex items-center gap-2">
                    <span className="text-gray-300 font-mono">#{idx + 1}</span>
                    {p.name}
                  </span>
                  <span className="font-semibold text-gray-400 flex-shrink-0">₹{p.revenue.toFixed(0)} · {p.units} sold</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-gold-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BestSellers;
