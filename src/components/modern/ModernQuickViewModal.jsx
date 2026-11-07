import React, { useState, useEffect } from "react";
import {
  X,
  Star,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Minus,
  Heart,
  Droplets,
  Layers,
  Sparkles
} from "lucide-react";

export default function ModernQuickViewModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  wishlist = [],
  onToggleWishlist
}) {
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.mainImage || (product.gallery && product.gallery[0]) || "");
      setSelectedVariantIdx(product.defaultVariantIndex || 0);
      setQuantity(1);
      setAddedAnimation(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const currentVariant = product.variants[selectedVariantIdx] || product.variants[0];
  const isWishlisted = wishlist.includes(product.id);

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart(product, currentVariant, quantity);
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
        <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all w-full max-w-4xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* LEFT: Product Gallery (5 cols) */}
            <div className="md:col-span-5 space-y-4">
              <div className="relative aspect-square rounded-2xl bg-gradient-to-b from-gray-50 to-[#F2F7F4] p-6 flex items-center justify-center border border-gray-100 overflow-hidden">
                <img
                  src={selectedImage || product.mainImage}
                  alt={product.name}
                  className="max-h-72 w-auto object-contain drop-shadow-xl transition-all duration-300"
                />

                <span className="absolute top-3 left-3 bg-[#145C34] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {product.badge}
                </span>
              </div>

              {/* Thumbnails */}
              {product.gallery && product.gallery.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {product.gallery.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`w-14 h-14 rounded-xl p-1 bg-gray-50 border flex-shrink-0 transition-all ${
                        selectedImage === img
                          ? "border-[#145C34] ring-2 ring-[#145C34]/20"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={img}
                        alt="Thumbnail"
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Product Details (7 cols) */}
            <div className="md:col-span-7 space-y-4 text-left">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center text-[#F2C230]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#F2C230]" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-gray-800">
                    {product.rating}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({product.reviewsCount} customer reviews)
                  </span>
                </div>

                <h3 className="font-display font-extrabold text-2xl text-gray-900 leading-tight">
                  {product.name}
                </h3>
                <p className="text-xs font-semibold text-[#145C34] mt-0.5">
                  {product.shortTagline}
                </p>
              </div>

              {/* Price row */}
              <div className="flex items-baseline gap-2.5 pt-1">
                <span className="text-3xl font-extrabold text-[#145C34]">
                  ₹{currentVariant.price * quantity}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  ₹{currentVariant.mrp * quantity}
                </span>
                <span className="bg-[#F2C230]/30 text-amber-950 font-bold text-xs px-2 py-0.5 rounded-full border border-[#F2C230]/40">
                  {currentVariant.discount}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-600 leading-relaxed font-normal">
                {product.description}
              </p>

              {/* Variant Selector */}
              <div className="pt-2">
                <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-2">
                  <span>Available Packaging:</span>
                  <span className="text-[#145C34]">{currentVariant.size}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v, idx) => (
                    <button
                      key={v.size}
                      type="button"
                      onClick={() => setSelectedVariantIdx(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        selectedVariantIdx === idx
                          ? "bg-[#145C34] text-white border-[#145C34] shadow-sm"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {v.size} • ₹{v.price}
                    </button>
                  ))}
                </div>
              </div>

              {/* Benefits Bullet Points */}
              <div className="pt-2 space-y-1.5 bg-[#F9FAF8] p-3.5 rounded-2xl border border-gray-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Key Formulation Benefits
                </p>
                {product.benefits.slice(0, 3).map((b, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#145C34] flex-shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              {/* Specs Grid */}
              {product.specs && (
                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 pt-1">
                  <div>
                    <span className="font-bold text-gray-900">Formulation: </span>
                    {product.specs.formulation}
                  </div>
                  <div>
                    <span className="font-bold text-gray-900">Recommended for: </span>
                    {product.specs.suitableFor}
                  </div>
                </div>
              )}

              {/* Action row: Quantity & Add to Cart */}
              <div className="pt-3 flex items-center gap-3">
                {/* Quantity */}
                <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1.5 text-gray-500 hover:text-gray-800"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-extrabold text-gray-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-1.5 text-gray-500 hover:text-gray-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add to Bag */}
                <button
                  type="button"
                  onClick={handleAdd}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 ${
                    addedAnimation
                      ? "bg-[#F2C230] text-gray-950 font-extrabold"
                      : "bg-[#145C34] hover:bg-[#0E4325] text-white"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {addedAnimation
                      ? "Added to Your Bag!"
                      : `Add to Bag • ₹${currentVariant.price * quantity}`}
                  </span>
                </button>

                {/* Wishlist toggle */}
                <button
                  type="button"
                  onClick={() => onToggleWishlist && onToggleWishlist(product.id)}
                  className={`p-3.5 rounded-xl border border-gray-200 transition-colors ${
                    isWishlisted
                      ? "bg-red-50 text-red-500 border-red-200"
                      : "bg-white text-gray-400 hover:text-red-500"
                  }`}
                  title="Wishlist"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500" : ""}`} />
                </button>
              </div>

              {/* Direct Assurance */}
              <div className="pt-2 flex items-center gap-4 text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#145C34]" />
                  GMP Certified AYUSH Facility
                </span>
                <span>•</span>
                <span>Free Delivery Above ₹499</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
