'use client';

import React from 'react';

// dailyRevenue: [{ date: 'YYYY-MM-DD', revenue: number }, ...] oldest -> newest
function SalesTrend({ dailyRevenue }) {
  const width = 600;
  const height = 200;
  const padding = { top: 16, right: 12, bottom: 24, left: 12 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const values = dailyRevenue.map((d) => d.revenue);
  const max = Math.max(1, ...values);

  const points = dailyRevenue.map((d, i) => {
    const x = padding.left + (dailyRevenue.length > 1 ? (i / (dailyRevenue.length - 1)) * plotW : plotW / 2);
    const y = padding.top + plotH - (d.revenue / max) * plotH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1]?.x.toFixed(1)} ${padding.top + plotH} L ${points[0]?.x.toFixed(1)} ${padding.top + plotH} Z`;

  const formatShortDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Show roughly 5 evenly-spaced x-axis labels rather than one per day.
  const labelStep = Math.max(1, Math.ceil(dailyRevenue.length / 5));

  return (
    <div className="bg-white rounded-2xl elegant-shadow p-6 border border-gray-50 text-left">
      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6">Revenue — Last {dailyRevenue.length} Days</h3>
      {dailyRevenue.every((d) => d.revenue === 0) ? (
        <p className="text-xs text-gray-400 py-10 text-center">No revenue recorded in this period yet.</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Daily revenue trend">
          <defs>
            <linearGradient id="salesTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a1a1a" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#salesTrendFill)" />
          <path d={linePath} fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => (
            <g key={p.date}>
              <circle cx={p.x} cy={p.y} r="3" fill="#1a1a1a">
                <title>{formatShortDate(p.date)}: ₹{p.revenue.toFixed(0)}</title>
              </circle>
              {i % labelStep === 0 && (
                <text x={p.x} y={height - 6} textAnchor="middle" className="fill-gray-400" style={{ fontSize: 9 }}>
                  {formatShortDate(p.date)}
                </text>
              )}
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}

export default SalesTrend;
