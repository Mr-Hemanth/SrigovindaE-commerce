import React, { useState, useEffect, useCallback } from 'react';
import { sampleJewelleryProducts as sampleProducts, categories } from '../data/products';
import ProductCard from '../components/ProductCard';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

function Products() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [priceRange, setPriceRange] = useState(10000);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        if (querySnapshot.empty) {
          setProducts(sampleProducts);
          setFilteredProducts(sampleProducts);
        } else {
          const productsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setProducts(productsData);
          setFilteredProducts(productsData);
        }
      } catch (err) {
        console.warn('Firestore products fetch offline. Falling back to local sample products:', err);
        setProducts(sampleProducts);
        setFilteredProducts(sampleProducts);
      }
    };
    fetchProducts();
  }, []);

  const applyFilters = useCallback(() => {
    let result = products.filter(product => product.isActive !== false);

    if (selectedCategory !== 'all') {
      result = result.filter(product => product.category === selectedCategory);
    }

    if (selectedSubcategory !== 'all') {
      result = result.filter(product => product.subcategory === selectedSubcategory);
    }

    result = result.filter(product => product.price <= priceRange);

    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(result);
  }, [products, selectedCategory, selectedSubcategory, priceRange, sortBy]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const currentCategory = categories.find(c => c.id === selectedCategory);
  const availableSubcategories = currentCategory?.subcategories || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
      <h1 className="text-2xl md:text-4xl font-bold text-[#8b5a2b] mb-2 font-serif">Srigovinda collections</h1>
      <p className="text-gray-600 text-xs md:text-lg mb-6">Explore our exquisite jewellery collection in German Silver, One Gram Gold, and Panchaloha</p>
      
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-3xl elegant-shadow p-8 sticky top-28">
            <h3 className="text-xl font-bold mb-8 text-[#8b5a2b] font-serif">Filters</h3>
            
            <div className="mb-8">
              <h4 className="font-semibold mb-4 text-gray-800 text-base">Category</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-[#fdf6e9] transition-colors">
                  <input
                    type="radio"
                    name="category"
                    value="all"
                    checked={selectedCategory === 'all'}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedSubcategory('all');
                    }}
                    className="w-5 h-5 text-[#8b5a2b]"
                  />
                  <span className="text-gray-700 font-medium">All Categories</span>
                </label>
                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-[#fdf6e9] transition-colors">
                    <input
                      type="radio"
                      name="category"
                      value={cat.id}
                      checked={selectedCategory === cat.id}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setSelectedSubcategory('all');
                      }}
                      className="w-5 h-5 text-[#8b5a2b]"
                    />
                    <span className="text-gray-700 font-medium">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {selectedCategory !== 'all' && availableSubcategories.length > 0 && (
              <div className="mb-8">
                <h4 className="font-semibold mb-4 text-gray-800 text-base">Subcategory</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-[#fdf6e9] transition-colors">
                    <input
                      type="radio"
                      name="subcategory"
                      value="all"
                      checked={selectedSubcategory === 'all'}
                      onChange={(e) => setSelectedSubcategory(e.target.value)}
                      className="w-5 h-5 text-[#8b5a2b]"
                    />
                    <span className="text-gray-700 font-medium">All</span>
                  </label>
                  {availableSubcategories.map(sub => (
                    <label key={sub} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-[#fdf6e9] transition-colors">
                      <input
                        type="radio"
                        name="subcategory"
                        value={sub}
                        checked={selectedSubcategory === sub}
                        onChange={(e) => setSelectedSubcategory(e.target.value)}
                        className="w-5 h-5 text-[#8b5a2b]"
                      />
                      <span className="text-gray-700 font-medium">{sub}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h4 className="font-semibold mb-4 text-gray-800 text-base">Price: ₹{priceRange}</h4>
              <input
                type="range"
                min="100"
                max="20000"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-[#8b5a2b]"
              />
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-gray-800 text-base">Sort By</h4>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-[#8b5a2b] focus:ring-4 focus:ring-[#8b5a2b]/10 transition-all duration-300"
              >
                <option value="default">Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-2xl text-gray-600 font-medium">No products found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Products;
