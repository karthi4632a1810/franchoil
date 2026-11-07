import { Gift } from "lucide-react";

/** Shown on product pages — free gift with every order. */
export default function ProductGiftBanner({ compact = false }) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-100 rounded-full px-3 py-1">
        <Gift className="w-3.5 h-3.5 shrink-0 text-rose-700" strokeWidth={2.25} aria-hidden />
        Free gift on every order
      </span>
    );
  }

  return (
    <div className="product-gift-banner flex items-start gap-3 rounded-xl border border-rose-100 bg-gradient-to-r from-rose-50 via-amber-50/80 to-green-50/60 px-4 py-3 mt-3">
      <Gift className="w-6 h-6 shrink-0 text-rose-700 mt-0.5" strokeWidth={2} aria-hidden />
      <div>
        <p className="m-0 text-sm font-bold text-rose-900">Free surprise gift with every order</p>
        <p className="m-0 mt-0.5 text-xs text-slate-600 leading-relaxed">
          A complimentary gift is included with all orders — no minimum purchase required.
        </p>
      </div>
    </div>
  );
}
