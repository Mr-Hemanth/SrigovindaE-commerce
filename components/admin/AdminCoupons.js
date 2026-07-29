'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/client';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useNotification } from '@/contexts/NotificationContext';

const EMPTY_FORM = { code: '', discountPercentage: '', expiryDate: '', maxUsesPerUser: '1' };

// Firestore Timestamp (or Date/ISO string) -> the yyyy-mm-dd string a <input type="date"> needs.
function toDateInputValue(expiryDate) {
  const d = expiryDate?.toDate ? expiryDate.toDate() : new Date(expiryDate);
  return d.toISOString().slice(0, 10);
}

function AdminCoupons() {
  const { showNotification } = useNotification();
  const [coupons, setCoupons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
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

  const closeModal = () => {
    setShowModal(false);
    setEditingCouponId(null);
    setForm(EMPTY_FORM);
  };

  const handleEdit = (coupon) => {
    setEditingCouponId(coupon.id);
    setForm({
      code: coupon.code,
      discountPercentage: String(coupon.discountPercentage),
      expiryDate: toDateInputValue(coupon.expiryDate),
      maxUsesPerUser: coupon.maxUsesPerUser ? String(coupon.maxUsesPerUser) : ''
    });
    setShowModal(true);
  };

  // Best-effort owner-notification email — failures here shouldn't surface as a "coupon save
  // failed" error since the coupon itself is already written to Firestore by this point.
  const notifyCouponCreated = async (payload) => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      await fetch('/api/admin/notify-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Coupon-created email notification failed:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        code: form.code.toUpperCase(),
        discountPercentage: Number(form.discountPercentage),
        expiryDate: new Date(form.expiryDate),
        maxUsesPerUser: form.maxUsesPerUser ? Number(form.maxUsesPerUser) : null,
      };
      if (editingCouponId) {
        await updateDoc(doc(db, 'coupons', editingCouponId), payload);
      } else {
        await addDoc(collection(db, 'coupons'), { ...payload, createdAt: new Date() });
        notifyCouponCreated(payload);
      }

      closeModal();
      fetchCoupons();
      showNotification(editingCouponId ? 'Coupon updated successfully.' : 'Coupon created successfully.', 'success');
    } catch (err) {
      console.error('Error saving coupon: ', err);
      showNotification('Could not save this coupon. Please try again.', 'error');
    }
    setLoading(false);
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await deleteDoc(doc(db, 'coupons', couponId));
      fetchCoupons();
      showNotification('Coupon deleted.', 'success');
    } catch (err) {
      console.error('Error deleting coupon:', err);
      showNotification('Could not delete this coupon. Please try again.', 'error');
    }
  };

  const isExpired = (expiryDate) => {
    return new Date() > (expiryDate.toDate ? expiryDate.toDate() : new Date(expiryDate));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-navy-900 font-serif">Coupons</h1>
        <button
          onClick={() => {
            setEditingCouponId(null);
            setForm(EMPTY_FORM);
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white px-6 py-3 rounded-xl hover:from-brand-navy-800 hover:to-brand-navy-900 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
        >
          + Create Coupon
        </button>
      </div>

      <div className="bg-white rounded-2xl elegant-shadow p-8">
        <h3 className="font-semibold text-gray-800 mb-3 text-lg">💡 Tip for Instagram:</h3>
        <p className="text-gray-600">Create coupon codes and share them on your Instagram posts/stories! Your followers can apply these codes at checkout to get discounts.</p>
        <p className="text-gray-600 mt-2">A new coupon (5-12% off, marked <span className="font-semibold">Auto</span> below) is generated automatically every Monday, Wednesday and Friday morning and stays valid until midnight that day — check back here those mornings for the code to post.</p>
      </div>

      <div className="bg-white rounded-2xl elegant-shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-brand-cream-100 to-brand-cream-200">
            <tr>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Coupon Code</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Discount</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Expires On</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Uses/Customer</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Status</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="hover:bg-brand-cream-100 transition-colors">
                <td className="px-8 py-5">
                  <span className="font-mono font-bold text-brand-navy-900 text-lg">{coupon.code}</span>
                  {coupon.autoGenerated && (
                    <span className="ml-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-cream-200 text-brand-navy-900 border border-brand-gold-500/30 align-middle">Auto</span>
                  )}
                </td>
                <td className="px-8 py-5 text-gray-800 font-semibold text-lg">{coupon.discountPercentage}% OFF</td>
                <td className="px-8 py-5 text-gray-600">
                  {new Date(coupon.expiryDate.toDate ? coupon.expiryDate.toDate() : coupon.expiryDate).toLocaleDateString()}
                </td>
                <td className="px-8 py-5 text-gray-600">
                  {coupon.maxUsesPerUser ? `${coupon.maxUsesPerUser}x` : 'Unlimited'}
                </td>
                <td className="px-8 py-5">
                  {isExpired(coupon.expiryDate) ? (
                    <span className="px-4 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-700">Expired</span>
                  ) : (
                    <span className="px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-700">Active</span>
                  )}
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="text-brand-navy-900 hover:text-brand-navy-700 font-semibold transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="text-red-600 hover:text-red-800 font-semibold transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan="6" className="px-8 py-16 text-center text-gray-500">
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
              <h2 className="text-2xl font-bold text-brand-navy-900 mb-8 font-serif">{editingCouponId ? 'Edit Coupon' : 'Create New Coupon'}</h2>
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Max Uses Per Customer</label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxUsesPerUser}
                    onChange={(e) => setForm({ ...form, maxUsesPerUser: e.target.value })}
                    placeholder="1"
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/10 transition-all duration-300 text-base"
                  />
                  <p className="text-xs text-gray-400 mt-2">Defaults to 1 use per customer. Leave blank for unlimited.</p>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 border-2 border-brand-navy-900 text-brand-navy-900 py-3 rounded-xl hover:bg-brand-cream-100 transition-all duration-300 font-semibold text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white py-3 rounded-xl hover:from-brand-navy-800 hover:to-brand-navy-900 transition-all duration-300 font-semibold text-base shadow-lg disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingCouponId ? 'Save Changes' : 'Create Coupon'}
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
