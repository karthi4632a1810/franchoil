import React from "react";
import { ArrowRight, Sparkles, ShieldCheck, Heart, Leaf } from "lucide-react";
import { PRODUCTS_CATALOG } from "../../data/franchCatalog";

export default function ModernCategoryBanners({ onQuickView, onAddToCart }) {
  const nhOil = PRODUCTS_CATALOG.find((p) => p.id === "franch-oil-nh-plus");
  const orthovin = PRODUCTS_CATALOG.find((p) => p.id === "franch-orthovin-thailam");
  const omega3 = PRODUCTS_CATALOG.find((p) => p.id === "omega-3");
  const soap = PRODUCTS_CATALOG.find((p) => p.id === "franch-ayurveda-skin-soap");

  return (
    <section id="category-banners" className="py-14 sm:py-20 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#145C34] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Targeted Healing Focus
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#111814] mt-2">
            Curated Health Solutions
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Tailored Ayurvedic and nutraceutical solutions crafted for lasting wellness.
          </p>
        </div>

        {/* 3 Prominent Banners Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* BANNER 1: Pain & Mobility Care (Large 7 cols) */}
          <div className="lg:col-span-7 bg-gradient-to-br from-[#0E4325] via-[#145C34] to-[#0A331C] rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden flex flex-col justify-between shadow-xl shadow-[#145C34]/15 min-h-[380px]">
            {/* Background decorative glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#F2C230]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-md">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F2C230] uppercase tracking-wider bg-black/20 px-3 py-1 rounded-full mb-4 border border-[#F2C230]/30">
                <Sparkles className="w-3.5 h-3.5 text-[#F2C230]" />
                Flagship Pain Defense
              </span>

              <h3 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight mb-3">
                Conquer Joint & Muscular Pain Without Chemical Pills
              </h3>

              <p className="text-sm text-emerald-100/90 leading-relaxed mb-6 font-normal">
                Combine the multipurpose tissue-healing power of Franch Oil NH* Plus with the deep thermal warmth of Orthovin Thailam. Safe for chronic knee arthritis, frozen shoulder, and daily aches.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onQuickView && onQuickView(nhOil)}
                  className="bg-[#F2C230] hover:bg-[#e2b425] text-gray-950 px-5 py-3 rounded-xl font-bold text-xs tracking-wide shadow-md transition-all flex items-center gap-2"
                >
                  <span>Shop Franch Oil (₹210)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onQuickView && onQuickView(orthovin)}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-3 rounded-xl font-semibold text-xs tracking-wide transition-all"
                >
                  Orthovin Thailam (₹174)
                </button>
              </div>
            </div>

            {/* Product Images Floating on Right */}
            <div className="relative lg:absolute lg:right-6 lg:bottom-6 mt-6 lg:mt-0 flex items-center gap-4 justify-end">
              <div className="w-28 sm:w-32 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 transform -rotate-3 hover:rotate-0 transition-transform">
                <img
                  src="/images/hero-section/oil.webp"
                  alt="Franch Oil"
                  className="w-full h-auto object-contain drop-shadow-2xl"
                />
              </div>
              <div className="w-28 sm:w-32 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 transform rotate-6 hover:rotate-0 transition-transform">
                <img
                  src="/images/hero-section/thailam-product.webp"
                  alt="Orthovin Thailam"
                  className="w-full h-auto object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>

          {/* BANNER 2: Plant-Powered Longevity (5 cols) */}
          <div className="lg:col-span-5 bg-[#FFFDF2] rounded-3xl p-8 sm:p-10 border border-amber-200/60 shadow-lg shadow-amber-900/5 flex flex-col justify-between relative overflow-hidden min-h-[380px]">
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider bg-[#F2C230]/30 px-3 py-1 rounded-full mb-4 border border-[#F2C230]/40">
                100% Vegan Omega-3
              </span>

              <h3 className="font-display text-2xl font-extrabold text-gray-900 leading-tight mb-2">
                Zero Fishy Burps. Pure Organic Flaxseed ALA.
              </h3>

              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                Franch OG-3 Veg delivers essential Omega-3 fatty acids for heart rhythm, brain focus, and joint lubrication inside plant-based vegetarian softgels.
              </p>

              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl font-extrabold text-[#145C34]">₹360</span>
                <span className="text-xs text-gray-400 line-through">₹450</span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  20% OFF
                </span>
              </div>

              <button
                type="button"
                onClick={() => onQuickView && onQuickView(omega3)}
                className="bg-[#145C34] hover:bg-[#0E4325] text-white px-5 py-3 rounded-xl font-bold text-xs tracking-wide shadow-md transition-all flex items-center gap-2"
              >
                <span>Discover OG-3 Veg</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <div className="w-36 bg-white p-2 rounded-2xl border border-amber-100 shadow-sm">
                <img
                  src="/images/hero-section/tablet.webp"
                  alt="OG-3 Veg"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>

          {/* BANNER 3: Ayurvedic Derma Clarity (Full width banner) */}
          <div className="lg:col-span-12 bg-gradient-to-r from-[#EDF5F0] via-[#F4F9F6] to-[#FAF8F2] rounded-3xl p-8 sm:p-10 border border-emerald-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#145C34] uppercase tracking-wider bg-white px-3 py-1 rounded-full mb-3 border border-emerald-200">
                <Leaf className="w-3.5 h-3.5 text-[#145C34]" />
                Ayurvedic Dermal Clarification
              </span>

              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#111814] mb-2">
                Naturally Clear Complexion Infused with Franch Essence
              </h3>

              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Franch Ayurveda Skin Soap gently clears pimples, fades dark spots, and shields skin from prickly heat without synthetic detergents. Grade-1 toilet soap with 76% TFM.
              </p>

              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-[#145C34]">₹54</span>
                  <span className="text-xs text-gray-400 line-through">₹65</span>
                  <span className="text-xs font-semibold text-gray-500">(100g Bar)</span>
                </div>

                <button
                  type="button"
                  onClick={() => onQuickView && onQuickView(soap)}
                  className="bg-[#145C34] hover:bg-[#0E4325] text-white px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>Shop Herbal Soap</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="w-32 sm:w-40 bg-white p-3 rounded-2xl border border-emerald-100 shadow-md transform -rotate-2 hover:rotate-0 transition-transform">
                <img
                  src="/images/hero-section/soap-1.webp"
                  alt="Franch Ayurveda Skin Soap"
                  className="w-full h-auto object-contain"
                />
              </div>
              <div className="w-28 sm:w-36 bg-white p-2.5 rounded-2xl border border-emerald-100 shadow-md transform rotate-3 hover:rotate-0 transition-transform hidden sm:block">
                <img
                  src="/images/hero-section/soap-leaf.webp"
                  alt="Herbal Leaf Soap"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
