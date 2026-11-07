import { PRODUCT_PAYMENT_ICONS } from "./productPaymentIcons.js";
import paypal from "/images/product/productpage/paypal.webp";

const payIcons = [...PRODUCT_PAYMENT_ICONS.map((i) => i.src), paypal];

const TRUST_ITEMS = [
  {
    icon: "https://api.iconify.design/mingcute:safety-certificate-fill.svg",
    label: "Secure Razorpay checkout",
  },
  {
    icon: "https://api.iconify.design/ic:twotone-local-shipping.svg",
    label: "Free delivery across India",
  },
  {
    icon: "https://api.iconify.design/mdi:package-variant-closed-check.svg",
    label: "Track order after purchase",
  },
  {
    icon: "https://api.iconify.design/meteor-icons:gift.svg",
    label: "Free gift on every order",
  },
];

export default function ProductTrustBar() {
  const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || "919841854321";
  const waLink = `https://wa.me/${whatsapp.replace(/\D/g, "")}`;

  return (
    <section className="product-trust-bar poppins mt-8 pt-6 border-t border-slate-100 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TRUST_ITEMS.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-2.5 rounded-xl border border-slate-100 bg-white shadow-sm px-3 py-4 text-center hover:border-green-200 hover:shadow-md transition-shadow"
          >
            <span
              className="mask-item shrink-0"
              style={{
                "--m-size": "1.5rem",
                "--m-bg": "var(--p-c)",
                "--m-url": `url(${item.icon})`,
              }}
            />
            <span className="text-[11px] sm:text-xs font-semibold text-slate-700 leading-snug">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-green-50/40 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-800">
          <span
            className="mask-item shrink-0"
            style={{
              "--m-size": "1.25rem",
              "--m-bg": "var(--p-c)",
              "--m-url": "url(https://api.iconify.design/mingcute:safety-certificate-fill.svg)",
            }}
          />
          <span className="font-semibold">100% secure payment · Genuine Ayurvedic products</span>
        </div>
        <div className="pay-cards-available flex items-center gap-2 flex-wrap justify-center sm:justify-end">
          {payIcons.map((src) => (
            <img key={src} src={src} alt="" className="h-7 w-auto opacity-90" />
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-slate-600 m-0 leading-relaxed">
        Need help? Call{" "}
        <a href="tel:+919841854321" className="text-[var(--p-c)] font-semibold hover:underline">
          (+91) 984 185 4321
        </a>
        {" · "}
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-[var(--p-c)] font-semibold hover:underline">
          WhatsApp
        </a>
        {" · Mon–Sat 10 AM – 7 PM"}
      </p>
    </section>
  );
}
