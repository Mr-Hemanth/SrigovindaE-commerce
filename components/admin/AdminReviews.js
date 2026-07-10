'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'reviews'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bDate - aDate;
      });
      setReviews(list);
    } catch (err) {
      console.error('Error loading reviews:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-brand-navy-900 font-serif">Reviews</h1>

      <div className="bg-white rounded-3xl elegant-shadow overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-500">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-16 text-center text-gray-500">No reviews yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((review) => {
              const date = review.createdAt?.toDate ? review.createdAt.toDate() : new Date(review.createdAt);
              return (
                <div key={review.id} className="p-6 md:p-8 flex justify-between items-start gap-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-800">{review.author}</span>
                      <span className="text-yellow-400 text-sm tracking-wider">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">{date.toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono">Product ID: {review.productId}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="text-red-600 hover:text-red-800 font-semibold text-sm whitespace-nowrap"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminReviews;
