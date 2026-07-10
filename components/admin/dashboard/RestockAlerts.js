'use client';

import React, { useState } from 'react';
import Link from 'next/link';

function RestockAlerts({ restockNotifications, notificationsLoading, onMarkNotified }) {
  const [fallbackNow] = useState(() => Date.now());

  return (
    <div className="bg-white rounded-2xl elegant-shadow p-8 mt-8 border border-gray-100 text-left">
      <h2 className="text-xl md:text-2xl font-bold text-brand-navy-900 mb-2 font-serif flex items-center gap-2">
        <span>🔔</span>
        <span>Customer Restock Alerts & Leads</span>
      </h2>
      <p className="text-gray-500 text-xxs md:text-xs mb-6 leading-relaxed">
        Below are requests submitted by customers who wish to be notified when out-of-stock jewellery items are restocked. Click on the contact details to email or message them, and click &apos;Mark Notified&apos; once you have updated your inventory!
      </p>

      {notificationsLoading ? (
        <div className="text-center py-10 text-xs text-gray-400">Loading restock alert lists...</div>
      ) : restockNotifications.length === 0 ? (
        <div className="text-center py-10 text-xs text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
          No customer restock leads recorded currently.
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-100 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs text-gray-600 font-sans">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase select-none">
                <th className="p-4">Customer Contact</th>
                <th className="p-4">Requested Product</th>
                <th className="p-4">Requested On</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {restockNotifications.map((alert) => (
                <tr key={alert.id} className="hover:bg-gray-50/30">
                  <td className="p-4 font-semibold text-gray-800">
                    {alert.contact.includes('@') ? (
                      <a href={`mailto:${alert.contact}`} className="text-brand-navy-900 hover:underline flex items-center gap-1">
                        <span>✉️</span>
                        <span>{alert.contact}</span>
                      </a>
                    ) : (
                      <a href={`tel:${alert.contact}`} className="text-brand-navy-900 hover:underline flex items-center gap-1">
                        <span>📞</span>
                        <span>{alert.contact}</span>
                      </a>
                    )}
                  </td>
                  <td className="p-4 font-medium text-gray-700">
                    <Link href={`/product/${alert.productId}`} className="text-gray-800 hover:text-brand-navy-900 hover:underline">
                      {alert.productName}
                    </Link>
                  </td>
                  <td className="p-4 text-gray-400">
                    {new Date(alert.createdAt || fallbackNow).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => onMarkNotified(alert.id)}
                      className="bg-green-50 hover:bg-green-600 text-green-700 hover:text-white px-3 py-1.5 rounded-lg text-xxs font-bold transition-all border border-green-200"
                    >
                      ✓ Mark Notified
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RestockAlerts;
