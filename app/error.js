'use client';

import { useEffect } from 'react';
import Link from 'next/link';

function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen py-16 px-4 bg-gradient-to-br from-brand-cream-100 to-brand-cream-200 flex items-center justify-center select-none text-left">
      <div className="max-w-md w-full bg-white rounded-3xl elegant-shadow p-8 text-center border border-gray-100 space-y-6">

        <div className="space-y-2">
          <span className="text-6xl md:text-8xl block">💍</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-brand-navy-900 font-serif">Something Went Wrong</h1>
          <p className="text-xs text-gray-400">We hit an unexpected snag loading this page. Please try again.</p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => reset()}
            className="w-full bg-brand-navy-900 hover:bg-brand-navy-800 text-white py-3.5 rounded-xl font-bold text-xs shadow-md transition-all"
          >
            Try Again
          </button>
          <Link href="/" className="text-xs text-gray-400 font-bold hover:underline">
            Return to Home Page
          </Link>
        </div>

      </div>
    </div>
  );
}

export default ErrorBoundary;
