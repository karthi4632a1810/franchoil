import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  Droplets,
  Leaf,
  Layers,
  HeartHandshake
} from "lucide-react";
import { BRAND_STORY_POINTS, BRAND_INFO } from "../../data/franchCatalog";

export default function ModernBrandStory() {
  const [activeTab, setActiveTab] = useState("comparison");

  const comparisonRows = [
    {
      feature: "Active Extraction Method",
      franch: "Proprietary Cold-Pressed Herbal Extraction (Heat-Free)",
      others: "High-Heat Boiling & Chemical Solvent Extraction",
      advantage: "Preserves 100% of delicate plant phytosterols and healing enzymes."
    },
    {
      feature: "Base Oil Formulation",
      franch: "100% Pure Ricinus Communis & Medicated Herbal Decoctions",
      others: "Low-Cost Synthetic Liquid Paraffin / Mineral Oil Base",
      advantage: "Zero synthetic petrochemicals; safe for continuous daily dermal absorption."
    },
    {
      feature: "Pain Relief Mechanism",
      franch: "Deep Transdermal Delivery calming tissue inflammation at root",
      others: "Surface sensory numbing with strong synthetic menthol",
      advantage: "Provides lasting restorative healing rather than a 15-minute skin tingle."
    },
    {
      feature: "Multipurpose Restorative Capability",
      franch: "Relieves joint pain, muscle spasms, cuts, burns, wounds & rashes",
      others: "Single-function chemical balm or cosmetic cream only",
      advantage: "One bottle fulfills household emergency first aid & joint care needs."
    },
    {
      feature: "Clinical Legacy & Reputation",
      franch: "25+ Years of FM Group Trust across 3.5 Million Indian Homes",
      others: "New unverified commercial brands with synthetic preservatives",
      advantage: "Proven safety profile across multiple generations since 1998."
    }
  ];

  return (
    <section id="brand-story" className="py-16 sm:py-24 bg-[#F8FAF7] border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#145C34] bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100 inline-flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#F2C230]" />
            FM Group of Companies • Since 1998
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#111814] mt-3 tracking-tight">
            25+ Years of Botanical Science & Healing Wisdom
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-3 leading-relaxed">
            From our founding in 1998 to becoming one of India's most beloved Ayurvedic pain-relief legacies, Franch combines classical knowledge with precision cold-pressed extraction.
          </p>
        </div>

        {/* 4 Key Milestone Numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
            <p className="font-display text-3xl sm:text-4xl font-extrabold text-[#145C34]">
              25+
            </p>
            <p className="text-xs font-bold text-gray-900 mt-1 uppercase tracking-wider">
              Years of Legacy
            </p>
            <p className="text-[11px] text-gray-500 mt-1">Trusted across generations</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
            <p className="font-display text-3xl sm:text-4xl font-extrabold text-[#145C34]">
              3.5M+
            </p>
            <p className="text-xs font-bold text-gray-900 mt-1 uppercase tracking-wider">
              Bottles Delivered
            </p>
            <p className="text-[11px] text-gray-500 mt-1">Relief for Indian families</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
            <p className="font-display text-3xl sm:text-4xl font-extrabold text-[#145C34]">
              12,000+
            </p>
            <p className="text-xs font-bold text-gray-900 mt-1 uppercase tracking-wider">
              Doctors & Vaidyas
            </p>
            <p className="text-[11px] text-gray-500 mt-1">Recommending Franch formulations</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
            <p className="font-display text-3xl sm:text-4xl font-extrabold text-[#F2C230] text-amber-500">
              99.4%
            </p>
            <p className="text-xs font-bold text-gray-900 mt-1 uppercase tracking-wider">
              Customer Trust
            </p>
            <p className="text-[11px] text-gray-500 mt-1">High repeat satisfaction</p>
          </div>
        </div>

        {/* 4-Step Seed to Bottle Process */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-sm mb-16">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#145C34]">
              Seed-to-Bottle Integrity
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              The Cold-Pressed Difference
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              How our proprietary method ensures pharmaceutical-grade Ayurvedic potency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {BRAND_STORY_POINTS.map((step, idx) => (
              <div
                key={step.step}
                className="relative bg-[#F9FAF8] rounded-2xl p-6 border border-gray-100 flex flex-col justify-between"
              >
                <div>
                  <span className="font-display text-2xl font-black text-[#145C34]/30 block mb-2">
                    {step.step}
                  </span>
                  <h4 className="font-display font-bold text-base text-gray-900 mb-1">
                    {step.title}
                  </h4>
                  <p className="text-xs font-semibold text-[#145C34] mb-2">
                    {step.subtitle}
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Comparison Table: Franch vs Commercial Alternatives */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#145C34]">
              Clear Scientific Transparency
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              Franch vs Commercial Alternatives
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-1/4">
                    Comparison Attribute
                  </th>
                  <th className="py-4 px-4 text-xs font-extrabold text-[#145C34] uppercase tracking-wider bg-emerald-50/70 rounded-t-xl w-1/3">
                    🌿 Franch Authentic Formulation
                  </th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">
                    ⚠️ Ordinary Commercial Balms / Oils
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                {comparisonRows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-gray-900 align-top">
                      {row.feature}
                      <p className="text-[11px] text-gray-400 font-normal mt-0.5">
                        {row.advantage}
                      </p>
                    </td>

                    <td className="py-4 px-4 bg-emerald-50/40 text-emerald-950 font-semibold align-top">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#145C34] flex-shrink-0 mt-0.5" />
                        <span>{row.franch}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-gray-500 align-top">
                      <div className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span>{row.others}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
