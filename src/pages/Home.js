import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sampleJewelleryProducts } from '../data/products';
import ProductCard from '../components/ProductCard';
import { categories } from '../data/products';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        if (querySnapshot.empty) {
          setFeaturedProducts(sampleJewelleryProducts.filter(p => p.isActive !== false).slice(0, 4));
        } else {
          const prods = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(p => p.isActive !== false);
          setFeaturedProducts(prods.slice(0, 4));
        }
      } catch (err) {
        console.warn('Home page products fetch offline. Loading defaults:', err);
        setFeaturedProducts(sampleJewelleryProducts.filter(p => p.isActive !== false).slice(0, 4));
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div>
      <section className="bg-gradient-to-r from-[#8b5a2b] to-[#a07254] text-white py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl font-bold mb-6 font-serif">Srigovinda collections</h1>
          <p className="text-2xl mb-10 opacity-95 max-w-3xl mx-auto">Exquisite German Silver, One Gram Gold & Panchaloha Jewellery Handcrafted with Love</p>
          <Link to="/products" className="bg-white text-[#8b5a2b] px-10 py-4 rounded-full font-bold text-lg hover:bg-[#fdf6e9] transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1">
            Explore Our Collection
          </Link>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12 font-serif">Shop by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {categories.map(category => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="bg-white rounded-2xl elegant-shadow p-10 text-center hover:shadow-2xl transition-all duration-400 transform hover:-translate-y-3"
              >
                <div className="text-5xl mb-5">
                  {category.id === 'german-silver' && '⚜️'}
                  {category.id === 'one-gram-gold' && '✨'}
                  {category.id === 'panchaloha' && '🪔'}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3 font-serif">{category.name}</h3>
                <p className="text-gray-600 text-lg">Discover {category.subcategories.length} beautiful subcategories</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-[#f7f2ed] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-12 text-center font-serif">Featured Pieces</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-16">
            <Link to="/products" className="inline-block bg-gradient-to-r from-[#8b5a2b] to-[#a07254] text-white px-10 py-4 rounded-xl hover:from-[#a07254] hover:to-[#8b5a2b] transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-[#fdf6e9] to-[#f7f2ed]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-gray-800 mb-5 font-serif">Follow us on Instagram for Exclusive Coupons! 📸</h3>
          <p className="text-gray-700 text-lg mb-8 max-w-2xl mx-auto">Get amazing discount codes by following our Instagram page. Apply them at checkout for instant savings on your favourite pieces!</p>
        </div>
      </section>
    </div>
  );
}

export default Home;
