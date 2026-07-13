'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, addDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { buildCustomerDirectory, customersToCsv } from '@/lib/crm';

const SEGMENT_STYLES = {
  VIP: 'bg-brand-gold-500/10 text-brand-gold-700 border-brand-gold-500/30',
  Repeat: 'bg-green-50 text-green-700 border-green-200',
  Active: 'bg-blue-50 text-blue-700 border-blue-200',
  New: 'bg-purple-50 text-purple-700 border-purple-200',
  'At Risk': 'bg-red-50 text-red-700 border-red-200',
  'No Orders': 'bg-gray-50 text-gray-500 border-gray-200',
};

function SegmentBadge({ segment }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xxs font-bold uppercase tracking-wider border ${SEGMENT_STYLES[segment] || SEGMENT_STYLES['No Orders']}`}>
      {segment}
    </span>
  );
}

function downloadCsv(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function AdminCustomers() {
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [sortKey, setSortKey] = useState('totalSpent');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersSnap, ordersSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'orders')),
        ]);
        setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setOrders(ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error loading customers:', err);
        showNotification('Could not load customer data.', 'error');
      }
      setLoading(false);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const directory = useMemo(() => buildCustomerDirectory(users, orders), [users, orders]);

  const summary = useMemo(() => {
    const now = new Date();
    const thisMonth = directory.filter((c) => {
      const joined = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
      return joined.getMonth() === now.getMonth() && joined.getFullYear() === now.getFullYear();
    });
    return {
      total: directory.length,
      vip: directory.filter((c) => c.segment === 'VIP').length,
      atRisk: directory.filter((c) => c.segment === 'At Risk').length,
      newThisMonth: thisMonth.length,
      lifetimeRevenue: directory.reduce((sum, c) => sum + c.totalSpent, 0),
    };
  }, [directory]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = directory.filter((c) => {
      if (segmentFilter !== 'all' && c.segment !== segmentFilter) return false;
      if (!q) return true;
      return (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.phone || '').includes(q);
    });
    list = [...list].sort((a, b) => {
      if (sortKey === 'totalSpent') return b.totalSpent - a.totalSpent;
      if (sortKey === 'orderCount') return b.orderCount - a.orderCount;
      if (sortKey === 'lastOrder') return (b.lastOrderDate?.getTime() || 0) - (a.lastOrderDate?.getTime() || 0);
      if (sortKey === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });
    return list;
  }, [directory, search, segmentFilter, sortKey]);

  async function openCustomer(customer) {
    setSelectedCustomer(customer);
    setNotes([]);
    setNotesLoading(true);
    try {
      const q = query(collection(db, 'customer_notes'), where('userId', '==', customer.id), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error loading customer notes:', err);
    }
    setNotesLoading(false);
  }

  async function submitNote() {
    if (!newNote.trim() || !selectedCustomer) return;
    setSavingNote(true);
    try {
      const docRef = await addDoc(collection(db, 'customer_notes'), {
        userId: selectedCustomer.id,
        text: newNote.trim(),
        createdBy: currentUser?.email || 'admin',
        createdAt: serverTimestamp(),
      });
      setNotes((prev) => [{ id: docRef.id, userId: selectedCustomer.id, text: newNote.trim(), createdBy: currentUser?.email, createdAt: new Date() }, ...prev]);
      setNewNote('');
    } catch (err) {
      console.error('Error saving note:', err);
      showNotification('Could not save note.', 'error');
    }
    setSavingNote(false);
  }

  function exportCsv() {
    downloadCsv(customersToCsv(filtered), `customers-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  if (loading) {
    return <div className="p-16 text-center text-gray-500">Loading customers...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-brand-navy-900 font-serif">Customers</h1>
        <button
          onClick={exportCsv}
          className="bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white px-6 py-3 rounded-xl hover:from-brand-navy-800 hover:to-brand-navy-900 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl text-sm"
        >
          ⬇️ Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Customers', value: summary.total },
          { label: 'VIP', value: summary.vip },
          { label: 'Repeat/Active', value: directory.filter((c) => c.segment === 'Repeat' || c.segment === 'Active').length },
          { label: 'At Risk', value: summary.atRisk },
          { label: 'Lifetime Revenue', value: `₹${summary.lifetimeRevenue.toLocaleString('en-IN')}` },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl elegant-shadow p-5">
            <p className="text-xxs font-bold uppercase tracking-wider text-gray-400">{stat.label}</p>
            <p className="text-2xl font-bold text-brand-navy-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl elegant-shadow p-5 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="flex-1 min-w-[220px] px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-navy-900"
        />
        <select
          value={segmentFilter}
          onChange={(e) => setSegmentFilter(e.target.value)}
          className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-navy-900"
        >
          <option value="all">All Segments</option>
          {['VIP', 'Repeat', 'Active', 'New', 'At Risk', 'No Orders'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-navy-900"
        >
          <option value="totalSpent">Sort: Total Spent</option>
          <option value="orderCount">Sort: Order Count</option>
          <option value="lastOrder">Sort: Last Order</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {/* Directory table */}
      <div className="bg-white rounded-3xl elegant-shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-brand-cream-100 to-brand-cream-200">
            <tr>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Customer</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Segment</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Orders</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Total Spent</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Last Order</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-16 text-center text-gray-500">No customers match your filters.</td>
              </tr>
            ) : filtered.map((c) => (
              <tr key={c.id} className="hover:bg-brand-cream-100 transition-colors">
                <td className="px-8 py-5">
                  <p className="font-semibold text-gray-800">{c.name || 'Unnamed'}</p>
                  <p className="text-xs text-gray-500">{c.email}</p>
                  {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                </td>
                <td className="px-8 py-5"><SegmentBadge segment={c.segment} /></td>
                <td className="px-8 py-5 text-gray-700 font-medium">{c.orderCount}</td>
                <td className="px-8 py-5 text-gray-800 font-bold">₹{c.totalSpent.toLocaleString('en-IN')}</td>
                <td className="px-8 py-5 text-gray-600 text-sm">
                  {c.lastOrderDate ? c.lastOrderDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                </td>
                <td className="px-8 py-5">
                  <button onClick={() => openCustomer(c)} className="text-brand-navy-900 hover:text-brand-navy-800 font-semibold text-sm transition-colors">
                    View →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer detail modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in" onClick={() => setSelectedCustomer(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-8 animate-slide-up">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-brand-navy-900 font-serif">{selectedCustomer.name || 'Unnamed Customer'}</h2>
                <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
                {selectedCustomer.phone && <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>}
                <div className="mt-2"><SegmentBadge segment={selectedCustomer.segment} /></div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} aria-label="Close" className="text-gray-400 hover:text-gray-700 text-2xl leading-none">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-brand-cream-100 rounded-xl p-4 text-center">
                <p className="text-xxs uppercase tracking-wider text-gray-500 font-bold">Orders</p>
                <p className="text-xl font-bold text-brand-navy-900">{selectedCustomer.orderCount}</p>
              </div>
              <div className="bg-brand-cream-100 rounded-xl p-4 text-center">
                <p className="text-xxs uppercase tracking-wider text-gray-500 font-bold">Total Spent</p>
                <p className="text-xl font-bold text-brand-navy-900">₹{selectedCustomer.totalSpent.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-brand-cream-100 rounded-xl p-4 text-center">
                <p className="text-xxs uppercase tracking-wider text-gray-500 font-bold">Avg Order Value</p>
                <p className="text-xl font-bold text-brand-navy-900">₹{Math.round(selectedCustomer.avgOrderValue).toLocaleString('en-IN')}</p>
              </div>
            </div>

            {selectedCustomer.addresses?.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-brand-navy-900 uppercase tracking-wider mb-3">Saved Addresses</h3>
                <div className="space-y-2">
                  {selectedCustomer.addresses.map((addr) => (
                    <div key={addr.id} className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
                      {addr.area}, {addr.city}, {addr.state} - {addr.pincode} (Phone: {addr.phone})
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-sm font-bold text-brand-navy-900 uppercase tracking-wider mb-3">Order History</h3>
              {selectedCustomer.orders.length === 0 ? (
                <p className="text-sm text-gray-400">No orders yet.</p>
              ) : (
                <div className="space-y-2">
                  {[...selectedCustomer.orders]
                    .sort((a, b) => new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt) - new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt))
                    .map((o) => (
                      <div key={o.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg p-3">
                        <span className="font-mono text-gray-600">#{o.id.slice(-8).toUpperCase()}</span>
                        <span className="text-gray-500">
                          {(o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt)).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="capitalize text-gray-600">{o.status}</span>
                        <span className="font-bold text-brand-navy-900">₹{Number(o.finalTotal || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-brand-navy-900 uppercase tracking-wider mb-3">Admin Notes</h3>
              <div className="flex gap-2 mb-4">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this customer (follow-ups, preferences, complaints...)"
                  rows={2}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-navy-900 resize-none"
                />
                <button
                  onClick={submitNote}
                  disabled={savingNote || !newNote.trim()}
                  className="bg-brand-navy-900 hover:bg-brand-navy-800 text-white px-5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {savingNote ? 'Saving...' : 'Add'}
                </button>
              </div>
              {notesLoading ? (
                <p className="text-xs text-gray-400">Loading notes...</p>
              ) : notes.length === 0 ? (
                <p className="text-xs text-gray-400">No notes yet.</p>
              ) : (
                <div className="space-y-2">
                  {notes.map((n) => (
                    <div key={n.id} className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                      <p className="text-sm text-gray-800">{n.text}</p>
                      <p className="text-xxs text-gray-400 mt-1">
                        {n.createdBy} · {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : 'just now'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCustomers;
