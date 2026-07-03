import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const simulatedSales = [
  { name: "Priya Sharma", city: "Bengaluru", product: "1 Gram Gold Temple Necklace", time: "3 mins ago", icon: "✨" },
  { name: "Lakshmi Prasanna", city: "Vijayawada", product: "German Silver Peacock Diya", time: "12 mins ago", icon: "⚜️" },
  { name: "Karthik R.", city: "Chennai", product: "Panchaloha Lord Ganesha Idol", time: "25 mins ago", icon: "🪔" },
  { name: "Divya N.", city: "Hyderabad", product: "German Silver Nakshi Plate", time: "1 hour ago", icon: "⚜️" },
  { name: "Meenakshi K.", city: "Kochi", product: "1 Gram Gold Kada Bangle", time: "8 mins ago", icon: "✨" },
  { name: "Sunitha", city: "Visakhapatnam", product: "Premium Gift Articles Combo Set", time: "42 mins ago", icon: "🎁" }
];

export default function EngagementWidgets() {
  // WhatsApp State
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Spin Wheel State
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);
  const [wonCoupon, setWonCoupon] = useState('');
  const [hasSpun, setHasSpun] = useState(false);

  // Quiz Finder State
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(1);
  const [quizAnswers, setQuizAnswers] = useState({ target: '', budget: '', style: '' });

  // Live Sales Alerts State
  const [activeSale, setActiveSale] = useState(null);
  const [saleIndex, setSaleIndex] = useState(0);
  const [showSale, setShowSale] = useState(false);

  // Check if user already spun in this session
  useEffect(() => {
    const spun = localStorage.getItem('srigovinda_wheel_spun');
    if (spun) {
      setHasSpun(true);
      setWonCoupon(spun);
    }
  }, []);

  // Live sales notifications rotation
  useEffect(() => {
    const startNotification = () => {
      // Pick next sale
      setActiveSale(simulatedSales[saleIndex]);
      setShowSale(true);
      
      // Dismiss after 7 seconds
      const dismissTimer = setTimeout(() => {
        setShowSale(false);
        setSaleIndex((prev) => (prev + 1) % simulatedSales.length);
      }, 7000);

      return dismissTimer;
    };

    // Trigger first alert after 10 seconds
    const initialDelay = setTimeout(() => {
      startNotification();
    }, 10000);

    // Set recurring cycle every 35 seconds
    const interval = setInterval(() => {
      startNotification();
    }, 35000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [saleIndex]);

  // Handle Wheel Spin
  const spinWheel = () => {
    if (isSpinning || hasSpun) return;
    setIsSpinning(true);

    // Prizes matching: 0: 5% Off, 1: Try Again, 2: 10% Off, 3: Free Shipping, 4: Better Luck, 5: 8% Off Gifts
    const prizes = [
      { text: "5% OFF (Code: SRI5)", code: "SRI5" },
      { text: "Try Again", code: null },
      { text: "10% OFF (Code: SRI10)", code: "SRI10" },
      { text: "Free Shipping (Code: SHIPFREE)", code: "SHIPFREE" },
      { text: "Better Luck Next Time", code: null },
      { text: "8% OFF (Code: GIFT8)", code: "GIFT8" }
    ];

    // Force selection of a winning prize (e.g. 10% off SRI10 at index 2, or 8% off at index 5)
    const winIdx = Math.random() > 0.5 ? 2 : 5;
    const degPerSegment = 60;
    const targetAngle = 360 * 5 + (360 - winIdx * degPerSegment - 30); // 5 full spins + offset to land in middle

    setWheelAngle(targetAngle);

    setTimeout(() => {
      setIsSpinning(false);
      const prize = prizes[winIdx];
      setWonPrize(prize.text);
      if (prize.code) {
        setWonCoupon(prize.code);
        setHasSpun(true);
        localStorage.setItem('srigovinda_wheel_spun', prize.code);
      }
    }, 4000);
  };

  // Reset quiz state
  const resetQuiz = () => {
    setQuizStep(1);
    setQuizAnswers({ target: '', budget: '', style: '' });
  };

  const handleQuizAnswer = (key, val) => {
    const updated = { ...quizAnswers, [key]: val };
    setQuizAnswers(updated);
    if (key === 'style') {
      setQuizStep(4);
    } else {
      setQuizStep(prev => prev + 1);
    }
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Coupon Code "${text}" copied to clipboard! Enjoy your discount!`);
  };

  return (
    <>
      {/* 1. FLOATING ACTION CONTAINER (BOTTOM LEFT) - SPIN WHEEL & GIFT FINDER */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-3.5 select-none font-sans">
        {/* Gift Finder Quiz Button */}
        <button
          onClick={() => { setIsQuizOpen(true); resetQuiz(); }}
          className="bg-gradient-to-r from-[#0f2a4a] to-[#1b4965] text-white p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center gap-2 border border-[#d4af37]/30 text-xs font-bold"
          title="Find the Perfect Gift Quiz"
        >
          <span>🎯</span>
          <span className="hidden sm:inline">Gift Finder Quiz</span>
        </button>

        {/* Spin to Win Gift Wheel Button */}
        <button
          onClick={() => setIsWheelOpen(true)}
          className="bg-gradient-to-r from-[#d4af37] to-[#bfa030] text-[#0b1a30] p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center gap-2 border border-white/20 text-xs font-extrabold"
          title="Spin the Lucky Wheel"
        >
          <span className="animate-bounce">🎁</span>
          <span className="hidden sm:inline">Spin to Win!</span>
          {wonCoupon && (
            <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[9px] uppercase font-mono animate-pulse">
              Won!
            </span>
          )}
        </button>
      </div>

      {/* 2. FLOATING WHATSAPP CUSTOM CHAT WIDGET (BOTTOM RIGHT) */}
      <div className="fixed bottom-6 right-6 z-40 select-none font-sans text-left">
        {/* Chat window panel */}
        {isChatOpen && (
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden w-80 max-w-[90vw] mb-4 animate-slide-up flex flex-col">
            {/* Header */}
            <div className="bg-[#25D366] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
                    🪔
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
                </div>
                <div>
                  <h4 className="text-xs font-black">Sri Govinda Collections</h4>
                  <p className="text-[10px] text-white/80">Support • Active Now</p>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="text-white/80 hover:text-white text-xl font-bold leading-none"
              >
                ✕
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-5 bg-gray-50 space-y-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm text-xs text-gray-700 leading-relaxed max-w-[90%] border border-gray-100">
                Namaste! 🙏 Welcome to Srigovinda Collections. 
                <br/><br/>
                We offer 100% Handcrafted German Silver & Panchaloha articles. How can we help you choose your jewellery today?
              </div>
            </div>

            {/* Input Action Panel */}
            <div className="p-4 bg-white border-t border-gray-100">
              <a
                href="https://wa.me/919533866777?text=Hi%20Srigovinda%20Collections,%20I%27m%20visiting%20your%20site%20and%20have%20a%20question%20about%20your%20handcrafted%20collections."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20ba56] text-white py-3 rounded-2xl font-bold text-center block text-xs shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.012 2C6.5 2 2.006 6.5 2.006 12c0 1.755.459 3.468 1.33 4.98L2.006 22l5.148-1.35C8.61 21.468 10.29 22 12.012 22 17.52 22 22 17.5 22 12S17.52 2 12.012 2zm6.6 13.911c-.27.765-1.35 1.395-2.07 1.485-.63.09-1.44.18-4.23-.99-3.555-1.53-5.85-5.13-6.03-5.355-.18-.225-1.44-1.935-1.44-3.69 0-1.755.9-2.61 1.215-2.97.27-.27.675-.405 1.08-.405.135 0 .27 0 .36.009.27.009.405.027.63.54.27.63.9 2.205.99 2.385.09.18.135.405.009.63-.135.225-.27.405-.405.585-.135.18-.27.36-.09.675.36.63 1.62 2.655 3.42 4.275 1.575 1.395 2.925 1.845 3.33 2.025.27.09.54.09.765-.135.27-.315 1.215-1.395 1.53-1.89.315-.45.63-.36 1.08-.18.45.18 2.835 1.35 3.33 1.575.495.225.81.36.945.54.135.225.135 1.26-.135 2.025z"/>
                </svg>
                Chat on WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Floating whatsapp action bubble button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-transform duration-300 flex items-center justify-center relative border border-white/10"
        >
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
          </span>
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M12.012 2C6.5 2 2.006 6.5 2.006 12c0 1.755.459 3.468 1.33 4.98L2.006 22l5.148-1.35C8.61 21.468 10.29 22 12.012 22 17.5 22 22 17.5 22 12S17.52 2 12.012 2zm6.6 13.911c-.27.765-1.35 1.395-2.07 1.485-.63.09-1.44.18-4.23-.99-3.555-1.53-5.85-5.13-6.03-5.355-.18-.225-1.44-1.935-1.44-3.69 0-1.755.9-2.61 1.215-2.97.27-.27.675-.405 1.08-.405.135 0 .27 0 .36.009.27.009.405.027.63.54.27.63.9 2.205.99 2.385.09.18.135.405.009.63-.135.225-.27.405-.405.585-.135.18-.27.36-.09.675.36.63 1.62 2.655 3.42 4.275 1.575 1.395 2.925 1.845 3.33 2.025.27.09.54.09.765-.135.27-.315 1.215-1.395 1.53-1.89.315-.45.63-.36 1.08-.18.45.18 2.835 1.35 3.33 1.575.495.225.81.36.945.54.135.225.135 1.26-.135 2.025z"/>
          </svg>
        </button>
      </div>

      {/* 3. DYNAMIC LIVE SALES SOCIAL PROOF POPUP (SLIDES FROM BOTTOM LEFT) */}
      {showSale && activeSale && (
        <div className="fixed bottom-28 left-6 z-30 select-none font-sans max-w-[90vw] w-76 bg-white p-3.5 rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-3 animate-slide-in">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl flex-shrink-0 border border-gray-100 shadow-inner select-none">
            {activeSale.icon}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[10px] text-gray-400 font-medium">Recent Order verified</p>
            <p className="text-[11px] text-gray-700 leading-tight mt-0.5">
              <span className="font-black text-gray-900">{activeSale.name}</span> from <span className="font-semibold text-gray-800">{activeSale.city}</span> bought <span className="font-bold text-[#0f2a4a]">{activeSale.product}</span>
            </p>
            <p className="text-[9px] text-[#25D366] font-bold mt-0.5">✓ verified order • {activeSale.time}</p>
          </div>
        </div>
      )}

      {/* 4. LUCKY SPIN WHEEL POPUP MODAL DIALOG */}
      {isWheelOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center select-none font-sans">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => { if (!isSpinning) setIsWheelOpen(false); }}
          />

          <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 max-w-sm w-full mx-4 text-center animate-slide-up flex flex-col items-center">
            {/* Close Button */}
            <button
              onClick={() => setIsWheelOpen(false)}
              disabled={isSpinning}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg leading-none disabled:opacity-30"
            >
              ✕
            </button>

            <span className="text-4xl">🎁</span>
            <h3 className="text-lg font-bold text-gray-800 mt-2 font-serif">Srigovinda Lucky Wheel</h3>
            <p className="text-xxs text-gray-400 mt-1 max-w-[280px]">Spin once to win an exclusive coupon code for your shopping cart!</p>

            {/* Wheel Canvas Drawing wrapper */}
            <div className="relative my-6 w-56 h-56 flex items-center justify-center">
              {/* Center pointer needle */}
              <div className="absolute top-0 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-red-600 z-10 origin-bottom" style={{ transform: 'translateY(-10px)' }} />
              
              {/* Spinning Canvas representation */}
              <div 
                className="w-52 h-52 rounded-full border-4 border-[#d4af37] shadow-lg relative overflow-hidden"
                style={{
                  transform: `rotate(${wheelAngle}deg)`,
                  transition: isSpinning ? 'transform 4s cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none',
                  backgroundImage: 'conic-gradient(#0b1a30 0deg 60deg, #d4af37 60deg 120deg, #0b1a30 120deg 180deg, #d4af37 180deg 240deg, #0b1a30 240deg 300deg, #d4af37 300deg 360deg)'
                }}
              >
                {/* Visual lines overlay inside wheel */}
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                  <span className="absolute transform -rotate-60 translate-y-[-70px]">5% OFF</span>
                  <span className="absolute transform rotate-0 translate-x-[75px] text-[#0b1a30]">Try again</span>
                  <span className="absolute transform rotate-60 translate-y-[70px]">10% OFF</span>
                  <span className="absolute transform rotate-120 translate-y-[70px] text-[#0b1a30]">Free Ship</span>
                  <span className="absolute transform -rotate-180 translate-y-[-70px]">Retry</span>
                  <span className="absolute transform -rotate-120 translate-y-[-70px] text-[#0b1a30]">Gifts 8%</span>
                </div>
              </div>
              <div className="absolute w-8 h-8 rounded-full bg-white border-4 border-[#d4af37] flex items-center justify-center font-bold text-xs text-gray-800 z-10">
                ★
              </div>
            </div>

            {/* Action states */}
            {wonPrize ? (
              <div className="w-full space-y-4 animate-fade-in">
                <div className="bg-green-50 border border-green-200 p-4 rounded-2xl">
                  <p className="text-xs text-green-800 font-bold">🎉 Congratulations! You won:</p>
                  <p className="text-sm font-black text-[#0f2a4a] mt-1">{wonPrize}</p>
                </div>
                {wonCoupon && (
                  <button
                    onClick={() => handleCopyText(wonCoupon)}
                    className="w-full bg-[#d4af37] hover:bg-[#bfa030] text-[#0b1a30] py-3 rounded-2xl font-bold text-xs shadow-md transition-colors uppercase tracking-wider"
                  >
                    Copy Coupon Code
                  </button>
                )}
                <button
                  onClick={() => setIsWheelOpen(false)}
                  className="w-full text-xs text-gray-500 hover:text-gray-700 font-bold transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <button
                onClick={spinWheel}
                disabled={isSpinning || hasSpun}
                className="w-full bg-gradient-to-r from-[#0b1a30] to-[#0f2a4a] text-white py-3.5 rounded-2xl font-bold text-xs shadow-md disabled:bg-gray-150 disabled:text-gray-400 disabled:shadow-none hover:opacity-90 active:scale-95 transition-all uppercase tracking-wider"
              >
                {isSpinning ? 'Spinning...' : hasSpun ? `Already Won: ${wonCoupon}` : 'Spin the Wheel!'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. INTERACTIVE GIFT FINDER QUIZ MODAL DIALOG */}
      {isQuizOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center select-none font-sans">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setIsQuizOpen(false)}
          />

          <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 max-w-sm w-full mx-4 text-center animate-slide-up flex flex-col items-center">
            {/* Close Button */}
            <button
              onClick={() => setIsQuizOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ✕
            </button>

            <span className="text-4xl">🎯</span>
            <h3 className="text-lg font-bold text-gray-800 mt-2 font-serif">Jewellery Gift Finder</h3>
            <p className="text-xxs text-gray-400 mt-1 max-w-[280px]">Answer 3 quick questions and discover the perfect handcrafted recommendation!</p>

            {/* Step Content */}
            <div className="w-full my-6 min-h-[160px] flex items-center justify-center">
              
              {/* Step 1: Who is the recipient */}
              {quizStep === 1 && (
                <div className="w-full space-y-3 animate-fade-in">
                  <p className="text-xs font-bold text-gray-700">1. Who is the recipient of this gift?</p>
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    {["For Myself", "Mother / Sister", "A Dear Friend", "Home Puja / Deities"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleQuizAnswer('target', opt)}
                        className="p-3 bg-gray-50 border border-gray-100 hover:border-[#d4af37] rounded-xl text-xxs font-bold text-gray-600 hover:bg-gray-50/50 hover:text-gray-800 transition-all text-center leading-tight"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Budget */}
              {quizStep === 2 && (
                <div className="w-full space-y-3 animate-fade-in">
                  <p className="text-xs font-bold text-gray-700">2. What is your budget limit?</p>
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    {["Under ₹1,500", "₹1,500 - ₹3,500", "₹3,500 - ₹6,500", "Above ₹6,500"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleQuizAnswer('budget', opt)}
                        className="p-3 bg-gray-50 border border-gray-100 hover:border-[#d4af37] rounded-xl text-xxs font-bold text-gray-600 hover:bg-gray-50/50 hover:text-gray-800 transition-all text-center leading-tight"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Metal Preference */}
              {quizStep === 3 && (
                <div className="w-full space-y-3 animate-fade-in">
                  <p className="text-xs font-bold text-gray-700">3. Which handcrafted metal style do they prefer?</p>
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    {["Handcrafted German Silver", "1 Gram Gold Jewellery", "Sacred Panchaloha Alloy", "Assorted Combo Items"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleQuizAnswer('style', opt)}
                        className="p-3 bg-gray-50 border border-gray-100 hover:border-[#d4af37] rounded-xl text-xxs font-bold text-gray-600 hover:bg-gray-50/50 hover:text-gray-800 transition-all text-center leading-tight"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Results Display */}
              {quizStep === 4 && (
                <div className="w-full space-y-4 animate-fade-in">
                  <div className="bg-emerald-50 border border-emerald-200 p-4.5 rounded-2xl text-left">
                    <p className="text-xs text-emerald-800 font-extrabold flex items-center gap-1">✨ Perfect Matches Found!</p>
                    <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">
                      Based on your preferences, we recommend browsing our **{quizAnswers.style}** collection! We've unlocked a secret finder discount for you:
                    </p>
                    <div className="mt-3 flex justify-between items-center bg-white border border-emerald-100 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[9px] text-gray-400 block uppercase font-mono leading-none">Coupon Code</span>
                        <span className="text-xs font-black text-gray-800 tracking-wider">FINDER5</span>
                      </div>
                      <button
                        onClick={() => handleCopyText('FINDER5')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wide uppercase transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <Link
                    to={`/products?category=${
                      quizAnswers.style.includes('Gold') ? 'one-gram-gold' :
                      quizAnswers.style.includes('Silver') ? 'german-silver' :
                      quizAnswers.style.includes('Panchaloha') ? 'panchaloha' : 'gifts'
                    }`}
                    onClick={() => setIsQuizOpen(false)}
                    className="w-full bg-[#0f2a4a] hover:bg-[#1b4965] text-white py-3 rounded-2xl font-bold text-center block text-xs shadow-md transition-colors uppercase tracking-wider"
                  >
                    View Recommended Catalog
                  </Link>
                </div>
              )}

            </div>

            {/* Back indicator */}
            {quizStep > 1 && quizStep < 4 && (
              <button
                onClick={() => setQuizStep(prev => prev - 1)}
                className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
              >
                ← Back to previous question
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
