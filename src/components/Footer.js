import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-gradient-to-r from-[#0b1a30] to-[#0f2a4a] text-[#f0f5fa] pt-16 pb-8 border-t-4 border-[#d4af37]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Column 1: Store Intro */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold font-serif tracking-wide">Srigovinda collections</h3>
            <p className="text-xs text-[#f0f5fa]/80 leading-relaxed">
              Exquisite handcrafted jewellery featuring German Silver, One Gram Gold, and Panchaloha pieces designed with timeless details and premium quality.
            </p>
            <div className="pt-2 text-xs font-semibold text-[#d4af37]">
              📸 <a href="https://www.instagram.com/srigovindacollections" target="_blank" rel="noopener noreferrer" className="hover:underline">Check Instagram for coupon codes!</a>
            </div>
          </div>

          {/* Column 2: Shop links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#d4af37]">Explore Store</h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/" className="hover:text-white hover:underline transition-all">Home Page</Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white hover:underline transition-all">Our Products</Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white hover:underline transition-all">Shopping Cart</Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-white hover:underline transition-all">My Wishlist</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Account links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#d4af37]">Customer Corner</h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/profile" className="hover:text-white hover:underline transition-all">My Account Profile</Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white hover:underline transition-all">Order Tracking</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white hover:underline transition-all">Contact Support</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Compliance Policies */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#d4af37]">Legal Policies</h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/contact" className="hover:text-white hover:underline transition-all text-xs">Contact Us</Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-white hover:underline transition-all text-xs">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white hover:underline transition-all text-xs">Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-white hover:underline transition-all text-xs">Cancellation & Refund Policy</Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="hover:text-white hover:underline transition-all text-xs">Shipping & Delivery Policy</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#f0f5fa]/10 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center text-xs text-[#f0f5fa]/70 gap-4">
          <p>© 2026 Srigovinda collections. All Rights Reserved.</p>
          <div className="flex items-center gap-6 select-none font-bold tracking-widest text-[#d4af37]">
            <span>🔒 SECURED PAYMENTS</span>
            <span>🟣 PHONEPE</span>
            <span>📱 UPI</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
