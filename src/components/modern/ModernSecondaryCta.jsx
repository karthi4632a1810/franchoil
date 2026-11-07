import React, { useState } from "react";
import {
  Sparkles,
  ShoppingBag,
  MessageCircle,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  Award
} from "lucide-react";

export default function ModernSecondaryCta({ onShopNow }) {
  const [copied, setCopied] = useState(false);
  const couponCode = "FRANCH10";

  const handleCopy = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="secondary-cta" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-3xl bg-gradient-to-br from-[#0A331C] via-[#0E4325] to-[#145C34] p-8 sm:p-14 text-white overflow-hidden shadow-2xl shadow-[#145C34]/20 border border-emerald-700/40">
          {/* Subtle decorative glow elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#F2C230]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#F2C230]/20 text-[#F2C230] px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border border-[#F2C230]/30 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 fill-[#F2C230]" />
              Exclusive First Order Privilege
            </div>

            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
              Begin Your Natural Healing Journey Today
            </h2>

            <p className="text-sm sm:text-base text-emerald-100/90 max-w-xl mx-auto leading-relaxed">
              Experience the 25-year Ayurvedic legacy of Franch. Enjoy an instant 10% discount on your first order plus complimentary Pan-India delivery.
            </p>

            {/* Voucher Coupon Box */}
            <div className="inline-flex items-center gap-3 bg-black/30 backdrop-blur-md border border-[#F2C230]/40 px-5 py-3 rounded-2xl">
              <span className="text-xs text-gray-300 font-medium">Use Coupon:</span>
              <span className="font-mono text-base font-extrabold text-[#F2C230] tracking-widest">
                {couponCode}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="ml-2 bg-[#F2C230] hover:bg-[#e2b425] text-gray-950 px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-gray-950" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-950" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Dual CTAs */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#products"
                onClick={onShopNow}
                className="inline-flex items-center gap-2 bg-[#F2C230] hover:bg-[#e0b224] text-gray-950 px-8 py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-[#F2C230]/25 transform active:scale-95 transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Shop All Flagship Products</span>
              </a>

              <a
                href="https://wa.me/919841854321?text=Hello%20Franch%20Ayurveda,%20I%20would%20like%20guidance%20on%20choosing%20the%20right%20product%20for%20my%20condition."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-4 rounded-xl font-semibold text-sm transition-all"
              >
                <MessageCircle className="w-4 h-4 text-[#F2C230]" />
                <span>WhatsApp Health Guidance</span>
              </a>
            </div>

            {/* Trust Assurances */}
            <div className="pt-6 border-t border-emerald-800/60 flex flex-wrap items-center justify-center gap-6 text-xs text-emerald-200">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#F2C230]" />
                100% Satisfaction Guarantee
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#F2C230]" />
                Direct from FM Group Manufacturing
              </span>
              <span>•</span>
              <span>Free Delivery Above ₹499</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
