import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

function AdminOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      ordersData.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bDate - aDate;
      });
      setOrders(ordersData);
      localStorage.setItem('admin_orders_cache', JSON.stringify(ordersData));
    } catch (err) {
      console.warn('Admin orders loading offline. Loading cached:', err);
      const cached = localStorage.getItem('admin_orders_cache');
      if (cached) {
        setOrders(JSON.parse(cached));
      }
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    fetchOrders();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-[#0f2a4a] font-serif">Orders</h1>

      <div className="bg-white rounded-3xl elegant-shadow overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-gray-500 text-lg">No orders yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map((order) => (
              <div key={order.id} className="p-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-5 mb-3">
                      <h3 className="font-bold text-gray-800 text-xl">Order #{order.id.slice(0, 8)}</h3>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-base text-gray-600 mb-2">
                      Customer: <span className="font-semibold text-gray-800">{order.userName}</span> ({order.userEmail})
                    </p>
                    <p className="text-base text-gray-600 mb-2">
                      Date: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : new Date(order.createdAt).toLocaleString()}
                    </p>
                    {order.shippingAddress && (
                      <p className="text-base text-gray-600 mb-2">
                        Address: <span className="font-medium">{order.shippingAddress}</span>
                      </p>
                    )}
                    <p className="text-lg font-bold text-[#0f2a4a] mt-3">
                      Total: ₹{(order.finalTotal || order.total).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex flex-col items-start lg:items-end gap-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="px-5 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-[#0f2a4a] focus:ring-4 focus:ring-[#0f2a4a]/10 transition-all duration-300"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <div className="text-base text-gray-500 font-medium">
                      Items: {order.items.length}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex flex-wrap gap-5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-[#f0f5fa] px-5 py-4 rounded-2xl">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3";
                          }}
                          className="w-14 h-14 object-cover rounded-xl elegant-shadow" 
                        />
                        <div>
                          <p className="text-base font-semibold text-gray-800">{item.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity} • ₹{item.price.toFixed(0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminOrders;
