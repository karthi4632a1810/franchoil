import React, { useState } from "react";
import {
  Star,
  ShoppingBag,
  Eye,
  Heart,
  Check,
  Sparkles,
  ShieldCheck,
  Droplets,
  Layers,
  Flame,
  ArrowRight
} from "lucide-react";
import { PRODUCTS_CATALOG } from "../../data/franchCatalog";

export default function ModernProductGrid({
  onAddToCart,
  onQuickView,
  wishlist = [],
  onToggleWishlist
}) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedVariants, setSelectedVariants] = useState({});

  // Categories list
  const categories = [
    { id: "All", label: "All Formulations (6)" },
    { id: "Pain Relief", label: "Pain & Healing" },
    { id: "Joint Care", label: "Arthritis & Joints" },
    { id: "Supplements", label: "Nutraceuticals" },
    { id: "Skin Care", label: "Ayurvedic Skin" },
    { id: "Bundles", label: "Value Bundles" }
  ];

  // Filter products
  const filteredProducts =
    activeCategory === "All"
      ? PRODUCTS_CATALOG
      : PRODUCTS_CATALOG.filter(
          (p) => p.category === activeCategory || (activeCategory === "Bundles" && p.category === "Bundles")
        );

  const handleVariantSelect = (productId, variantIndex) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: variantIndex
    }));
  };

  return (
    <section id="products" className="py-14 sm:py-20 bg-[#F9FAF8] border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#145C34] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Exact Ayurvedic Catalog
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#111814] mt-2">
              Our Flagship Formulations
            </h2>
            <p className="text-sm text-gray-600 mt-1 max-w-xl">
              25+ years of botanical science. Pure, potent, cold-pressed Ayurvedic solutions for joints, internal vitality, and healthy skin.
            </p>
          </div>

          {/* Guarantee pill */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-200/80 shadow-sm self-start md:self-auto text-xs text-gray-700">
            <ShieldCheck className="w-4 h-4 text-[#145C34]" />
            <span className="font-semibold">100% Genuine Direct from FM Group</span>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                activeCategory === cat.id
                  ? "bg-[#145C34] text-white shadow-md shadow-[#145C34]/25 scale-105"
                  : "bg-white text-gray-700 hover:text-[#145C34] hover:bg-emerald-50/50 border border-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProducts.map((product) => {
            const currentVariantIdx =
              selectedVariants[product.id] !== undefined
                ? selectedVariants[product.id]
                : product.defaultVariantIndex;
            const currentVariant = product.variants[currentVariantIdx];
            const isWishlisted = wishlist.includes(product.id);

            return (
              <div
                key={product.id}
                className="group bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 hover:border-emerald-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Top Badge & Wishlist Heart */}
                <div className="flex items-center justify-between mb-3 z-10">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#145C34] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 shadow-xs">
                    <Sparkles className="w-3 h-3 text-[#F2C230] fill-[#F2C230]" />
                    {product.badge}
                  </span>

                  <button
                    type="button"
                    onClick={() => onToggleWishlist && onToggleWishlist(product.id)}
                    className={`p-2 rounded-full transition-all ${
                      isWishlisted
                        ? "text-red-500 bg-red-50"
                        : "text-gray-400 hover:text-red-500 hover:bg-gray-50"
                    }`}
                    title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart
                      className={`w-4 h-4 ${isWishlisted ? "fill-red-500" : ""}`}
                    />
                  </button>
                </div>

                {/* Product Image Area with Hover Zoom */}
                <div
                  className="relative aspect-square rounded-2xl bg-gradient-to-b from-[#F7FAF8] to-white p-6 flex items-center justify-center cursor-pointer overflow-hidden border border-gray-100 group-hover:border-emerald-100 transition-colors"
                  onClick={() => onQuickView && onQuickView(product)}
                >
                  <img
                    src={product.mainImage}
                    alt={product.name}
                    className="max-h-56 sm:max-h-60 w-auto object-contain drop-shadow-md group-hover:scale-108 transition-transform duration-500"
                  />

                  {/* Quick View Button overlay on hover */}
                  <div className="absolute inset-x-4 bottom-4 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onQuickView) onQuickView(product);
                      }}
                      className="bg-white/95 backdrop-blur-md text-gray-800 hover:text-[#145C34] font-bold text-xs px-4 py-2 rounded-full shadow-lg border border-gray-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Quick View</span>
                    </button>
                  </div>
                </div>

                {/* Content & Details */}
                <div className="pt-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Rating row */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex items-center text-[#F2C230]">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 fill-[#F2C230] ${
                              i === 4 && product.rating < 4.9 ? "opacity-70" : ""
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-gray-800">
                        {product.rating}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({product.reviewsCount} reviews)
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => onQuickView && onQuickView(product)}
                      className="font-display font-extrabold text-lg text-gray-900 group-hover:text-[#145C34] transition-colors cursor-pointer leading-snug"
                    >
                      {product.name}
                    </h3>

                    {/* Short Tagline */}
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                      {product.tagline}
                    </p>

                    {/* Variant Selector Chips */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold mb-1.5">
                        <span>Select Size:</span>
                        <span className="text-emerald-700 font-bold">
                          {currentVariant.size}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {product.variants.map((v, vIdx) => (
                          <button
                            key={v.size}
                            type="button"
                            onClick={() => handleVariantSelect(product.id, vIdx)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                              currentVariantIdx === vIdx
                                ? "bg-[#145C34] text-white border-[#145C34] shadow-xs"
                                : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            {v.size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Add to Cart row */}
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-extrabold text-[#145C34]">
                          ₹{currentVariant.price}
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          ₹{currentVariant.mrp}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-[#F2C230]/30 px-1.5 py-0.2 rounded w-fit">
                        {currentVariant.discount}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onAddToCart && onAddToCart(product, currentVariant)}
                      className="inline-flex items-center gap-1.5 bg-[#145C34] hover:bg-[#0E4325] text-white px-4 py-2.5 rounded-xl font-bold text-xs tracking-wide shadow-md shadow-[#145C34]/20 hover:shadow-lg transition-all active:scale-95 group/btn"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                      <span>Add to Bag</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
