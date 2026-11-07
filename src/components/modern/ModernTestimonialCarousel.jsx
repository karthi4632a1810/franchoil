import React, { useState, useEffect } from "react";
import {
  Star,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Quote,
  Sparkles,
  Award
} from "lucide-react";
import { REVIEWS_CATALOG } from "../../data/franchCatalog";

export default function ModernTestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filterProduct, setFilterProduct] = useState("all");

  const filteredReviews =
    filterProduct === "all"
      ? REVIEWS_CATALOG
      : REVIEWS_CATALOG.filter((r) => r.productId === filterProduct);

  const maxIndex = Math.max(0, filteredReviews.length - 1);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [filterProduct]);

  return (
    <section id="testimonials" className="py-16 sm:py-24 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#145C34] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Real Experiences • 25+ Years
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#111814] mt-2">
              Stories of Natural Healing & Relief
            </h2>
            <p className="text-sm text-gray-600 mt-1 max-w-xl">
              Over 3.5 million Indian households rely on Franch for joint agility, skin recovery, and daily plant-based vitality.
            </p>
          </div>

          {/* Aggregate Rating Badge Card */}
          <div className="flex items-center gap-4 bg-[#F8FAF7] border border-emerald-100 px-5 py-3 rounded-2xl self-start md:self-auto shadow-sm">
            <div className="text-center border-r border-gray-200 pr-4">
              <span className="font-display text-3xl font-extrabold text-[#145C34]">
                4.9
              </span>
              <span className="text-xs text-gray-400 font-bold block">out of 5</span>
            </div>
            <div>
              <div className="flex items-center text-[#F2C230] mb-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#F2C230]" />
                ))}
              </div>
              <p className="text-xs font-bold text-gray-800">5,100+ Verified Reviews</p>
              <p className="text-[10px] text-gray-500">98.4% Customer Recommendation</p>
            </div>
          </div>
        </div>

        {/* Product Filter Tags */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          <button
            onClick={() => setFilterProduct("all")}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filterProduct === "all"
                ? "bg-[#145C34] text-white shadow-sm"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            All Reviews ({REVIEWS_CATALOG.length})
          </button>
          <button
            onClick={() => setFilterProduct("franch-oil-nh-plus")}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filterProduct === "franch-oil-nh-plus"
                ? "bg-[#145C34] text-white shadow-sm"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            Franch Oil NH* Plus
          </button>
          <button
            onClick={() => setFilterProduct("franch-orthovin-thailam")}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filterProduct === "franch-orthovin-thailam"
                ? "bg-[#145C34] text-white shadow-sm"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            Orthovin Thailam
          </button>
          <button
            onClick={() => setFilterProduct("omega-3")}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filterProduct === "omega-3"
                ? "bg-[#145C34] text-white shadow-sm"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            OG-3 Veg Omega-3
          </button>
          <button
            onClick={() => setFilterProduct("franch-ayurveda-skin-soap")}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filterProduct === "franch-ayurveda-skin-soap"
                ? "bg-[#145C34] text-white shadow-sm"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            Ayurveda Skin Soap
          </button>
        </div>

        {/* Testimonials Grid / Carousel */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.slice(0, 6).map((rev) => (
            <div
              key={rev.id}
              className="bg-[#FBFDFB] hover:bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 hover:border-emerald-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Rating & Verified Tag */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-[#F2C230]">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#F2C230]" />
                    ))}
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#145C34]" />
                    Verified Buyer
                  </span>
                </div>

                {/* Review Title */}
                <h4 className="font-display font-bold text-base text-gray-900 leading-snug mb-2">
                  "{rev.title}"
                </h4>

                {/* Comment */}
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-normal mb-6">
                  {rev.comment}
                </p>
              </div>

              {/* Author Info */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#145C34] to-[#0E4325] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {rev.avatar}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">{rev.name}</h5>
                    <p className="text-[10px] text-gray-400">{rev.city}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-semibold text-[#145C34] bg-emerald-50 px-2 py-0.5 rounded block">
                    {rev.productName.split(" ")[1] || "Franch"}
                  </span>
                  <span className="text-[9px] text-gray-400 mt-0.5 block">{rev.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
