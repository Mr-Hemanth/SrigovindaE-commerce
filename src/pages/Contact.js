import React, { useState } from 'react';

function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate support ticket creation
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setTimeout(() => setSubmitted(false), 5000);
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16 space-y-3">
        <h1 className="text-4xl md:text-5xl font-bold text-[#0f2a4a] font-serif">Contact Us</h1>
        <p className="text-gray-500 max-w-lg mx-auto text-base">Have questions about our jewellery collections or need assistance with your order? Reach out to us below!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Contact Details cards */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white rounded-3xl elegant-shadow p-8 border border-gray-100 flex items-start gap-4">
            <span className="text-3xl">📧</span>
            <div>
              <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-1">Email Support</h4>
              <p className="text-[#0f2a4a] font-semibold text-base break-all">srigovindagermansilver@gmail.com</p>
              <p className="text-xs text-gray-400 mt-1">We respond within 24 hours.</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl elegant-shadow p-8 border border-gray-100 flex items-start gap-4">
            <span className="text-3xl">📞</span>
            <div>
              <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-1">Call / WhatsApp</h4>
              <p className="text-[#0f2a4a] font-semibold text-base">+91 91776 96666</p>
              <p className="text-xs text-gray-400 mt-1">Mon - Sat: 10:00 AM - 7:00 PM</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl elegant-shadow p-8 border border-gray-100 flex items-start gap-4">
            <span className="text-3xl">📍</span>
            <div>
              <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-1">Physical Location</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Srigovinda collections,<br />
                Devangula Street, near Subbaalamma temple,<br />
                Amalapuram, Andhra Pradesh, India.
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Support Query Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl elegant-shadow p-8 md:p-10 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 font-serif">Send Support Query</h2>
          
          {submitted && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Thank you! Your query has been submitted successfully. Our support desk will reach out within 24 hours.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-[#0f2a4a]"
                  placeholder="Full Name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-[#0f2a4a]"
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-[#0f2a4a]"
                placeholder="Topic of query"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Message Description</label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-[#0f2a4a]"
                placeholder="Details of your request..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#0f2a4a] to-[#1b4965] text-white py-4 rounded-xl font-bold text-base shadow-lg hover:shadow-xl hover:from-[#1b4965] hover:to-[#0f2a4a] transition-all disabled:opacity-50"
            >
              {loading ? 'Submitting query...' : 'Send Support Request'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Contact;
