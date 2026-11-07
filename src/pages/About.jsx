import React from 'react';
import "../css/about-us.css";
import BannerForAll from '../sections/banner';
import Category from '../sections/Category';
import CallToAction from '../sections/CallToAction';
import Testimonial from '../sections/Testimonial';


function About() {
  return (
    <div>
      <BannerForAll title="About Us" breadcrumb="About Us" />
      <div className="w-full min-h-screen flex items-center justify-center  px-4">
        <div className="max-w-[1200px] w-[90%] mt-10 bg-white/90 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
          {/* Left: Modern Image Section */}
          <div className="about-image relative flex items-center justify-center p-8 bg-gradient-to-br from-[#43a047]/20 to-[#5c6bc0]/10">
            <div className="absolute bottom-8 left-8 bg-white/80 rounded-xl px-6 py-2 shadow-lg backdrop-blur-md">
              <span className="quando text-lg font-bold text-[#43a047]">25+ Years of Excellence</span>
            </div>
          </div>
          {/* Right: Content Section */}
          <div className="flex flex-col justify-center p-10 gap-8">
            <h2 className="quando text-4xl font-extrabold text-[#3b3b3b] mb-2 tracking-tight">
              Discover Franch Ayurveda
            </h2>
            <p className="poppins text-lg text-[#444] leading-relaxed">
              <span className="font-bold text-[#5c6bc0]">Franch</span> is redefining wellness for the modern world. Our ecommerce platform brings <span className="font-semibold text-[#43a047]">authentic ayurvedic products</span> directly to your doorstep, blending tradition with cutting-edge convenience.
              <br /><br />
              Shop our <span className="font-bold text-[#fbc02d]">flagship remedies</span>—from the iconic <span className="font-semibold text-[#00897b]">Franch Oil NH* Plus</span> to the innovative <span className="font-semibold text-[#8e24aa]">Ayurveda clear Skin Soap</span>. Each product is crafted with rare herbs, tested for purity, and trusted by millions.
              <br /><br />
              <span className="font-bold text-[#43a047]">Why choose Franch?</span> Fast shipping, secure payments, and a promise of <span className="underline decoration-[#43a047]">100% natural care</span>. Experience holistic wellness, curated for you.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/products"
                className="bg-[#43a047] text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-[#388e3c] transition"
              >
                Shop Now
              </a>
              <a
                href="/contact"
                className="bg-[#5c6bc0] text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-[#3949ab] transition"
              >
                Get Support
              </a>
            </div>
            <div className="mt-6">
              <span className="quando text-xl text-[#8e24aa] font-bold tracking-wide">
                “Shop wellness. Live naturally.”
              </span>
            </div>
          </div>
        </div>
      </div>
      <Category />
      <Testimonial />
      <CallToAction />
    </div>
  );
}

export default About;
