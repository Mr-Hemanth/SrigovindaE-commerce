'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discountPercentage: '',
    expiryDate: ''
  });
  const [loading, setLoading] = useState(false);

  const fetchCoupons = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'coupons'));
      const couponsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCoupons(couponsData);
      localStorage.setItem('admin_coupons_cache', JSON.stringify(couponsData));
    } catch (err) {
      console.warn('Admin coupons loading offline. Loading cached:', err);
      const cached = localStorage.getItem('admin_coupons_cache');
      if (cached) {
        setCoupons(JSON.parse(cached));
      }
    }
  };

  useEffect(() => {
    (async () => {
      await fetchCoupons();
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'coupons'), {
        code: form.code.toUpperCase(),
        discountPercentage: Number(form.discountPercentage),
        expiryDate: new Date(form.expiryDate),
        createdAt: new Date()
      });

      setShowModal(false);
      setForm({ code: '', discountPercentage: '', expiryDate: '' });
      fetchCoupons();
    } catch (err) {
      console.error('Error adding coupon: ', err);
    }
    setLoading(false);
  };

  const handleDelete = async (couponId) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      await deleteDoc(doc(db, 'coupons', couponId));
      fetchCoupons();
    }
  };

  const isExpired = (expiryDate) => {
    return new Date() > (expiryDate.toDate ? expiryDate.toDate() : new Date(expiryDate));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-brand-navy-900 font-serif">Coupons</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white px-6 py-3 rounded-xl hover:from-brand-navy-800 hover:to-brand-navy-900 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
        >
          + Create Coupon
        </button>
      </div>

      <div className="bg-white rounded-2xl elegant-shadow p-8">
        <h3 className="font-semibold text-gray-800 mb-3 text-lg">💡 Tip for Instagram:</h3>
        <p className="text-gray-600">Create coupon codes and share them on your Instagram posts/stories! Your followers can apply these codes at checkout to get discounts.</p>
      </div>

      <div className="bg-white rounded-2xl elegant-shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-brand-cream-100 to-brand-cream-200">
            <tr>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Coupon Code</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Discount</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Expires On</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Status</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="hover:bg-brand-cream-100 transition-colors">
                <td className="px-8 py-5">
                  <span className="font-mono font-bold text-brand-navy-900 text-lg">{coupon.code}</span>
                </td>
                <td className="px-8 py-5 text-gray-800 font-semibold text-lg">{coupon.discountPercentage}% OFF</td>
                <td className="px-8 py-5 text-gray-600">
                  {new Date(coupon.expiryDate.toDate ? coupon.expiryDate.toDate() : coupon.expiryDate).toLocaleDateString()}
                </td>
                <td className="px-8 py-5">
                  {isExpired(coupon.expiryDate) ? (
                    <span className="px-4 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-700">Expired</span>
                  ) : (
                    <span className="px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-700">Active</span>
                  )}
                </td>
                <td className="px-8 py-5">
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="text-red-600 hover:text-red-800 font-semibold transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan="5" className="px-8 py-16 text-center text-gray-500">
                  No coupons yet. Create your first coupon to share on Instagram!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl elegant-shadow max-w-md w-full">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-brand-navy-900 mb-8 font-serif">Create New Coupon</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g., INSTA10, DIWALI20"
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/10 transition-all duration-300 text-base uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Discount Percentage</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={form.discountPercentage}
                    onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })}
                    placeholder="10"
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/10 transition-all duration-300 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/10 transition-all duration-300 text-base"
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setForm({ code: '', discountPercentage: '', expiryDate: '' });
                    }}
                    className="flex-1 border-2 border-brand-navy-900 text-brand-navy-900 py-3 rounded-xl hover:bg-brand-cream-100 transition-all duration-300 font-semibold text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white py-3 rounded-xl hover:from-brand-navy-800 hover:to-brand-navy-900 transition-all duration-300 font-semibold text-base shadow-lg disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Coupon'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCoupons;
