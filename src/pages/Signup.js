import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (name.trim().length < 2) {
      return setError('Name must be at least 2 characters long');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    try {
      setError('');
      setLoading(true);
      await signup(email, password, name);
      navigate('/');
    } catch (err) {
      console.error('Signup error details:', err);
      setError(err.message || 'Failed to create an account');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdf6e9] to-[#f7f2ed] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl elegant-shadow">
        <div className="text-center">
          <div className="mb-6">
            <img src="/logo.jpg" alt="Logo" className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-[#d4af37]/30 object-cover elegant-shadow" />
            <h2 className="text-4xl font-bold text-gray-800 font-serif">Join Our Family</h2>
            <p className="text-gray-600 mt-2 text-lg">Create your account at Srigovinda collections</p>
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8b5a2b] focus:ring-4 focus:ring-[#8b5a2b]/10 transition-all duration-300 text-base"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8b5a2b] focus:ring-4 focus:ring-[#8b5a2b]/10 transition-all duration-300 text-base"
                placeholder="your-email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8b5a2b] focus:ring-4 focus:ring-[#8b5a2b]/10 transition-all duration-300 text-base"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8b5a2b] focus:ring-4 focus:ring-[#8b5a2b]/10 transition-all duration-300 text-base"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#8b5a2b] to-[#a07254] text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-gray-600 text-lg">
              Already have an account? 
              <Link to="/login" className="text-[#8b5a2b] font-semibold hover:text-[#a07254] transition-colors duration-300 ml-1">
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;
