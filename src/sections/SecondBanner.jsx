import { Link } from "react-router-dom";
import { ShieldCheck, Truck, Gift, Headphones } from "lucide-react";
import yearsBadge from "/images/25_years.webp";
import { PRODUCT_PAYMENT_ICONS } from "../components/product/productPaymentIcons.js";
import paypal from "/images/product/productpage/paypal.webp";
import "../css/banner.css";

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "Secure checkout",
    text: "Razorpay protected payments",
  },
  {
    icon: Truck,
    title: "Free delivery",
    text: "Across India on every order",
  },
  {
    icon: Gift,
    title: "Free gift",
    text: "Surprise gift with purchase",
  },
  {
    icon: Headphones,
    title: "Real support",
    text: "WhatsApp & phone help",
  },
];

const payIcons = [...PRODUCT_PAYMENT_ICONS.map((i) => i.src), paypal];

export default function SecondBannerSection() {
  return (
    <section className="customer-trust-banner w-full bg-w poppins" aria-label="Why customers trust Franch">
      <div className="customer-trust-banner__wrap max-w-[1920px] mx-auto">
        <div className="max-w-[1200px] w-[92%] mx-auto py-10 sm:py-12 lg:py-14">
          <div className="grid grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="col-span-12 lg:col-span-7">
              <span className="customer-trust-banner__eyebrow">Customer trust</span>
              <h2 className="customer-trust-banner__title m-0">
                Trusted Ayurvedic care for 25+ years
              </h2>
              <p className="customer-trust-banner__lead m-0">
                Thousands of families choose Franch for genuine herbal products, safe checkout, and
                reliable delivery — every single day.
              </p>

              <div className="customer-trust-banner__grid">
                {TRUST_POINTS.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="customer-trust-banner__card">
                    <span className="customer-trust-banner__card-icon" aria-hidden>
                      <Icon className="w-5 h-5" strokeWidth={2.25} />
                    </span>
                    <div>
                      <h3 className="m-0">{title}</h3>
                      <p className="m-0">{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="customer-trust-banner__payments">
                <span>Pay securely with</span>
                <div className="customer-trust-banner__pay-icons">
                  {payIcons.map((src) => (
                    <img key={src} src={src} alt="" loading="lazy" />
                  ))}
                </div>
              </div>

              <Link to="/products" className="customer-trust-banner__cta">
                Shop with confidence
              </Link>
            </div>

            <div className="col-span-12 lg:col-span-5 flex justify-center lg:justify-end">
              <div className="customer-trust-banner__badge-wrap">
                <img
                  src={yearsBadge}
                  alt="25+ years of customer trust"
                  className="customer-trust-banner__badge"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
