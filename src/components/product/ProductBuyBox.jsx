import { Gift, Truck, Star, ShieldCheck, Zap, ShoppingBag, CheckCircle2 } from "lucide-react";
import ProductGiftBanner from "./ProductGiftBanner.jsx";
import ProductDeliveryCards from "./ProductDeliveryCards.jsx";
import ProductTrustBar from "./ProductTrustBar.jsx";
import ProductBuyNowButton from "./ProductBuyNowButton.jsx";
import PincodeServiceabilityCheck from "./PincodeServiceabilityCheck.jsx";
import MaskImage from "../../tools/MaskImage.jsx";
import {
  getProductDiscountPercent,
  getProductMrp,
  getProductEffectivePrice,
  getProductDiscountTag,
  getProductDiscountBadgeLabel,
  isProductDiscountActive,
} from "../../utils/productDiscount.js";

export default function ProductBuyBox({
  product,
  title,
  subtitle,
  displayRating = "5",
  reviewCount = 0,
  avgRating = null,
  quantity,
  onQtyChange,
  minQty = 1,
  isFranchOilQty = false,
  isFav = false,
  onToggleFav,
  onAddToCart,
  onBuyNow,
  packBanner = null,
  pricePackLabel = null,
}) {
  const isDiscountOffer = isProductDiscountActive(product);
  const salePrice = getProductEffectivePrice(product);
  const mrp = getProductMrp(product);
  const discount = getProductDiscountPercent(product);
  const discountTag = getProductDiscountTag(product);
  const badgeLabel = getProductDiscountBadgeLabel(product);
  const showMrp = mrp > salePrice;
  const savings = showMrp ? Math.round(mrp - salePrice) : 0;
  const savingsPercent = showMrp && mrp > 0 ? Math.round(((mrp - salePrice) / mrp) * 100) : 0;

  // Left text: only the discount tag value (e.g. "10% DISCOUNT"), no "Special Offer" appended
  const offerHeadline = discountTag || (discount ? `${discount}% OFF` : badgeLabel);

  const displayQty = isFranchOilQty
    ? quantity
    : Math.max(minQty, quantity);

  const qtyBtn = (delta) => () => onQtyChange(quantity + delta);

  return (
    <div className="product-buy-box poppins space-y-4">
      {/* Brand & Authentic Badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>100% Authentic Ayurvedic · Direct from Franch</span>
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          In Stock &amp; Ready to Ship
        </span>
      </div>

      <div>
        <h1 className="product-buy-box__title text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight m-0">
          {title}
        </h1>
        {subtitle && (
          <p className="product-buy-box__subtitle text-sm text-slate-600 leading-relaxed mt-1.5 m-0">
            {subtitle}
          </p>
        )}
      </div>

      {/* Ratings & Reviews Row */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg shadow-xs">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="font-extrabold text-slate-900">{displayRating}</span>
        </div>
        {reviewCount > 0 ? (
          <>
            <span className="text-slate-300">·</span>
            <span className="text-xs sm:text-sm font-medium text-slate-600">
              {avgRating ? `${avgRating} avg · ` : ""}{reviewCount} customer review{reviewCount !== 1 ? "s" : ""}
            </span>
            <span className="text-slate-300">·</span>
            <a href="#product-reviews" className="text-xs sm:text-sm font-bold text-emerald-700 hover:underline">
              Read reviews
            </a>
          </>
        ) : (
          <a href="#product-reviews" className="text-xs sm:text-sm font-bold text-emerald-700 hover:underline">
            Write the first review
          </a>
        )}
      </div>

      {/* Special Discount Offer Tagline Banner */}
      {isDiscountOffer && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base" aria-hidden>✨</span>
            <span className="font-extrabold text-sm tracking-tight">{offerHeadline}</span>
          </div>
          <span className="bg-white text-red-700 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs">
            {badgeLabel}
          </span>
        </div>
      )}

      {/* Pricing Card */}
      <div className="p-5 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50/60 to-white space-y-2 shadow-xs">
        <div className="flex flex-wrap items-baseline gap-3">
          {pricePackLabel && (
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {pricePackLabel}
            </span>
          )}

          {/* Main Active Price */}
          <span className="text-3xl sm:text-4xl font-black text-emerald-700 font-sans tabular-nums tracking-tight">
            ₹{salePrice}
          </span>

          {/* Strike MRP */}
          {showMrp && (
            <span className="text-base sm:text-lg text-slate-400 line-through font-semibold font-sans tabular-nums">
              ₹{mrp}
            </span>
          )}

          {/* Savings Badge */}
          {savings > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-xs">
              Save ₹{savings} {savingsPercent > 0 ? `(${savingsPercent}% OFF)` : ""}
            </span>
          )}
        </div>

        <p className="text-[11px] sm:text-xs text-slate-500 m-0 font-medium">
          Inclusive of all taxes · Free pan-India delivery · COD &amp; Online Payment Available
        </p>
      </div>

      <ProductGiftBanner />

      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/80 bg-white text-xs font-semibold text-slate-700 shadow-xs">
          <Gift className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Free gift on every order</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/80 bg-white text-xs font-semibold text-slate-700 shadow-xs">
          <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Fast dispatch (3–6 days)</span>
        </div>
      </div>

      {packBanner}

      {/* Action Buttons & Quantity Stepper */}
      <div className="space-y-3 pt-2">
        <ProductBuyNowButton onClick={onBuyNow} size="lg" />

        <div className="flex items-center gap-3">
          {/* Quantity Counter */}
          <div className="flex items-center border-2 border-slate-200 rounded-2xl bg-white p-1 shadow-xs">
            <button
              type="button"
              onClick={qtyBtn(-1)}
              aria-label="Decrease quantity"
              className="h-9 w-9 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-lg flex items-center justify-center transition cursor-pointer"
            >
              −
            </button>
            <span className="w-10 text-center font-black text-slate-900 tabular-nums text-base">
              {displayQty}
            </span>
            <button
              type="button"
              onClick={qtyBtn(1)}
              aria-label="Increase quantity"
              className="h-9 w-9 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-lg flex items-center justify-center transition cursor-pointer"
            >
              +
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            className="flex-1 h-12 rounded-2xl border-2 border-emerald-700 text-emerald-800 bg-white hover:bg-emerald-50 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition shadow-xs cursor-pointer hover:shadow-md"
            onClick={onAddToCart}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>

          {/* Wishlist Button */}
          <button
            type="button"
            className="h-12 w-12 rounded-2xl border-2 border-slate-200 bg-white hover:border-slate-300 flex items-center justify-center transition shadow-xs cursor-pointer"
            onClick={onToggleFav}
            aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
          >
            <MaskImage
              size="1.4em"
              bg={isFav ? "#dc2626" : "#64748b"}
              hBg="#dc2626"
              url={
                isFav
                  ? "https://api.iconify.design/mdi:cards-heart.svg"
                  : "https://api.iconify.design/mdi:cards-heart-outline.svg"
              }
            />
          </button>
        </div>
      </div>

      <ProductDeliveryCards />
      <PincodeServiceabilityCheck />
      <ProductTrustBar />
    </div>
  );
}
