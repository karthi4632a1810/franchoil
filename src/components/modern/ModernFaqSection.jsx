import React, { useState } from "react";
import { ChevronDown, HelpCircle, ShieldCheck } from "lucide-react";
import { FAQS } from "../../data/franchCatalog";

export default function ModernFaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section id="faqs" className="py-16 sm:py-24 bg-[#F8FAF7] border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#145C34] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Frequently Asked Questions
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#111814] mt-2">
            Got Questions? We Have Answers.
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Everything you need to know about our formulations, usage methods, and order delivery.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden transition-all duration-200 shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full py-5 px-6 text-left flex items-center justify-between gap-4 font-display font-bold text-base sm:text-lg text-gray-900 hover:text-[#145C34] transition-colors focus:outline-none"
                >
                  <span className="flex-1">{faq.q}</span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      isOpen
                        ? "bg-[#145C34] text-white rotate-180"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm text-gray-600 leading-relaxed border-t border-gray-100 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Help Note */}
        <div className="mt-10 text-center text-xs text-gray-500">
          Still have a question? Contact our Ayurvedic consultants directly at{" "}
          <a
            href="tel:+919841854321"
            className="text-[#145C34] font-bold hover:underline"
          >
            +91 98418 54321
          </a>{" "}
          or via WhatsApp.
        </div>
      </div>
    </section>
  );
}
