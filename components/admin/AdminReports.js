'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, getDocs } from 'firebase/firestore';
import { useNotification } from '@/contexts/NotificationContext';
import { filterOrdersByDateRange, buildSalesReport, salesReportToCsv, buildInventoryReport, inventoryReportToCsv } from '@/lib/reports';

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

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl elegant-shadow p-5">
      <p className="text-xxs font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-brand-navy-900 mt-1">{value}</p>
    </div>
  );
}

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function AdminReports() {
  const { showNotification } = useNotification();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('sales');

  // Sales date range — defaults to the last 30 days.
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersSnap, productsSnap] = await Promise.all([
          getDocs(collection(db, 'orders')),
          getDocs(collection(db, 'products')),
        ]);
        setOrders(ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setProducts(productsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error loading report data:', err);
        showNotification('Could not load report data.', 'error');
      }
      setLoading(false);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOrders = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
    return filterOrdersByDateRange(orders, start, end);
  }, [orders, startDate, endDate]);

  const salesReport = useMemo(() => buildSalesReport(filteredOrders), [filteredOrders]);
  const inventoryReport = useMemo(() => buildInventoryReport(products), [products]);

  if (loading) {
    return <div className="p-16 text-center text-gray-500">Loading reports...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-brand-navy-900 font-serif">Reports</h1>

      <div className="flex gap-3 border-b border-gray-100">
        <button
          onClick={() => setTab('sales')}
          className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 ${tab === 'sales' ? 'border-brand-navy-900 text-brand-navy-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Sales Report
        </button>
        <button
          onClick={() => setTab('inventory')}
          className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 ${tab === 'inventory' ? 'border-brand-navy-900 text-brand-navy-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Inventory Report
        </button>
      </div>

      {tab === 'sales' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl elegant-shadow p-5 flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="report-start" className="block text-xxs font-bold uppercase tracking-wider text-gray-400 mb-1.5">From</label>
              <input
                id="report-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-navy-900"
              />
            </div>
            <div>
              <label htmlFor="report-end" className="block text-xxs font-bold uppercase tracking-wider text-gray-400 mb-1.5">To</label>
              <input
                id="report-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-navy-900"
              />
            </div>
            <button
              onClick={() => downloadCsv(salesReportToCsv(salesReport.orders), `sales-report-${startDate}-to-${endDate}.csv`)}
              className="ml-auto bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white px-6 py-2.5 rounded-xl hover:from-brand-navy-800 hover:to-brand-navy-900 transition-all duration-300 font-semibold shadow-lg text-sm"
            >
              ⬇️ Export CSV
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Orders" value={salesReport.orderCount} />
            <StatCard label="Revenue" value={money(salesReport.totalRevenue)} />
            <StatCard label="Avg Order Value" value={money(salesReport.avgOrderValue)} />
            <StatCard label="Discount Given" value={money(salesReport.totalDiscount)} />
            <StatCard label="COD Revenue" value={`${money(salesReport.codRevenue)} (${salesReport.codCount})`} />
            <StatCard label="Online Revenue" value={`${money(salesReport.onlineRevenue)} (${salesReport.onlineCount})`} />
            <StatCard label="Cancelled" value={salesReport.cancelledCount} />
            <StatCard label="Returned" value={salesReport.returnedCount} />
          </div>

          <div className="bg-white rounded-3xl elegant-shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-brand-cream-100 to-brand-cream-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy-900 uppercase tracking-wide">Order</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy-900 uppercase tracking-wide">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy-900 uppercase tracking-wide">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy-900 uppercase tracking-wide">Payment</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy-900 uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {salesReport.orders.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No orders in this date range.</td></tr>
                ) : salesReport.orders.map((o) => (
                  <tr key={o.id} className="hover:bg-brand-cream-100 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">#{(o.orderId || o.id).slice(-8).toUpperCase()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{o.userName || o.userEmail}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{o.paymentMethod === 'cod' ? 'COD' : 'Online'}</td>
                    <td className="px-6 py-4 font-bold text-brand-navy-900">{money(o.finalTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => downloadCsv(inventoryReportToCsv(inventoryReport.products), `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`)}
              className="bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white px-6 py-2.5 rounded-xl hover:from-brand-navy-800 hover:to-brand-navy-900 transition-all duration-300 font-semibold shadow-lg text-sm"
            >
              ⬇️ Export CSV
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Active Products" value={inventoryReport.productCount} />
            <StatCard label="Total Units" value={inventoryReport.totalUnits} />
            <StatCard label="Stock Value" value={money(inventoryReport.totalValue)} />
            <StatCard label="Low / Out of Stock" value={`${inventoryReport.lowStockCount} / ${inventoryReport.outOfStockCount}`} />
          </div>

          <div className="bg-white rounded-3xl elegant-shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-brand-cream-100 to-brand-cream-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy-900 uppercase tracking-wide">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy-900 uppercase tracking-wide">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy-900 uppercase tracking-wide">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy-900 uppercase tracking-wide">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy-900 uppercase tracking-wide">Stock Value</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-navy-900 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventoryReport.products.map((p) => {
                  const stock = Number(p.stock) || 0;
                  const status = stock === 0 ? 'Out of Stock' : stock <= 5 ? 'Low Stock' : 'In Stock';
                  const statusClass = stock === 0 ? 'bg-red-50 text-red-700 border-red-200' : stock <= 5 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200';
                  return (
                    <tr key={p.id} className="hover:bg-brand-cream-100 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-800 text-sm">{p.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{p.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{money(p.price)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{stock}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">{money(stock * (Number(p.price) || 0))}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xxs font-bold uppercase tracking-wider border ${statusClass}`}>{status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReports;
