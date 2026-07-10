'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { categories } from '@/lib/data/products';
import { useNotification } from '@/contexts/NotificationContext';

function AdminProducts() {
  const { showNotification } = useNotification();
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    discountedPrice: '',
    category: '',
    subcategory: '',
    image: '',
    images: '',
    stock: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  async function fetchProducts() {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
      localStorage.setItem('admin_products_cache', JSON.stringify(productsData));
    } catch (err) {
      console.warn('Admin products loading offline. Loading cached:', err);
      const cached = localStorage.getItem('admin_products_cache');
      if (cached) {
        setProducts(JSON.parse(cached));
      }
    }
  }

  useEffect(() => {
    const loadInitialProducts = async () => {
      await fetchProducts();
    };
    loadInitialProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const imgUrl = form.image.trim();
    if (imgUrl.includes('ibb.co/') && !imgUrl.includes('i.ibb.co')) {
      showNotification('Please copy the direct image link (starts with https://i.ibb.co/) rather than the ImgBB viewer page URL.', 'error');
      setLoading(false);
      return;
    }

    const imagesArray = form.images
      ? form.images.split(',').map(s => s.trim()).filter(s => s !== '')
      : (form.image.trim() ? [form.image.trim()] : []);

    const primaryImg = imagesArray[0] || form.image.trim();

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        discountedPrice: form.discountedPrice ? Number(form.discountedPrice) : null,
        category: form.category,
        subcategory: form.subcategory,
        image: primaryImg,
        images: imagesArray,
        stock: Number(form.stock),
        isActive: form.isActive !== undefined ? form.isActive : true
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), payload);
      } else {
        await addDoc(collection(db, 'products'), {
          ...payload,
          createdAt: new Date()
        });
      }
      setShowModal(false);
      setEditingProduct(null);
      setForm({ name: '', description: '', price: '', discountedPrice: '', category: '', subcategory: '', image: '', images: '', stock: '', isActive: true });
      fetchProducts();
    } catch (err) {
      console.error('Error adding/updating product: ', err);
    }
    setLoading(false);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteDoc(doc(db, 'products', productId));
      fetchProducts();
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      discountedPrice: product.discountedPrice || '',
      category: product.category || '',
      subcategory: product.subcategory || '',
      image: product.image || '',
      images: product.images ? product.images.join(', ') : (product.image || ''),
      stock: product.stock || '',
      isActive: product.isActive !== undefined ? product.isActive : true
    });
    setShowModal(true);
  };

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : catId;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-brand-navy-900 font-serif">Products</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            setForm({ name: '', description: '', price: '', discountedPrice: '', category: '', subcategory: '', image: '', stock: '', isActive: true });
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white px-8 py-3 rounded-xl hover:from-brand-navy-800 hover:to-brand-navy-900 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
        >
          + Add Product
        </button>
      </div>

      <div className="bg-white rounded-3xl elegant-shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-brand-cream-100 to-brand-cream-200">
            <tr>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Product</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Category</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Price</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Stock</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Status</th>
              <th className="px-8 py-5 text-left text-sm font-semibold text-brand-navy-900 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-brand-cream-100 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-5">
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3";
                      }}
                      className="w-20 h-20 object-cover rounded-2xl elegant-shadow"
                    />
                    <div>
                      <p className="font-semibold text-gray-800 text-lg">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.subcategory}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-gray-600 font-medium">{getCategoryName(product.category)}</td>
                <td className="px-8 py-5 text-gray-800 font-bold">
                  {product.discountedPrice ? (
                    <div className="flex flex-col">
                      <span className="text-brand-navy-900 text-lg">₹{product.discountedPrice}</span>
                      <span className="text-xs text-gray-400 line-through">₹{product.price}</span>
                    </div>
                  ) : (
                    <span className="text-lg">₹{product.price}</span>
                  )}
                </td>
                <td className="px-8 py-5">
                  <span className={`px-4 py-2 rounded-full text-xs font-semibold ${product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {product.stock} in stock
                  </span>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full text-xxs font-bold uppercase tracking-wider border ${
                    product.isActive !== false
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-gray-50 text-gray-400 border-gray-200'
                  }`}>
                    {product.isActive !== false ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex gap-3 text-sm">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-brand-navy-900 hover:text-brand-navy-800 font-semibold transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-800 font-semibold transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl elegant-shadow max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-10">
              <h2 className="text-2xl font-bold text-brand-navy-900 mb-8 font-serif">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="product-name" className="block text-sm font-semibold text-gray-700 mb-3">Product Name</label>
                  <input
                    id="product-name"
                    type="text"
                    required
                    aria-required="true"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/10 transition-all duration-300"
                  />
                </div>

                <div>
                  <label htmlFor="product-description" className="block text-sm font-semibold text-gray-700 mb-3">Description</label>
                  <textarea
                    id="product-description"
                    required
                    aria-required="true"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/10 transition-all duration-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="product-category" className="block text-sm font-semibold text-gray-700 mb-3">Category</label>
                    <select
                      id="product-category"
                      required
                      aria-required="true"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value, subcategory: '' })}
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/10 transition-all duration-300"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="product-subcategory" className="block text-sm font-semibold text-gray-700 mb-3">Subcategory (Optional)</label>
                    <select
                      id="product-subcategory"
                      value={form.subcategory}
                      onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/10 transition-all duration-300"
                    >
                      <option value="">Select Subcategory</option>
                      {form.category && categories.find(c => c.id === form.category)?.subcategories.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="product-price" className="block text-sm font-semibold text-gray-700 mb-3">Regular Price (₹)</label>
                    <input
                      id="product-price"
                      type="number"
                      required
                      aria-required="true"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/10 transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="product-discounted-price" className="block text-sm font-semibold text-gray-700 mb-3">Discounted Price (₹)</label>
                    <input
                      id="product-discounted-price"
                      type="number"
                      value={form.discountedPrice}
                      onChange={(e) => setForm({ ...form, discountedPrice: e.target.value })}
                      placeholder="Optional price"
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/10 transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="product-stock" className="block text-sm font-semibold text-gray-700 mb-3">Stock</label>
                    <input
                      id="product-stock"
                      type="number"
                      required
                      aria-required="true"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/10 transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="product-image" className="block text-sm font-semibold text-gray-700 mb-3">Image URL</label>
                  <input
                    id="product-image"
                    type="url"
                    required
                    aria-required="true"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/10 transition-all duration-300"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label htmlFor="product-images" className="block text-sm font-semibold text-gray-700 mb-3">Product Images (comma-separated list of URLs, first is the primary view)</label>
                  <textarea
                    id="product-images"
                    value={form.images}
                    onChange={(e) => setForm({ ...form, images: e.target.value })}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/10 transition-all duration-300"
                    placeholder="https://i.ibb.co/image1.png, https://i.ibb.co/image2.png"
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-3 bg-brand-cream-100/40 border border-brand-navy-900/15 p-5 rounded-2xl">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-5 h-5 text-brand-navy-900 focus:ring-brand-navy-900 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                    Enable Product (Show this product in store catalogs)
                  </label>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingProduct(null);
                      setForm({ name: '', description: '', price: '', discountedPrice: '', category: '', subcategory: '', image: '', stock: '', isActive: true });
                    }}
                    className="flex-1 border-2 border-brand-navy-900 text-brand-navy-900 py-4 rounded-xl hover:bg-brand-cream-100 transition-all duration-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white py-4 rounded-xl hover:from-brand-navy-800 hover:to-brand-navy-900 transition-all duration-300 font-semibold shadow-lg disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
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

export default AdminProducts;
