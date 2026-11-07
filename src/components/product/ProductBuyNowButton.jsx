import { ShoppingBag } from "lucide-react";
import ProductPaymentIcons from "./ProductPaymentIcons.jsx";

/** Pill Buy now CTA with shimmer + payment chips (reference layout). */
export default function ProductBuyNowButton({
  onClick,
  className = "",
  size = "lg",
  type = "button",
  showPaymentIcons = true,
}) {
  return (
    <button
      type={type}
      className={`product-cta-buy product-cta-buy--${size} ${!showPaymentIcons ? "product-cta-buy--no-icons" : ""} ${className}`.trim()}
      onClick={onClick}
    >
      <span className="product-cta-buy__shine" aria-hidden />
      <span className="product-cta-buy__inner">
        <span className="product-cta-buy__label">
          <ShoppingBag className="product-cta-buy__bag" strokeWidth={2.25} aria-hidden />
          Buy Now
        </span>
        {showPaymentIcons && <ProductPaymentIcons variant="cta" />}
      </span>
    </button>
  );
}
