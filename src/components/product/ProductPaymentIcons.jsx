import { CTA_PAYMENT_ICONS, PRODUCT_PAYMENT_ICONS } from "./productPaymentIcons.js";

/** Circular payment badges for Buy now CTA. */
export default function ProductPaymentIcons({ className = "", size = "md", variant = "row" }) {
  const icons = variant === "cta" ? CTA_PAYMENT_ICONS : PRODUCT_PAYMENT_ICONS;
  const mod = variant === "cta" ? "cta" : size;

  return (
    <span className={`product-payment-icons product-payment-icons--${mod} ${className}`.trim()} aria-hidden>
      {icons.map(({ src, label }) => (
        <span key={label} className="product-payment-icons__chip" title={label}>
          <img src={src} alt="" />
        </span>
      ))}
    </span>
  );
}