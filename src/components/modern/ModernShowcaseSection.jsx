import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  Award,
  ArrowRight,
  Eye,
  ShoppingBag,
  Leaf,
  CheckCircle2,
  Stethoscope,
  Truck,
  HeartHandshake,
  Star,
  Gift,
  Tag
} from "lucide-react";
import { PRODUCTS_CATALOG } from "../../data/franchCatalog";

export default function ModernShowcaseSection({ onAddToCart, onQuickView }) {
  const bannerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: bannerRef,
    offset: ["start end", "end start"]
  });

  // Buttery-smooth parallax depth for background image
  const yParallax = useTransform(scrollYProgress, [0, 1], ["-7%", "7%"]);
  const scaleParallax = useTransform(scrollYProgress, [0, 0.5, 1], [1.07, 1.03, 1.07]);

  // Spring physics config for organic, responsive hover gliding
  const hoverSpring = { damping: 25, stiffness: 160, mass: 0.5 };

  // 1. Mouse hover 3D parallax for 25+ Years Heritage Banner
  const heritageHoverX = useMotionValue(0);
  const heritageHoverY = useMotionValue(0);
  const smoothHeritageX = useSpring(heritageHoverX, hoverSpring);
  const smoothHeritageY = useSpring(heritageHoverY, hoverSpring);

  const bgHeritageX = useTransform(smoothHeritageX, [-0.5, 0.5], ["22px", "-22px"]);
  const bgHeritageY = useTransform(smoothHeritageY, [-0.5, 0.5], ["16px", "-16px"]);
  const emblemX = useTransform(smoothHeritageX, [-0.5, 0.5], ["-24px", "24px"]);
  const emblemY = useTransform(smoothHeritageY, [-0.5, 0.5], ["-18px", "18px"]);
  const emblemRotate = useTransform(smoothHeritageX, [-0.5, 0.5], [-3, 3]);
  const contentHeritageX = useTransform(smoothHeritageX, [-0.5, 0.5], ["-10px", "10px"]);
  const contentHeritageY = useTransform(smoothHeritageY, [-0.5, 0.5], ["-6px", "6px"]);

  const handleHeritageMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    heritageHoverX.set(x);
    heritageHoverY.set(y);
  };

  const handleHeritageMouseLeave = () => {
    heritageHoverX.set(0);
    heritageHoverY.set(0);
  };

  // 2. Mouse hover 3D parallax for Franch Oil Care Banner
  const careHoverX = useMotionValue(0);
  const careHoverY = useMotionValue(0);
  const smoothCareX = useSpring(careHoverX, hoverSpring);
  const smoothCareY = useSpring(careHoverY, hoverSpring);

  const careHoverBgX = useTransform(smoothCareX, [-0.5, 0.5], ["18px", "-18px"]);
  const careHoverBgY = useTransform(smoothCareY, [-0.5, 0.5], ["14px", "-14px"]);
  const careHoverContentX = useTransform(smoothCareX, [-0.5, 0.5], ["-10px", "10px"]);
  const careHoverPriceX = useTransform(smoothCareX, [-0.5, 0.5], ["10px", "-10px"]);

  const handleCareMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    careHoverX.set(x);
    careHoverY.set(y);
  };

  const handleCareMouseLeave = () => {
    careHoverX.set(0);
    careHoverY.set(0);
  };

  // Find the 4 flagship products from catalog
  const franchOil = PRODUCTS_CATALOG.find((p) => p.id === "franch-oil-nh-plus");
  const soap = PRODUCTS_CATALOG.find((p) => p.id === "franch-ayurveda-skin-soap");
  const omega3 = PRODUCTS_CATALOG.find((p) => p.id === "omega-3");
  const orthovin = PRODUCTS_CATALOG.find((p) => p.id === "franch-orthovin-thailam");

  // EXACT CONTENT FROM ORIGINAL MAIN BRANCH IN ORIGINAL ORDER WITH ULTRA-PREMIUM UI
  const showcaseCards = [
    {
      id: "franch-oil-nh-plus",
      product: franchOil,
      image: "/images/showcase/franchoil-1.jpg",
      hoverImage: "/images/showcase/franchoil-1-white.jpg",
      stockStatus: "In stock",
      discountBadge: "10% OFF",
      brandCategory: "FRANCH · AYURVEDIC",
      rating: "5.0",
      title: "Franch Oil NH* Plus",
      subtitle: "Ayurvedic Product - 100 ML",
      price: 198,
      mrp: 220,
      productUrl: "/product/franch-oil-nh-plus"
    },
    {
      id: "franch-ayurveda-skin-soap",
      product: soap,
      image: "/images/showcase/franch-soap-1.jpg",
      hoverImage: "/images/showcase/franch-soap-1-white.jpg",
      stockStatus: "In stock",
      discountBadge: "10% OFF",
      brandCategory: "FRANCH · AYURVEDIC",
      rating: "5.0",
      title: "Franch Ayurveda Clear Skin Soap",
      subtitle: "Soap 100 GM",
      price: 54,
      mrp: 60,
      productUrl: "/product/franch-ayurveda-skin-soap"
    },
    {
      id: "omega-3",
      product: omega3,
      image: "/images/showcase/omega-3-veg.jpg",
      hoverImage: "/images/showcase/omega-3-veg-white.jpg",
      stockStatus: "In stock",
      discountBadge: "10% OFF",
      brandCategory: "FRANCH · AYURVEDIC",
      rating: "5.0",
      title: "OG-3 Veg",
      subtitle: "Ayurvedic Proprietary",
      price: 324,
      mrp: 360,
      productUrl: "/product/omega-3"
    },
    {
      id: "franch-orthovin-thailam",
      product: orthovin,
      image: "/images/showcase/orthovin-1.jpg",
      hoverImage: "/images/showcase/orthovin-1-white.jpg",
      stockStatus: "In stock",
      discountBadge: "10% OFF",
      brandCategory: "FRANCH · AYURVEDIC",
      rating: "5.0",
      title: "Franch Orthovin Thailam",
      subtitle: "60 ML - Ayurvedic Product",
      price: 162,
      mrp: 180,
      productUrl: "/product/franch-orthovin-thailam"
    }
  ];

  const clinicalTrustBadges = [
    {
      icon: <Award className="w-5 h-5 text-[#F2C230]" />,
      title: "25+ Years Legacy",
      desc: "FM Group Trusted Since 1998"
    },
    {
      icon: <Leaf className="w-5 h-5 text-[#145C34]" />,
      title: "100% Active Botanicals",
      desc: "Zero Paraffin or Mineral Oil"
    },
    {
      icon: <Stethoscope className="w-5 h-5 text-[#145C34]" />,
      title: "12,000+ Vaidyas & Doctors",
      desc: "Prescribed Across Indian Clinics"
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#F2C230]" />,
      title: "GMP & AYUSH Certified",
      desc: "Rigorous Pharmacopoeial Quality"
    },
    {
      icon: <Truck className="w-5 h-5 text-[#145C34]" />,
      title: "Delhivery Express Delivery",
      desc: "Pan-India Live Order Tracking"
    },
    {
      icon: <HeartHandshake className="w-5 h-5 text-[#145C34]" />,
      title: "100% Plant & Pure",
      desc: "Non-GMO & Cruelty-Free"
    }
  ];

  return (
    <section id="flagship-showcase" className="relative py-16 sm:py-24 bg-[#F8FAF7] border-b border-gray-100 overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-[#F2C230]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-16">
        {/* 1. MASTER HERITAGE BANNER (25+ YEARS CONTINUOUS AYURVEDIC INNOVATION) */}
        <div
          onMouseMove={handleHeritageMouseMove}
          onMouseLeave={handleHeritageMouseLeave}
          className="relative rounded-3xl overflow-hidden shadow-2xl border border-emerald-900/20 bg-[#0B2E1B] text-white transition-all duration-300"
        >
          {/* Background image overlay with 3D Hover Parallax */}
          <motion.div
            style={{ x: bgHeritageX, y: bgHeritageY, scale: 1.08 }}
            className="absolute -inset-6 z-0 pointer-events-none overflow-hidden"
          >
            <img
              src="/images/showcase/heritage-botanical-bg.webp"
              alt="25+ Years Nature Pedestal Background"
              className="w-full h-full object-cover object-center"
            />
            {/* Subtle soft gradient scrim on left to ensure 100% text contrast while keeping nature visible */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#072414]/85 via-[#072414]/45 to-transparent" />
          </motion.div>

          <div className="relative z-10 p-8 sm:p-12 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content (7-8 cols) with subtle counter-parallax */}
            <motion.div
              style={{ x: contentHeritageX, y: contentHeritageY }}
              className="lg:col-span-7 xl:col-span-8 space-y-4 text-left"
            >
              <div className="inline-flex items-center gap-2 bg-[#C89B3C]/25 text-[#FFDE7D] border border-[#C89B3C]/50 backdrop-blur-sm px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-widest shadow-xs">
                <Sparkles className="w-3.5 h-3.5 fill-[#FFDE7D]" />
                <span>FM GROUP OF COMPANIES • ESTABLISHED 1998</span>
              </div>

              <h2
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.15] tracking-[-0.03em] drop-shadow-md font-sans"
              >
                25+ Years of Clinical Trust, <br className="hidden sm:inline" />
                <span className="text-[#C1F4D4]">Botanical Purity & Living Relief</span>
              </h2>

              <p className="text-sm sm:text-base text-emerald-50/95 max-w-2xl leading-relaxed font-normal drop-shadow-sm">
                Continuous Ayurvedic innovation since 1998. Franch formulates pure cold-pressed botanical medicines free of synthetic numbing agents or petrochemical fillers. Trusted by over 3.5 Million families across India.
              </p>

              {/* Trust pill row */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-white">
                <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#F2C230]" />
                  GMP & AYUSH Licensed
                </span>
                <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 shadow-sm">
                  <Leaf className="w-4 h-4 text-[#4ADE80]" />
                  Heat-Free Cold-Pressed
                </span>
                <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 shadow-sm">
                  <Star className="w-4 h-4 text-[#F2C230] fill-[#F2C230]" />
                  4.9 / 5 Rating (5,100+ Reviews)
                </span>
              </div>
            </motion.div>

            {/* Right Emblem Showcase (4-5 cols) with responsive 3D floating parallax */}
            <motion.div
              style={{ x: emblemX, y: emblemY, rotateZ: emblemRotate }}
              className="lg:col-span-5 xl:col-span-4 flex items-center justify-center lg:justify-end"
            >
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-[#F2C230]/25 rounded-full blur-3xl pointer-events-none group-hover:scale-115 transition-transform duration-500" />
                <img
                  src="/images/showcase/25-years-monument.png"
                  alt="25+ Years FM Group of Companies Monument"
                  className="relative z-10 w-56 sm:w-64 lg:w-72 xl:w-80 h-auto object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* 2. THE 4 PRODUCT SHOWCASE CARDS (ORIGINAL MAIN BRANCH CONTENT WITH ULTRA-PREMIUM UI) */}
        <div className="space-y-8">
          {/* Header Row: "Our Products" */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#145C34] text-white px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider shadow-sm">
                <Leaf className="w-3.5 h-3.5 fill-[#A7F3D0] text-[#A7F3D0]" />
                <span>Our Products</span>
              </div>
              <h3
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#111814] mt-2.5 tracking-[-0.03em] font-sans"
              >
                Engineered for Lasting Restoration
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-xl">
                Experience the authentic original formulations. Cold-pressed botanical extracts delivering active phytonutrients directly where healing is needed.
              </p>
            </div>

            <a
              href="#products"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#145C34] hover:text-[#0B351C] transition-colors self-start md:self-auto group"
            >
              <span>Explore All Sizes & Bundles</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* 4-Card Grid with Ultra-Premium Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
            {showcaseCards.map((card) => {
              const product = card.product;
              if (!product) return null;

              return (
                <div
                  key={card.id}
                  className="group bg-white rounded-3xl border border-emerald-950/[0.08] hover:border-emerald-400/80 shadow-[0_4px_20px_-4px_rgba(20,92,52,0.06)] hover:shadow-[0_22px_44px_-12px_rgba(20,92,52,0.18)] transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Full Product Image Stage (Zero gap around image) */}
                  <div
                    className="relative w-full aspect-square overflow-hidden cursor-pointer bg-emerald-50/20"
                    onClick={() => onQuickView && onQuickView(product)}
                  >
                    {/* Base Product Image */}
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Hover Clip-Path Reveal Image: circle 0% to 150% from bottom-center */}
                    {card.hoverImage && (
                      <img
                        src={card.hoverImage}
                        alt={`${card.title} white view`}
                        className="absolute inset-0 w-full h-full object-cover showcase-clip-reveal pointer-events-none"
                      />
                    )}

                    {/* Floating Top Badges over image (In stock & 10% OFF) */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-950 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-200/80 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{card.stockStatus}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-red-600 via-rose-600 to-rose-500 px-2.5 py-1 rounded-full shadow-md shadow-rose-950/20 border border-white/30 backdrop-blur-xs">
                        <Tag className="w-3 h-3 fill-white text-white rotate-90" />
                        <span>{card.discountBadge}</span>
                      </span>
                    </div>

                    {/* Quick View pill overlay on hover */}
                    <div className="absolute inset-x-4 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex justify-center z-10">
                      <span className="bg-[#145C34]/95 hover:bg-[#0D381E] text-white text-[11px] font-bold px-4 py-1.5 rounded-full shadow-xl backdrop-blur-md flex items-center gap-1.5 tracking-wide transform active:scale-95 transition-all">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Quick View</span>
                      </span>
                    </div>
                  </div>

                  {/* Product Details (Original Content) */}
                  <div className="p-5 pt-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      {/* Category & Star Rating */}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#145C34]">
                          {card.brandCategory}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 shadow-2xs">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{card.rating}</span>
                        </div>
                      </div>

                      {/* Product Title */}
                      <h4
                        className="font-bold text-[17px] text-gray-950 group-hover:text-[#145C34] transition-colors leading-snug line-clamp-1 tracking-[-0.015em] font-sans"
                      >
                        {card.title}
                      </h4>

                      {/* Subtitle / Spec */}
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-1 font-medium">
                        {card.subtitle}
                      </p>
                    </div>

                    {/* Pricing, Perks & Actions */}
                    <div className="pt-3 border-t border-gray-100 space-y-3">
                      {/* Price Row */}
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-extrabold text-[#145C34] tracking-tight">
                            ₹ {card.price}
                          </span>
                          <span className="text-xs text-gray-400 line-through font-medium">
                            ₹ {card.mrp}
                          </span>
                        </div>
                      </div>

                      {/* Perks: Free gift & Free delivery */}
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/60 shadow-2xs">
                          <Gift className="w-3 h-3 text-rose-600" />
                          <span>Free gift</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 shadow-2xs">
                          <Truck className="w-3 h-3 text-emerald-600" />
                          <span>Free delivery</span>
                        </span>
                      </div>

                      {/* Dual Action Buttons: SHOP NOW & Cart Button */}
                      <div className="flex items-center gap-2 pt-1">
                        <Link
                          to={card.productUrl}
                          className="flex-1 py-3 px-4 rounded-xl bg-[#145C34] hover:bg-[#0D381E] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#145C34]/25 hover:shadow-lg hover:shadow-[#145C34]/35 flex items-center justify-center gap-1.5 active:scale-95 group/btn"
                        >
                          <span>SHOP NOW</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            onAddToCart &&
                            onAddToCart(product, product.variants[product.defaultVariantIndex])
                          }
                          className="w-12 h-12 rounded-xl border border-emerald-200/90 hover:border-emerald-500 bg-emerald-50/70 hover:bg-emerald-100 text-[#145C34] hover:text-[#0D381E] flex items-center justify-center transition-all flex-shrink-0 active:scale-95 shadow-2xs group/cart"
                          title="Add to Bag"
                        >
                          <ShoppingBag className="w-4 h-4 group-cart:scale-110 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. INTEGRATED CLINICAL TRUST PILLARS (THE FRANCH CLINICAL DIFFERENCE) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#145C34]">
              The Clinical Difference
            </span>
            <h4
              className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1 tracking-[-0.025em] font-sans"
            >
              Uncompromising Standards for Every Family
            </h4>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {clinicalTrustBadges.map((badge, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-2 sm:px-3 pt-3 sm:pt-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#145C34] flex items-center justify-center mb-2.5 shadow-2xs">
                  {badge.icon}
                </div>
                <h5 className="font-display font-bold text-xs text-gray-900 leading-snug">
                  {badge.title}
                </h5>
                <p className="text-[10px] text-gray-500 mt-1 leading-tight">
                  {badge.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 4. PURE AYURVEDIC CARE - FRANCH OIL NH* PLUS PROMOTIONAL SHOWCASE BANNER */}
        <div
          ref={bannerRef}
          onMouseMove={handleCareMouseMove}
          onMouseLeave={handleCareMouseLeave}
          className="relative overflow-hidden rounded-3xl sm:rounded-[36px] border border-emerald-900/10 shadow-[0_12px_40px_-10px_rgba(20,92,52,0.12)] bg-[#F5F8F3] transition-all duration-500"
        >
          {/* Layer 1: Parallax Clean Photographic Botanical & Water Ripple Background */}
          <motion.div
            style={{ y: yParallax, x: careHoverBgX, scale: scaleParallax }}
            className="absolute -top-[12%] -bottom-[12%] -left-[4%] -right-[4%] w-[108%] h-[124%] pointer-events-none select-none overflow-hidden"
          >
            <picture>
              <source srcSet="/images/showcase/franch-oil-care-clean-bg.webp" type="image/webp" />
              <img
                src="/images/showcase/franch-oil-care-clean-bg.png"
                alt="Franch Oil NH* Plus Botanical Background"
                className="w-full h-full object-cover object-[center_right] md:object-center opacity-90 sm:opacity-100"
                loading="lazy"
              />
            </picture>
            {/* Ambient gradients for crystal-clear text contrast across mobile and desktop */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#F5F8F3]/90 via-[#F5F8F3]/30 to-[#F5F8F3]/90 md:bg-gradient-to-r md:from-[#F5F8F3]/90 md:via-transparent md:to-[#F5F8F3]/80 pointer-events-none" />
          </motion.div>

          {/* Layer 2: Fully Responsive Interactive Content Grid */}
          <div className="relative z-10 flex flex-col md:grid md:grid-cols-12 items-center p-5 sm:p-7 md:p-8 lg:p-12 gap-6 sm:gap-7 md:gap-4 min-h-[460px] lg:min-h-[480px]">
            {/* LEFT COLUMN: Pure Ayurvedic Care Branding, Typography & 4 Ingredients */}
            <motion.div
              style={{ x: careHoverContentX }}
              className="w-full md:col-span-5 lg:col-span-4 xl:col-span-4 flex flex-col justify-center items-start bg-white/70 sm:bg-white/50 md:bg-transparent backdrop-blur-md md:backdrop-blur-none p-4 sm:p-5 md:p-0 rounded-2xl md:rounded-none border border-emerald-900/10 md:border-none shadow-xs md:shadow-none max-w-sm md:max-w-[285px]"
            >
              {/* Eyebrow */}
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-7 sm:w-8 h-[2px] bg-[#145C34]" />
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-[#145C34]">
                  Pure Ayurvedic Care
                </span>
              </div>

              {/* Title */}
              <h3 className="font-serif text-3xl sm:text-4xl md:text-[40px] lg:text-[44px] font-black text-[#0B3B24] tracking-tight leading-[1.04]">
                Franch Oil <br />
                <span className="text-[#145C34]">NH* Plus</span>
              </h3>

              {/* Subtitle */}
              <p className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#145C34] mt-2 mb-2.5">
                Multipurpose Healing Oil
              </p>

              {/* Paragraph - max-w strictly constrained so it wraps at "with" / "natural" and never touches product */}
              <p className="text-[11.5px] sm:text-xs text-gray-700 leading-relaxed font-normal max-w-[260px] sm:max-w-[275px] mb-4 sm:mb-5">
                A trusted Ayurvedic formulation enriched with natural extracts to nourish, protect and keep your skin healthy and radiant every day.
              </p>

              {/* 4 Feature / Ingredient Badges */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2 max-w-[260px] sm:max-w-[275px] pt-1">
                {/* 1. Aloe Vera Extract */}
                <div className="flex flex-col items-center text-center group/ing">
                  <div className="w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-full border border-[#145C34]/30 bg-white/85 backdrop-blur-xs flex items-center justify-center text-[#145C34] shadow-2xs group-hover/ing:scale-105 group-hover/ing:bg-white group-hover/ing:border-[#145C34] transition-all">
                    <svg className="w-4 h-4 text-[#145C34]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2C8.5 6 6 10 6 15a6 6 0 0 0 12 0c0-5-2.5-9-6-13z" />
                      <path d="M12 7v8" />
                      <path d="M9.5 11l2.5 2.5" />
                      <path d="M14.5 12.5l-2.5 2.5" />
                    </svg>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-gray-800 leading-tight mt-1.5">
                    Aloe Vera<br />Extract
                  </span>
                </div>

                {/* 2. Krishna Tulsi Extract */}
                <div className="flex flex-col items-center text-center group/ing">
                  <div className="w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-full border border-[#145C34]/30 bg-white/85 backdrop-blur-xs flex items-center justify-center text-[#145C34] shadow-2xs group-hover/ing:scale-105 group-hover/ing:bg-white group-hover/ing:border-[#145C34] transition-all">
                    <svg className="w-4 h-4 text-[#145C34]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22V9" />
                      <path d="M12 9c-3-2-6-1-7 2 1 3 4 3 7 1" />
                      <path d="M12 13c3-2 6-1 7 2-1 3-4 3-7 1" />
                      <path d="M12 17c-2.5-1.5-5-0.5-6 2 1 2.5 3.5 2.5 6 1" />
                      <circle cx="12" cy="4.5" r="2" fill="currentColor" fillOpacity="0.2" />
                    </svg>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-gray-800 leading-tight mt-1.5">
                    Krishna Tulsi<br />Extract
                  </span>
                </div>

                {/* 3. Almond Oil */}
                <div className="flex flex-col items-center text-center group/ing">
                  <div className="w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-full border border-[#145C34]/30 bg-white/85 backdrop-blur-xs flex items-center justify-center text-[#145C34] shadow-2xs group-hover/ing:scale-105 group-hover/ing:bg-white group-hover/ing:border-[#145C34] transition-all">
                    <svg className="w-4 h-4 text-[#145C34]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3C7.5 7.5 5 12 5 16a7 7 0 0 0 14 0c0-4-2.5-8.5-7-13z" />
                      <path d="M12 8c-2 2.5-3 5-3 8a3 3 0 0 0 6 0c0-3-1-5.5-3-8z" />
                    </svg>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-gray-800 leading-tight mt-1.5">
                    Almond<br />Oil
                  </span>
                </div>

                {/* 4. Vitamin-E Rich */}
                <div className="flex flex-col items-center text-center group/ing">
                  <div className="w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-full border border-[#145C34]/30 bg-white/85 backdrop-blur-xs flex items-center justify-center text-[#145C34] shadow-2xs group-hover/ing:scale-105 group-hover/ing:bg-white group-hover/ing:border-[#145C34] transition-all">
                    <svg className="w-4 h-4 text-[#145C34]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2.5c-4 5-7 9-7 13.5a7 7 0 0 0 14 0c0-4.5-3-8.5-7-13.5z" />
                      <path d="M10 12h4M10 14.5h3.5M10 17h4" strokeWidth="1.6" />
                      <path d="M10 12v5" strokeWidth="1.6" />
                    </svg>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-gray-800 leading-tight mt-1.5">
                    Vitamin-E<br />Rich
                  </span>
                </div>
              </div>
            </motion.div>

            {/* MOBILE ONLY PRODUCT CLEARANCE SPRAY: Lets the bottle & box on stone slab shine on mobile */}
            <div className="w-full h-36 sm:h-44 md:hidden pointer-events-none" />

            {/* TABLET / DESKTOP CENTER SPACER: Frames the central product on stone slab in water */}
            <div className="hidden md:block md:col-span-3 lg:col-span-5 xl:col-span-5 h-full min-h-[300px]" />

            {/* RIGHT COLUMN: Real Discount Badge, Price Typography, Golden Swoosh & CTA Button */}
            <motion.div
              style={{ x: careHoverPriceX }}
              className="w-full md:col-span-4 lg:col-span-3 xl:col-span-3 flex flex-col items-center md:items-end justify-center text-center md:text-right bg-white/70 sm:bg-white/50 md:bg-transparent backdrop-blur-md md:backdrop-blur-none p-4 sm:p-5 md:p-0 rounded-2xl md:rounded-none border border-emerald-900/10 md:border-none shadow-xs md:shadow-none max-w-sm md:max-w-none"
            >
              {/* 10% OFF Badge */}
              <div className="inline-flex items-center gap-1.5 bg-[#0E4A28] text-white px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-extrabold shadow-md mb-2">
                <Tag className="w-3.5 h-3.5 fill-white/20" />
                <span>10% OFF</span>
              </div>

              {/* Price display with our fonts */}
              <div className="flex flex-col items-center md:items-end mt-1">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0B3B24] tracking-tight leading-none font-sans flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">₹</span>
                  <span>198</span>
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-400 line-through tracking-tight mt-1">
                  ₹220
                </div>
              </div>

              {/* Golden Swoosh Curve Underline */}
              <svg className="w-32 sm:w-40 h-3 text-[#C5A059]/70 my-2" viewBox="0 0 140 12" fill="none">
                <path d="M2 2C40 10 100 10 138 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>

              {/* CTA Action Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 mt-3 w-full">
                <button
                  type="button"
                  onClick={() => onAddToCart && onAddToCart(franchOil)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#145C34] hover:bg-[#0D381E] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm shadow-xl shadow-[#145C34]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
                <Link
                  to="/product/franch-oil-nh-plus"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#145C34] hover:text-[#0D381E] hover:underline px-2 py-2"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
