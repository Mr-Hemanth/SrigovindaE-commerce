'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, addDoc } from 'firebase/firestore';

function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    setStatus('loading');
    try {
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email: trimmed,
        subscribedAt: new Date(),
      });
      setStatus('success');
      setMessage('Thank you! You’re on the list.');
      setEmail('');
    } catch (err) {
      console.error('Newsletter signup failed:', err);
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs md:text-sm font-bold uppercase tracking-wider text-brand-gold-500">Stay In The Loop</h4>
      <p className="text-[11px] md:text-xs text-brand-cream-50/80 max-w-xs">
        Get new collection drops and offers in your inbox.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-xs">
        <label htmlFor="newsletter-email" className="sr-only">Email address</label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={status === 'loading'}
          className="min-w-0 flex-1 px-3 py-2.5 rounded-lg text-xs text-gray-900 placeholder-gray-400 bg-white/95 focus:outline-none focus:ring-2 focus:ring-brand-gold-500 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-navy-950 px-4 py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60 flex-shrink-0"
        >
          {status === 'loading' ? '...' : 'Join'}
        </button>
      </form>
      {message && (
        <p className={`text-[11px] font-semibold ${status === 'error' ? 'text-red-300' : 'text-green-300'}`} role="status">
          {message}
        </p>
      )}
    </div>
  );
}

export default NewsletterSignup;
