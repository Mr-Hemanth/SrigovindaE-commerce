'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'newsletter_subscribers'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const aDate = a.subscribedAt?.toDate ? a.subscribedAt.toDate() : new Date(a.subscribedAt);
        const bDate = b.subscribedAt?.toDate ? b.subscribedAt.toDate() : new Date(b.subscribedAt);
        return bDate - aDate;
      });
      setSubscribers(list);
    } catch (err) {
      console.error('Error loading subscribers:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await fetchSubscribers();
    })();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this subscriber? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'newsletter_subscribers', id));
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Error deleting subscriber:', err);
    }
  };

  const handleExportCsv = () => {
    const rows = [['Email', 'Subscribed At'], ...subscribers.map((s) => {
      const date = s.subscribedAt?.toDate ? s.subscribedAt.toDate() : new Date(s.subscribedAt);
      return [s.email, date.toISOString()];
    })];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-brand-navy-900 font-serif">Newsletter Subscribers</h1>
        {subscribers.length > 0 && (
          <button
            onClick={handleExportCsv}
            className="bg-brand-navy-900 hover:bg-brand-navy-800 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-md"
          >
            Export CSV
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl elegant-shadow overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-500">Loading subscribers...</div>
        ) : subscribers.length === 0 ? (
          <div className="p-16 text-center text-gray-500">No subscribers yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {subscribers.map((s) => {
              const date = s.subscribedAt?.toDate ? s.subscribedAt.toDate() : new Date(s.subscribedAt);
              return (
                <div key={s.id} className="p-6 flex justify-between items-center gap-6">
                  <div>
                    <p className="font-semibold text-gray-800">{s.email}</p>
                    <p className="text-xs text-gray-400 font-mono">{date.toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-red-600 hover:text-red-800 font-semibold text-sm whitespace-nowrap"
                  >
                    Remove
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

export default AdminSubscribers;
