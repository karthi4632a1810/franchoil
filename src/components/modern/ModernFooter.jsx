import React, { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Award,
  ArrowRight,
  Check,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Clock
} from "lucide-react";
import { BRAND_INFO, PRODUCTS_CATALOG } from "../../data/franchCatalog";

export default function ModernFooter({ onQuickView }) {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    setIsSubscribed(true);
  };

  return (
    <footer className="bg-[#0A2616] text-gray-300 pt-16 pb-10 border-t border-emerald-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* 1. TOP NEWSLETTER STRIP */}
        <div className="bg-[#0E351F] rounded-3xl p-8 sm:p-10 border border-emerald-800/40 mb-14 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#F2C230] bg-[#F2C230]/20 px-3 py-1 rounded-full border border-[#F2C230]/30 inline-block">
                Join the Franch Wellness Circle
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                Receive 10% Off Your First Order & Ayurvedic Health Guides
              </h3>
              <p className="text-xs sm:text-sm text-emerald-200/80 max-w-xl">
                Subscribe for seasonal joint care recommendations, wellness tips from certified Ayurvedic doctors, and exclusive subscriber promotions.
              </p>
            </div>

            <div className="lg:col-span-5">
              {isSubscribed ? (
                <div className="bg-emerald-900/60 border border-[#F2C230]/50 rounded-2xl p-4 text-center animate-in fade-in duration-300">
                  <div className="w-8 h-8 rounded-full bg-[#F2C230] text-gray-950 flex items-center justify-center mx-auto mb-2 font-bold">
                    <Check className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Welcome to the Franch Family!</h4>
                  <p className="text-xs text-[#F2C230] mt-1 font-semibold">
                    Use code <span className="underline">FRANCH10</span> at checkout for 10% off.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address..."
                      className="flex-1 bg-white/10 text-white placeholder-gray-400 px-4 py-3 rounded-xl border border-emerald-700/60 focus:outline-none focus:border-[#F2C230] text-sm"
                    />
                    <button
                      type="submit"
                      className="bg-[#F2C230] hover:bg-[#e0b224] text-gray-950 font-bold px-6 py-3 rounded-xl text-sm transition-all whitespace-nowrap shadow-md active:scale-95"
                    >
                      Subscribe
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-300/60">
                    We respect your privacy. Zero spam, unsubscribe at any time.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* 2. MAIN 5-COLUMN FOOTER NAVIGATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-14 border-b border-emerald-900/60 text-xs sm:text-sm">
          {/* Col 1: Brand & Heritage */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-display font-extrabold text-2xl text-white tracking-wide">
                FRANCH
              </span>
              <span className="text-[10px] uppercase font-bold text-gray-900 bg-[#F2C230] px-2 py-0.5 rounded">
                FM GROUP
              </span>
            </div>

            <p className="text-emerald-100/80 leading-relaxed text-xs max-w-sm">
              FM Group of Companies brings over 25 years of Ayurvedic research and proprietary cold-pressed extraction to natural pain relief, joint mobility, plant-based nutrition, and herbal skin care.
            </p>

            <div className="pt-2 text-xs space-y-2 text-emerald-200/90">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#F2C230] flex-shrink-0 mt-0.5" />
                <span>{BRAND_INFO.corporateOffice}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#F2C230] flex-shrink-0" />
                <span>Helpline: {BRAND_INFO.helpline} (Mon-Sat 9AM-7PM)</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#F2C230] flex-shrink-0" />
                <span>Email: {BRAND_INFO.supportEmail}</span>
              </p>
            </div>
          </div>

          {/* Col 2: Flagship Products */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-white text-sm tracking-wider uppercase border-b border-emerald-800/60 pb-2">
              Flagship Products
            </h4>
            <ul className="space-y-2 text-emerald-100/80 text-xs">
              {PRODUCTS_CATALOG.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onQuickView && onQuickView(p)}
                    className="hover:text-[#F2C230] transition-colors text-left"
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Health Solutions */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-white text-sm tracking-wider uppercase border-b border-emerald-800/60 pb-2">
              Health Solutions
            </h4>
            <ul className="space-y-2 text-emerald-100/80 text-xs">
              <li>
                <a href="#products" className="hover:text-[#F2C230] transition-colors">
                  Joint & Knee Pain Relief
                </a>
              </li>
              <li>
                <a href="#products" className="hover:text-[#F2C230] transition-colors">
                  Severe Arthritis & Stiffness
                </a>
              </li>
              <li>
                <a href="#products" className="hover:text-[#F2C230] transition-colors">
                  Wound & Burn Restorative Care
                </a>
              </li>
              <li>
                <a href="#products" className="hover:text-[#F2C230] transition-colors">
                  Vegan Heart & Brain Omega-3
                </a>
              </li>
              <li>
                <a href="#products" className="hover:text-[#F2C230] transition-colors">
                  Herbal Skin Clarification & Acne
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Customer Care & Policies */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-white text-sm tracking-wider uppercase border-b border-emerald-800/60 pb-2">
              Customer Care
            </h4>
            <ul className="space-y-2 text-emerald-100/80 text-xs">
              <li>
                <a href="#faqs" className="hover:text-[#F2C230] transition-colors">
                  Order Tracking & Delivery
                </a>
              </li>
              <li>
                <a href="#faqs" className="hover:text-[#F2C230] transition-colors">
                  Shipping & Return Policy
                </a>
              </li>
              <li>
                <a href="#faqs" className="hover:text-[#F2C230] transition-colors">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="#faqs" className="hover:text-[#F2C230] transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#faqs" className="hover:text-[#F2C230] transition-colors">
                  FAQs & Health Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* 3. TRUST CERTIFICATIONS & COMPLIANCE BADGES */}
        <div className="py-8 flex flex-wrap items-center justify-between gap-6 border-b border-emerald-900/60 text-xs text-emerald-200/80">
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#F2C230]" />
              AYUSH Licensed Formulation
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#F2C230]" />
              GMP Cleanroom Facility
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#F2C230]" />
              Razorpay 256-Bit SSL Encrypted
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#F2C230]" />
              100% Authentic FM Group
            </span>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-emerald-900/80 hover:bg-[#F2C230] hover:text-gray-950 flex items-center justify-center transition-colors text-white"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-emerald-900/80 hover:bg-[#F2C230] hover:text-gray-950 flex items-center justify-center transition-colors text-white"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-emerald-900/80 hover:bg-[#F2C230] hover:text-gray-950 flex items-center justify-center transition-colors text-white"
            >
              <Youtube className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* 4. BOTTOM COPYRIGHT & PAYMENT METHODS */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-emerald-400/60 border-t border-emerald-900/40">
          <p>
            © {new Date().getFullYear()} Franch Global (FM Group of Companies). All rights reserved.
          </p>

          {/* Secure Payment Methods Strip */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-300/80 font-medium hidden sm:inline">100% Secure Payments:</span>
            <img
              src="/images/showcase/payment-methods-strip.webp"
              alt="Supported Payment Methods - UPI, Cards, NetBanking, COD"
              className="h-6 sm:h-7 w-auto object-contain opacity-85 hover:opacity-100 transition-opacity"
            />
          </div>

          <p className="text-[11px] text-center md:text-right">
            Classical Ayurvedic & Nutraceutical formulations.
          </p>
        </div>
      </div>
    </footer>
  );
}
