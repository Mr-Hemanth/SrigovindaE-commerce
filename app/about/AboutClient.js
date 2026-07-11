'use client';

import Link from 'next/link';
import Image from 'next/image';

function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 select-none text-left">

      {/* Breadcrumbs */}
      <nav className="text-[10px] text-gray-500 mb-6 flex items-center gap-1.5 font-bold uppercase tracking-wider">
        <Link href="/" className="hover:text-brand-navy-900 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-gray-800">About Us</span>
      </nav>

      <div className="space-y-16">

        {/* Hero Section */}
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-xs font-bold text-brand-gold-700 uppercase tracking-widest block mb-2">Our Heritage & Story</span>
          <h1 className="text-2xl md:text-4xl font-bold text-brand-navy-900 font-serif leading-tight">Sri Govinda Collections</h1>
          <p className="text-sm md:text-lg text-gray-600 leading-relaxed font-medium">
            Preserving South Indian jewellery traditions with premium German Silver, One Gram Gold & Panchaloha masterpieces.
          </p>
        </section>

        {/* Brand & Workshop Showcase Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 font-serif">A Legacy of Artistic Jewellery</h2>
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
              Founded in Amalapuram, Andhra Pradesh, Sri Govinda Collections was born out of a deep respect for Telugu craftsmanship and South Indian heritage. Traditional jewelry is the heartbeat of local festivals, weddings, and shubh milestones. We design jewelry that looks premium, feels comfortable, and carries long-lasting durability.
            </p>
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
              We source raw materials responsibly, collaborating with traditional goldsmiths and alloy artisans who have passed down secrets across generations. From delicate kasu malas to robust German silver gift bowls, we pay attention to detail.
            </p>
          </div>
          <div className="relative rounded-3xl overflow-hidden elegant-shadow aspect-[4/3] bg-gray-100">
            <Image
              src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80"
              alt="Artisan Workshop"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl text-xxs font-bold text-brand-navy-900 shadow border">
              📍 Crafted in Amalapuram, AP
            </div>
          </div>
        </section>

        {/* Craftsmanship details */}
        <section className="bg-gradient-to-b from-brand-cream-100 to-brand-cream-200 border border-gray-100/50 rounded-3xl p-8 md:p-12 space-y-10">
          <div className="text-center max-w-lg mx-auto space-y-2">
            <h3 className="text-xl md:text-3xl font-bold text-gray-800 font-serif">Our Material Pillars</h3>
            <p className="text-xxs md:text-xs text-gray-500 uppercase tracking-widest font-bold">100% Quality & Metal Authenticity</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* German Silver */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100/50 space-y-4">
              <span className="text-3xl block">💎</span>
              <h4 className="text-base md:text-lg font-bold text-brand-navy-900 font-serif">Premium German Silver</h4>
              <p className="text-xxs md:text-xs text-gray-500 leading-relaxed">
                Made using high-grade copper-nickel-zinc alloys, polished to emulate antique silver&apos;s rustic luster. Ideal for heavy chokers, gift plates, and wedding return gift boxes.
              </p>
            </div>

            {/* One Gram Gold */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100/50 space-y-4">
              <span className="text-3xl block">🌟</span>
              <h4 className="text-base md:text-lg font-bold text-brand-navy-900 font-serif">One Gram Gold</h4>
              <p className="text-xxs md:text-xs text-gray-500 leading-relaxed">
                Features micro-plated 24kt gold layers on strong brass-copper base templates. Emulates the weight, details, and traditional look of solid gold temple jewellery.
              </p>
            </div>

            {/* Panchaloha */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100/50 space-y-4">
              <span className="text-3xl block">🪔</span>
              <h4 className="text-base md:text-lg font-bold text-brand-navy-900 font-serif">Sacred Panchaloha</h4>
              <p className="text-xxs md:text-xs text-gray-500 leading-relaxed">
                Crafted using the sacred 5-metal alloy (Gold, Silver, Copper, Zinc, Iron) matching ancient metallurgical rules. Invites balance, positive energy, and spiritual strength.
              </p>
            </div>
          </div>
        </section>

        {/* Founder's Note */}
        <section className="bg-white border border-gray-100 rounded-3xl p-8 md:p-12 elegant-shadow grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-1 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-brand-navy-950 to-brand-navy-900 text-white flex items-center justify-center font-bold text-2xl mb-4 font-serif">
              H
            </div>
            <h4 className="font-bold text-gray-800 text-sm">Hemanth</h4>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Founder & Visionary</span>
          </div>

          <div className="md:col-span-2 text-left space-y-4 relative pl-4 md:border-l border-gray-100">
            <span className="text-4xl text-brand-gold-500 font-serif absolute -top-4 -left-2 opacity-35">“</span>
            <p className="text-xs md:text-sm text-gray-600 italic leading-relaxed pt-2">
              At Sri Govinda Collections, we believe jewelry is more than an adornment; it is a living thread connecting us to our culture, traditions, and memories. Our family is committed to providing Amalapuram and the rest of India with the highest quality traditional jewelry.
            </p>
            <p className="text-xs md:text-sm text-gray-600 italic leading-relaxed">
              Every package shipped carries our promise of quality and traditional care. We look forward to being a part of your celebrations and shubh milestones.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white rounded-3xl p-8 md:p-12 text-center space-y-6">
          <h3 className="text-2xl font-bold font-serif">Join the Sri Govinda Family</h3>
          <p className="text-xs md:text-sm opacity-90 max-w-xl mx-auto leading-relaxed">
            Browse our full catalog of premium silver, gold plated, and festive jewelry items. We offer express delivery across India.
          </p>
          <div className="pt-2">
            <Link href="/products" className="inline-block bg-white text-brand-navy-900 hover:bg-[#f0f4f8] px-8 py-3.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-300 shadow-lg hover:scale-[1.03]">
              Browse the Collection
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}

export default About;
