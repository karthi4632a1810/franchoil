import { Sparkles, ShieldCheck } from "lucide-react";
import yearsBadge from "/images/25_years.webp";

export default function DashboardHero({ itemCount, totalCost }) {
  return (
    <section className="dashboard-hero poppins">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl">
            <span className="dashboard-hero-badge mb-4">
              <Sparkles className="w-3.5 h-3.5 inline" />
              Secure Checkout
            </span>
            <h1 className="amarante uppercase mt-3 mb-3">
              You&apos;re One Step Away!
            </h1>
            <p className="text-white/90 text-base sm:text-lg leading-relaxed max-w-lg">
              Complete your order now — <strong className="text-[var(--s-c)]">free home delivery</strong> and a
              surprise gift on every purchase. Trusted Ayurvedic care for 25+ years.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-5 text-sm">
              <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                <ShieldCheck className="w-4 h-4 text-[var(--s-c)]" />
                Razorpay Secure Pay
              </span>
              {itemCount > 0 && (
                <span className="font-bold text-[var(--s-c)] text-lg">
                  {itemCount} item{itemCount !== 1 ? "s" : ""} · ₹{totalCost}
                </span>
              )}
            </div>
          </div>
          <img
            src={yearsBadge}
            alt="25+ years of trust"
            className="dashboard-hero-years hidden sm:block lg:mx-0 mx-auto"
          />
        </div>
      </div>
    </section>
  );
}
