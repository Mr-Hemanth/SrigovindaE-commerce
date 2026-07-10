'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { validatePhone } from '@/lib/auth-validation';

function CompleteProfile() {
  const { currentUser, savePhoneNumber } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    } else if (currentUser.phone) {
      // Already has a phone on file — nothing to complete here.
      router.push('/');
    }
  }, [currentUser, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    const validation = validatePhone(phone);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await savePhoneNumber(phone.trim());
      router.push('/');
    } catch (err) {
      console.error('Failed to save phone number:', err);
      setError('Could not save your phone number. Please try again.');
    }
    setLoading(false);
  }

  if (!currentUser || currentUser.phone) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-cream-100 to-brand-cream-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl elegant-shadow">
        <div className="text-center">
          <span className="text-5xl block mb-4">📱</span>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 font-serif">Almost There</h2>
          <p className="text-gray-600 mt-2 text-base">
            Add your contact number to finish setting up your account — we&apos;ll use it for order and delivery updates.
          </p>
        </div>

        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              aria-required="true"
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/10 transition-all duration-300 text-base"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CompleteProfile;
