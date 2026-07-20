'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { categories } from '@/lib/data/products';
import { useNotification } from '@/contexts/NotificationContext';
import { uploadProductImage } from '@/lib/image-upload';
import { deriveGiftingTier, deriveMaterialFromCategory } from '@/lib/product-classification';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';

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
    material: '',
    occasion: '',
    color: '',
    giftingTier: '',
    image: '',
    images: '',
    stock: '',
    isActive: true,
    variants: []
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const emptyForm = {
    name: '', description: '', price: '', discountedPrice: '', category: '', subcategory: '',
    material: '', occasion: '', color: '', giftingTier: '', image: '', images: '', stock: '', isActive: true,
    variants: []
  };

  // Variants are optional (e.g. ring size, bangle size). Each row is { id, label, priceDelta, stock }.
  const addVariantRow = () => {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { id: `v_${Date.now()}_${prev.variants.length}`, label: '', priceDelta: '', stock: '' }],
    }));
  };

  const updateVariantRow = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }));
  };

  const removeVariantRow = (index) => {
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));
  };

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

  const getImageList = (f) =>
    f.images ? f.images.split(',').map((s) => s.trim()).filter(Boolean) : (f.image.trim() ? [f.image.trim()] : []);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedUrls = [];
    try {
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Compressing & uploading ${i + 1} of ${files.length}...`);
        uploadedUrls.push(await uploadProductImage(files[i]));
      }
      setForm((prev) => {
        const merged = [...getImageList(prev), ...uploadedUrls];
        return { ...prev, images: merged.join(', '), image: prev.image.trim() || merged[0] || '' };
      });
      showNotification(`${uploadedUrls.length} image(s) compressed and uploaded successfully.`, 'success');
    } catch (err) {
      console.error('Image upload failed:', err);
      showNotification(err.message || 'Failed to upload image(s).', 'error');
    } finally {
      setUploading(false);
      setUploadProgress('');
      e.target.value = '';
    }
  };

  const removeImage = (urlToRemove) => {
    setForm((prev) => {
      const remaining = getImageList(prev).filter((u) => u !== urlToRemove);
      return { ...prev, images: remaining.join(', '), image: prev.image === urlToRemove ? (remaining[0] || '') : prev.image };
    });
  };

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

    // Drop incomplete rows (no label typed yet) rather than saving a blank variant option.
    const variants = form.variants
      .filter((v) => v.label.trim())
      .map((v) => ({
        id: v.id,
        label: v.label.trim(),
        priceDelta: v.priceDelta === '' ? 0 : Number(v.priceDelta),
        stock: v.stock === '' ? 0 : Number(v.stock),
      }));

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        discountedPrice: form.discountedPrice ? Number(form.discountedPrice) : null,
        category: form.category,
        subcategory: form.subcategory,
        material: form.material || null,
        occasion: form.occasion || null,
        color: form.color || null,
        giftingTier: form.giftingTier || null,
        image: primaryImg,
        images: imagesArray,
        stock: Number(form.stock),
        isActive: form.isActive !== undefined ? form.isActive : true,
        variants
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
      setForm(emptyForm);
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

  const toggleActive = async (product) => {
    const nextActive = !(product.isActive !== false);
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, isActive: nextActive } : p)));
    try {
      await updateDoc(doc(db, 'products', product.id), { isActive: nextActive });
      showNotification(`"${product.name}" is now ${nextActive ? 'visible' : 'hidden'} on the storefront.`, 'success');
    } catch (err) {
      console.error('Error toggling product visibility:', err);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, isActive: !nextActive } : p)));
      showNotification('Could not update visibility. Please try again.', 'error');
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
      material: product.material || '',
      occasion: product.occasion || '',
      color: product.color || '',
      giftingTier: product.giftingTier || '',
      image: product.image || '',
      images: product.images ? product.images.join(', ') : (product.image || ''),
      stock: product.stock || '',
      isActive: product.isActive !== undefined ? product.isActive : true,
      variants: (product.variants || []).map((v) => ({ ...v, priceDelta: String(v.priceDelta ?? ''), stock: String(v.stock ?? '') }))
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
            setForm(emptyForm);
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white px-8 py-3 rounded-xl hover:from-brand-navy-800 hover:to-brand-navy-900 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
        >
          + Add Product
        </button>
      </div>

      <div className="bg-white rounded-3xl elegant-shadow overflow-x-auto">
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
                    <Image
                      src={optimizeCloudinaryUrl(product.image, { width: 160 })}
                      alt={product.name}
                      width={80}
                      height={80}
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
                  <button
                    type="button"
                    onClick={() => toggleActive(product)}
                    aria-pressed={product.isActive !== false}
                    aria-label={product.isActive !== false ? `Hide ${product.name} from storefront` : `Show ${product.name} on storefront`}
                    title={product.isActive !== false ? 'Visible to customers — click to hide' : 'Hidden from customers — click to show'}
                    className="flex items-center gap-2.5 group"
                  >
                    <span
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${
                        product.isActive !== false ? 'bg-brand-navy-900' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform duration-200 ${
                          product.isActive !== false ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </span>
                    <span className={`text-xxs font-bold uppercase tracking-wider ${product.isActive !== false ? 'text-brand-navy-900' : 'text-gray-400'}`}>
                      {product.isActive !== false ? 'Visible' : 'Hidden'}
                    </span>
                  </button>
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
                      onChange={(e) => setForm((prev) => ({
                        ...prev,
                        category: e.target.value,
                        subcategory: '',
                        // Suggest a material from the category, but never clobber one the admin already picked.
                        material: prev.material || deriveMaterialFromCategory(e.target.value),
                      }))}
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
                      onChange={(e) => setForm((prev) => ({
                        ...prev,
                        price: e.target.value,
                        giftingTier: deriveGiftingTier(e.target.value, prev.discountedPrice),
                      }))}
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/10 transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="product-discounted-price" className="block text-sm font-semibold text-gray-700 mb-3">Discounted Price (₹)</label>
                    <input
                      id="product-discounted-price"
                      type="number"
                      value={form.discountedPrice}
                      onChange={(e) => setForm((prev) => ({
                        ...prev,
                        discountedPrice: e.target.value,
                        giftingTier: deriveGiftingTier(prev.price, e.target.value),
                      }))}
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

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="product-material" className="block text-sm font-semibold text-gray-700 mb-3">Material (Optional)</label>
                    <select
                      id="product-material"
                      value={form.material}
                      onChange={(e) => setForm({ ...form, material: e.target.value })}
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/10 transition-all duration-300"
                    >
                      <option value="">Unspecified</option>
                      <option value="German Silver">German Silver</option>
                      <option value="Gold Plated">Gold Plated</option>
                      <option value="Panchaloha">Panchaloha</option>
                      <option value="Brass">Brass</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="product-occasion" className="block text-sm font-semibold text-gray-700 mb-3">Occasion (Optional)</label>
                    <select
                      id="product-occasion"
                      value={form.occasion}
                      onChange={(e) => setForm({ ...form, occasion: e.target.value })}
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/10 transition-all duration-300"
                    >
                      <option value="">Unspecified</option>
                      <option value="Wedding">Wedding Wear</option>
                      <option value="Festival">Festivals</option>
                      <option value="Gifting">Gifting Shubh</option>
                      <option value="Casual">Casual Wear</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="product-color" className="block text-sm font-semibold text-gray-700 mb-3">Color (Optional)</label>
                    <select
                      id="product-color"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/10 transition-all duration-300"
                    >
                      <option value="">Unspecified</option>
                      <option value="Gold">Antique Gold</option>
                      <option value="Silver">Silver White</option>
                      <option value="Ruby Red">Ruby Red</option>
                      <option value="Emerald Green">Emerald Green</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="product-gifting-tier" className="block text-sm font-semibold text-gray-700 mb-3">Gifting Tier (Optional)</label>
                    <select
                      id="product-gifting-tier"
                      value={form.giftingTier}
                      onChange={(e) => setForm({ ...form, giftingTier: e.target.value })}
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-brand-navy-900 focus:ring-4 focus:ring-brand-navy-900/10 transition-all duration-300"
                    >
                      <option value="">Unspecified</option>
                      <option value="Budget">Budget</option>
                      <option value="Premium">Premium</option>
                      <option value="Luxury">Luxury</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-700">Variants (Optional)</label>
                    <button
                      type="button"
                      onClick={addVariantRow}
                      className="text-xs font-bold text-brand-navy-900 hover:underline"
                    >
                      + Add Variant
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">
                    E.g. ring or bangle sizes. Leave empty for a single-option product. Price adjustment is added to (or subtracted from) the base price above.
                  </p>
                  {form.variants.length > 0 && (
                    <div className="space-y-3">
                      {form.variants.map((variant, index) => (
                        <div key={variant.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center">
                          <input
                            type="text"
                            value={variant.label}
                            onChange={(e) => updateVariantRow(index, 'label', e.target.value)}
                            placeholder="Label (e.g. Size 8)"
                            className="px-3 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-brand-navy-900"
                          />
                          <input
                            type="number"
                            value={variant.priceDelta}
                            onChange={(e) => updateVariantRow(index, 'priceDelta', e.target.value)}
                            placeholder="Price +/- (₹)"
                            className="px-3 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-brand-navy-900"
                          />
                          <input
                            type="number"
                            value={variant.stock}
                            onChange={(e) => updateVariantRow(index, 'stock', e.target.value)}
                            placeholder="Stock"
                            className="px-3 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-brand-navy-900"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariantRow(index)}
                            aria-label={`Remove variant ${index + 1}`}
                            className="text-red-500 hover:text-red-700 font-bold px-2"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="product-file-upload" className="block text-sm font-semibold text-gray-700 mb-3">Upload Product Photos</label>
                  <input
                    id="product-file-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploading}
                    onChange={handleFileUpload}
                    className="w-full px-5 py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-700 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-brand-navy-900 file:text-white hover:file:bg-brand-navy-800 disabled:opacity-50"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    {uploading ? uploadProgress : 'Photos are automatically compressed and resized for fast loading. First uploaded photo becomes the primary image.'}
                  </p>

                  {getImageList(form).length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-4">
                      {getImageList(form).map((url) => (
                        <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                          <Image src={optimizeCloudinaryUrl(url, { width: 160 })} alt="Product preview" fill sizes="80px" className="object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(url)}
                            className="absolute inset-0 bg-black/50 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            Remove
                          </button>
                          {url === form.image.trim() && (
                            <span className="absolute bottom-0 inset-x-0 bg-brand-navy-900/90 text-white text-[9px] font-bold text-center py-0.5">Primary</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="product-image" className="block text-sm font-semibold text-gray-700 mb-3">Or Paste Image URL</label>
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
                      setForm(emptyForm);
                    }}
                    className="flex-1 border-2 border-brand-navy-900 text-brand-navy-900 py-4 rounded-xl hover:bg-brand-cream-100 transition-all duration-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className="flex-1 bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white py-4 rounded-xl hover:from-brand-navy-800 hover:to-brand-navy-900 transition-all duration-300 font-semibold shadow-lg disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : uploading ? 'Uploading...' : (editingProduct ? 'Update Product' : 'Add Product')}
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
