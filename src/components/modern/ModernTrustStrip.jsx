import React from "react";
import {
  ShieldCheck,
  Leaf,
  Stethoscope,
  Award,
  Truck,
  HeartHandshake
} from "lucide-react";
import { TRUST_BADGES } from "../../data/franchCatalog";

export default function ModernTrustStrip() {
  const iconMap = {
    legacy: <Award className="w-6 h-6 text-[#F2C230]" />,
    actives: <Leaf className="w-6 h-6 text-[#145C34]" />,
    doctor: <Stethoscope className="w-6 h-6 text-[#145C34]" />,
    gmp: <ShieldCheck className="w-6 h-6 text-[#F2C230]" />,
    dispatch: <Truck className="w-6 h-6 text-[#145C34]" />,
    vegetarian: <HeartHandshake className="w-6 h-6 text-[#145C34]" />
  };

  return (
    <section className="bg-white py-10 sm:py-14 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#145C34] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            The Franch Clinical Difference
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#111814] mt-2">
            Why Millions of Families Choose Franch
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            25+ years of time-tested botanical formulation backed by uncompromising purity standards.
          </p>
        </div>

        {/* 6-Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {TRUST_BADGES.map((badge) => (
            <div
              key={badge.id}
              className="group bg-[#FBFDFB] hover:bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 hover:border-emerald-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-white group-hover:bg-emerald-50/70 border border-gray-100 flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  {iconMap[badge.id]}
                </div>
                <h3 className="font-display font-bold text-sm text-gray-900 group-hover:text-[#145C34] transition-colors leading-snug">
                  {badge.title}
                </h3>
                <p className="text-[11px] font-semibold text-[#145C34] mt-0.5">
                  {badge.subtitle}
                </p>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed mt-2 pt-2 border-t border-gray-100/80">
                {badge.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
