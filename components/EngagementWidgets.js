'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, addDoc } from 'firebase/firestore';

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

  const canvasRef = useRef(null);

  // The floating spin-wheel/WhatsApp buttons are position:fixed in the bottom corners, so once
  // the footer scrolls into view they sit on top of its contact info and legal links. Fade them
  // out whenever the footer is visible rather than permanently covering site content.
  const [footerVisible, setFooterVisible] = useState(false);
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { rootMargin: '0px 0px -10px 0px' }
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  // Check if user already spun in the last 30 days. This must stay an effect
  // (not a useState lazy initializer) so the server-rendered and first client
  // paint match before localStorage is consulted, avoiding a hydration mismatch.
  useEffect(() => {
    const lastSpunTime = localStorage.getItem('srigovinda_wheel_spun_time');
    const savedCoupon = localStorage.getItem('srigovinda_wheel_spun');
    if (lastSpunTime) {
      const diffDays = (new Date().getTime() - Number(lastSpunTime)) / (1000 * 3600 * 24);
      if (diffDays < 30) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, not derivable during render
        setHasSpun(true);
        if (savedCoupon) setWonCoupon(savedCoupon);
      }
    }
  }, []);

  // Redraw canvas whenever lucky wheel modal is open
  useEffect(() => {
    if (!isWheelOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const segments = [
      { text: "5% OFF", color: "#1a1a1a", textColor: "#ffffff" },
      { text: "Retry", color: "#b8860b", textColor: "#1a1a1a" },
      { text: "10% OFF", color: "#1a1a1a", textColor: "#ffffff" },
      { text: "Retry", color: "#b8860b", textColor: "#1a1a1a" },
      { text: "Retry", color: "#1a1a1a", textColor: "#ffffff" },
      { text: "8% OFF", color: "#b8860b", textColor: "#1a1a1a" }
    ];
    
    const numSegments = segments.length;
    const angle = 2 * Math.PI / numSegments;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 4;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < numSegments; i++) {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, i * angle, (i + 1) * angle);
      ctx.fillStyle = segments[i].color;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(i * angle + angle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = segments[i].textColor;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(segments[i].text, radius - 15, 0);
      ctx.restore();
    }
  }, [isWheelOpen]);

  // Handle Wheel Spin
  const spinWheel = async () => {
    if (isSpinning || hasSpun) return;
    setIsSpinning(true);

    // Prizes matching: 0: 5% Off, 1: Retry, 2: 10% Off, 3: Retry, 4: Retry, 5: 8% Off Gifts
    const prizes = [
      { text: "5% OFF", discount: 5, baseCode: "SRI5" },
      { text: "Try Again", discount: 0, baseCode: null },
      { text: "10% OFF", discount: 10, baseCode: "SRI10" },
      { text: "Try Again", discount: 0, baseCode: null },
      { text: "Better Luck Next Time", discount: 0, baseCode: null },
      { text: "8% OFF", discount: 8, baseCode: "GIFT8" }
    ];

    // Force selection of a winning prize (e.g. 10% off at index 2, or 8% off at index 5)
    const winIdx = Math.random() > 0.5 ? 2 : 5;
    const degPerSegment = 60;
    const targetAngle = 360 * 5 + (360 - winIdx * degPerSegment - 30); // 5 full spins + offset to land in middle

    setWheelAngle(targetAngle);

    setTimeout(async () => {
      setIsSpinning(false);
      const prize = prizes[winIdx];
      
      if (prize.baseCode) {
        // Generate a random code suffix
        const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const randomCode = `${prize.baseCode}-${suffix}`;
        
        try {
          // Add to Firestore so it is verified during checkout
          await addDoc(collection(db, 'coupons'), {
            code: randomCode,
            discountPercentage: prize.discount,
            expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString() // 30 days expiration
          });

          setWonPrize(`${prize.text} (Coupon Code: ${randomCode})`);
          setWonCoupon(randomCode);
          setHasSpun(true);
          
          localStorage.setItem('srigovinda_wheel_spun_time', String(Date.now()));
          localStorage.setItem('srigovinda_wheel_spun', randomCode);
        } catch (err) {
          console.error("Error creating random coupon:", err);
          // Don't show a code that was never actually saved — it wouldn't verify at checkout.
          setWonPrize("Couldn't generate your coupon right now — please try again in a moment.");
          setHasSpun(false);
        }
      } else {
        setWonPrize(prize.text);
      }
    }, 4000);
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Coupon Code "${text}" copied to clipboard! Enjoy your discount!`);
  };

  return (
    <>
      {/* 1. FLOATING ACTION CONTAINER (BOTTOM LEFT) - SPIN WHEEL ONLY */}
      <div className={`fixed bottom-6 left-6 z-40 flex flex-col gap-3.5 select-none font-sans transition-opacity duration-300 ${footerVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {/* Spin to Win Gift Wheel Button */}
        <button
          onClick={() => setIsWheelOpen(true)}
          className="bg-gradient-to-r from-brand-gold-500 to-brand-gold-600 text-brand-navy-950 p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center gap-2 border border-white/20 text-xs font-extrabold"
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
      <div className={`fixed bottom-6 right-6 z-40 select-none font-sans text-left transition-opacity duration-300 ${footerVisible && !isChatOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {/* Chat window panel */}
        {isChatOpen && (
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden w-80 max-w-[90vw] mb-4 animate-slide-up flex flex-col">
            {/* Header */}
            <div className="bg-[#0f7a37] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
                    🪔
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
                </div>
                <div>
                  <h4 className="text-xs font-black">Sri Govinda Collections</h4>
                  <p className="text-[10px] text-white/95">Support • Active Now</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                aria-label="Close chat"
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
                We offer Premium German Silver & Panchaloha articles. How can we help you choose your jewellery today?
              </div>
            </div>

            {/* Input Action Panel */}
            <div className="p-4 bg-white border-t border-gray-100">
              <a
                href="https://wa.me/919533866777?text=Hi%20Srigovinda%20Collections,%20I%27m%20visiting%20your%20site%20and%20have%20a%20question%20about%20your%20jewellery%20collections."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#0f7a37] hover:bg-[#0c6530] text-white py-3 rounded-2xl font-bold text-center block text-xs shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.012 2C6.5 2 2.006 6.5 2.006 12c0 1.755.459 3.468 1.33 4.98L2.006 22l5.148-1.35C8.61 21.468 10.29 22 12.012 22 17.5 22 22 17.5 22 12S17.52 2 12.012 2zm6.6 13.911c-.27.765-1.35 1.395-2.07 1.485-.63.09-1.44.18-4.23-.99-3.555-1.53-5.85-5.13-6.03-5.355-.18-.225-1.44-1.935-1.44-3.69 0-1.755.9-2.61 1.215-2.97.27-.27.675-.405 1.08-.405.135 0 .27 0 .36.009.27.009.405.027.63.54.27.63.9 2.205.99 2.385.09.18.135.405.009.63-.135.225-.27.405-.405.585-.135.18-.27.36-.09.675.36.63 1.62 2.655 3.42 4.275 1.575 1.395 2.925 1.845 3.33 2.025.27.09.54.09.765-.135.27-.315 1.215-1.395 1.53-1.89.315-.45.63-.36 1.08-.18.45.18 2.835 1.35 3.33 1.575.495.225.81.36.945.54.135.225.135 1.26-.135 2.025z"/>
                </svg>
                Chat on WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Floating whatsapp action bubble button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          aria-label={isChatOpen ? 'Close WhatsApp chat' : 'Open WhatsApp chat'}
          aria-expanded={isChatOpen}
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

      {/* 3. LUCKY SPIN WHEEL POPUP MODAL DIALOG */}
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
            <p className="text-xxs text-gray-400 mt-1 max-w-[280px]">Spin once a month to win an exclusive coupon code for your shopping cart!</p>

            {/* Wheel Canvas Drawing wrapper */}
            <div className="relative my-6 w-56 h-56 flex items-center justify-center">
              {/* Center pointer needle */}
              <div className="absolute top-0 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-red-600 z-10 origin-bottom" style={{ transform: 'translateY(-10px)' }} />
              
              {/* Spinning Canvas representation */}
              <canvas 
                ref={canvasRef}
                width="220"
                height="220"
                className="w-52 h-52 rounded-full border-4 border-brand-gold-500 shadow-lg relative overflow-hidden bg-white"
                style={{
                  transform: `rotate(${wheelAngle}deg)`,
                  transition: isSpinning ? 'transform 4s cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none'
                }}
              />
              <div className="absolute w-8 h-8 rounded-full bg-white border-4 border-brand-gold-500 flex items-center justify-center font-bold text-xs text-gray-800 z-10">
                ★
              </div>
            </div>

            {/* Action states */}
            {wonPrize ? (
              <div className="w-full space-y-4 animate-fade-in text-center">
                <div className="bg-green-50 border border-green-200 p-4 rounded-2xl">
                  <p className="text-xs text-green-800 font-bold">🎉 Congratulations! You won:</p>
                  <p className="text-xs font-black text-brand-navy-900 mt-1 break-all">{wonPrize}</p>
                </div>
                {wonCoupon && (
                  <button
                    onClick={() => handleCopyText(wonCoupon)}
                    className="w-full bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-navy-950 py-3 rounded-2xl font-bold text-xs shadow-md transition-colors uppercase tracking-wider"
                  >
                    Copy Coupon Code
                  </button>
                )}
                <button
                  onClick={() => setIsWheelOpen(false)}
                  className="w-full text-xs text-gray-500 hover:text-gray-700 font-bold transition-colors font-sans"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <button
                onClick={spinWheel}
                disabled={isSpinning || hasSpun}
                className="w-full bg-gradient-to-r from-brand-navy-950 to-brand-navy-900 text-white py-3.5 rounded-2xl font-bold text-xs shadow-md disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none hover:opacity-90 active:scale-95 transition-all uppercase tracking-wider font-sans"
              >
                {isSpinning ? 'Spinning...' : hasSpun ? 'Already Spun This Month' : 'Spin the Wheel!'}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}