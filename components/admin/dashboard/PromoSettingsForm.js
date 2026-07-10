'use client';

import React from 'react';

function PromoSettingsForm({ promoSettings, setPromoSettings, promoLoading, promoMessage, onSave }) {
  return (
    <div className="bg-white rounded-2xl elegant-shadow p-8 mt-8 border border-gray-100">
      <h2 className="text-xl md:text-2xl font-bold text-brand-navy-900 mb-6 font-serif flex items-center gap-2">
        ⏱️ Festive Flash Sale Banner Control
      </h2>

      {promoMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-semibold">
          {promoMessage}
        </div>
      )}

      <form onSubmit={onSave} className="space-y-6">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="promoEnabled"
            checked={promoSettings.enabled || false}
            onChange={(e) => setPromoSettings({ ...promoSettings, enabled: e.target.checked })}
            className="w-5 h-5 text-brand-navy-900 border-gray-300 rounded focus:ring-brand-navy-900"
          />
          <label htmlFor="promoEnabled" className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider cursor-pointer select-none">
            Enable Promotional Countdown Banner
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="promoText" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Banner Announcement Text</label>
            <input
              id="promoText"
              type="text"
              value={promoSettings.text || ''}
              onChange={(e) => setPromoSettings({ ...promoSettings, text: e.target.value })}
              placeholder="e.g. Festive Flash Sale! Get 10% OFF"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-brand-navy-900"
              required
            />
          </div>

          <div>
            <label htmlFor="promoEndDate" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Countdown End Date & Time</label>
            <input
              id="promoEndDate"
              type="datetime-local"
              value={promoSettings.endDate || ''}
              onChange={(e) => setPromoSettings({ ...promoSettings, endDate: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-brand-navy-900"
              required={promoSettings.enabled}
            />
          </div>
        </div>

        <div>
          <label htmlFor="promoCouponCode" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Promo Code Hint (Instagram coupons)</label>
          <input
            id="promoCouponCode"
            type="text"
            value={promoSettings.couponCode || ''}
            onChange={(e) => setPromoSettings({ ...promoSettings, couponCode: e.target.value })}
            placeholder="e.g. follow @srigovindacollections for coupons!"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-brand-navy-900 max-w-md"
          />
        </div>

        <button
          type="submit"
          disabled={promoLoading}
          aria-busy={promoLoading}
          className="bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white px-6 py-3.5 rounded-xl hover:from-brand-navy-800 hover:to-brand-navy-900 transition-all font-semibold text-xs md:text-sm shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {promoLoading ? 'Saving Settings...' : 'Save Promo Banner Settings'}
        </button>
      </form>
    </div>
  );
}

export default PromoSettingsForm;
