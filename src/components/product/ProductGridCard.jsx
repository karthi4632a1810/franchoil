import { Link } from "react-router-dom";
import { Gift, Truck } from "lucide-react";
import MaskImage from "../../tools/MaskImage.jsx";
import {
  getProductDiscountPercent,
  getProductMrp,
  getProductEffectivePrice,
  getProductDiscountTag,
  isProductDiscountActive,
} from "../../utils/productDiscount.js";
import "../../css/productGrid.css";

export default function ProductGridCard({
  product,
  isFav = false,
  onToggleFav,
  onAddToCart,
  onZoom,
}) {
  const isDiscount = isProductDiscountActive(product);
  const discount = getProductDiscountPercent(product);
  const discountTag = getProductDiscountTag(product);
  const delPrice = getProductMrp(product);
  const salePrice = getProductEffectivePrice(product);
  const showMrp = delPrice > salePrice;
  const image1 = product.imageURL || product.images?.[0] || "";
  const image2 = product.images?.[1] || image1;
  const sku = product.sku || product.id;

  return (
    <article className="franch-product-card w-full h-full flex flex-col group">
       {(isDiscount || (discount != null && discount > 0)) && (
          <>
          <div className="discount-offer-wrapper absolute">
             <div className="discount-offer">
               {discountTag || `${discount}% OFF`}
             </div>
             <div className="discount-offer-1" aria-hidden />
          </div>
          </>
        )}
      <div className="products-image-wrapper">
       
        <span className="product-badge product-badge--stock">In stock</span>

        <Link to={`/product/${sku}`} className="products-image relative flex">
          <img src={image1} alt={product.title} className="w-full h-full object-cover absolute top-0 left-0" loading="lazy" />
          <img src={image2} alt="" className="w-full h-full object-cover absolute top-0 left-0" loading="lazy" aria-hidden />
        </Link>

        <div className="settings-wrapper flex flex-col gap-2 items-center justify-center">
          <button
            type="button"
            className="settings"
            style={{ "--delay": "0.4s" }}
            aria-label="Zoom product image"
            onClick={(e) => {
              e.preventDefault();
              onZoom?.(image1);
            }}
          >
            <MaskImage url="https://api.iconify.design/tabler:zoom-pan.svg" size="1rem" bg="#333" hBg="#fff" />
          </button>
          <button
            type="button"
            className="settings"
            style={{ "--delay": "0.2s" }}
            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
            onClick={(e) => {
              e.preventDefault();
              onToggleFav?.(product);
            }}
          >
            <MaskImage
              url={isFav ? "/icon/fill-h.svg" : "/icon/h.svg"}
              size="0.95rem"
              bg={isFav ? "#dc2626" : "#333"}
              hBg="#dc2626"
            />
          </button>
          <button
            type="button"
            className="settings"
            style={{ "--delay": "0s" }}
            aria-label="Add to cart"
            onClick={(e) => {
              e.preventDefault();
              onAddToCart?.(product);
            }}
          >
            <MaskImage
              url="https://api.iconify.design/material-symbols:shopping-cart-outline.svg"
              size="1rem"
              bg="#333"
              hBg="#fff"
            />
          </button>
        </div>
      </div>

      <div className="products-content-wrapper">
        <div className="product-card-body">
          <div className="tag-and-ratings">
            <Link to={`/product/${sku}`} className="p-tag uppercase">
              Franch · Ayurvedic
            </Link>
            <Link to={`/product/${sku}`} className="p-ratings">
              <MaskImage url="https://api.iconify.design/material-symbols:star.svg" size="1em" bg="#ffc107" hBg="#ffc107" />
              5.0
            </Link>
          </div>

          <div className="product-card-copy">
            <Link to={`/product/${sku}`} className="p-title group-hover:text-[var(--p-c)] transition-colors">
              {product.title}
            </Link>
            {product.subTitle ? (
              <Link to={`/product/${sku}`} className="p-subtitle">
                {product.subTitle}
              </Link>
            ) : null}

            <div className="p-pricing-block mt-auto">
              <div className="p-price-row">
                <span className="p-price font-sans tabular-nums">₹ {salePrice}</span>
                {showMrp && (
                  <span className="p-mrp font-sans tabular-nums" aria-label={`Original price ₹ ${delPrice}`}>
                    ₹ {delPrice}
                  </span>
                )}
              </div>
              <div className="p-perks mt-1">
                <span className="p-perk p-perk--gift">
                  <Gift className="w-3 h-3 shrink-0" strokeWidth={2.25} aria-hidden />
                  Free gift
                </span>
                <span className="p-perk p-perk--ship">
                  <Truck className="w-3 h-3 shrink-0" strokeWidth={2.25} aria-hidden />
                  Free delivery
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="product-btn-wrapper">
          <Link to={`/product/${sku}`} className="product-buy-now flex-1">
            Shop Now
          </Link>
          <button
            type="button"
            className="product-cart-btn flex justify-center items-center shrink-0"
            aria-label="Add to cart"
            onClick={() => onAddToCart?.(product)}
          >
            <MaskImage
              url="https://api.iconify.design/material-symbols:shopping-cart-outline.svg"
              size="1.2rem"
              bg="var(--p-c)"
              hBg="var(--t-c-l)"
            />
          </button>
        </div>
      </div>
    </article>
  );
}

export { getProductDiscountPercent as getDiscountPercent };
