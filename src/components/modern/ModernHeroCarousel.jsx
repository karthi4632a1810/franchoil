import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Leaf,
  Droplets,
  ShieldCheck,
  Sparkles,
  Truck,
  Headphones,
  X,
  Heart,
  Activity
} from "lucide-react";

export default function ModernHeroCarousel({ onAddToCart, onQuickView }) {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [progress, setProgress] = useState(0); // 0 to 100 for active slide progress bar
  const [isPaused, setIsPaused] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1440
  );

  const desktopVideoRefs = useRef([]);
  const mobileVideoRefs = useRef([]);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // 8.0s per slide - matches the trimmed clean video duration (8.6s) with zero jitter or shake
  const SLIDE_DURATION = 8000;

  const slidesData = [
    {
      id: "franch-oil",
      kicker: "NATURAL HEALING CARE",
      tabLabel: "Franch Oil",
      tabSub: "Multipurpose Healing",
      titleLine1: "Ayurveda with",
      titleLine2: "Franch Essentials",
      description:
        "Pure Ayurvedic multipurpose healing oil for chronic joint pain, muscular stiffness, burns & skin repair.",
      productId: "franch-oil-nh-plus",
      productUrl: "/product/franch-oil-nh-plus",
      ctaText: "Shop Franch Oil",
      video: "/VIDEO/franchoil-banner-clean.mp4",
      poster: "/VIDEO/franchoil-banner-poster.jpg",
      mobVideo: "/VIDEO/franchoil-banner-mob-clean.mp4",
      mobPoster: "/VIDEO/franchoil-banner-mob-poster.jpg",
      badgeText: "Cold-Pressed Castor Decoction",
      features: [
        { icon: "leaf", line1: "100%", line2: "Natural Herbs" },
        { icon: "sparkles", line1: "Cold-Pressed", line2: "Extraction" },
        { icon: "droplets", line1: "Multipurpose", line2: "Healing Oil" },
        { icon: "shield", line1: "Safe &", line2: "Trusted Care" }
      ]
    },
    {
      id: "orthovin",
      kicker: "DEEP JOINT & ARTHRITIS RELIEF",
      tabLabel: "Orthovin Thailam",
      tabSub: "Joint & Arthritis",
      titleLine1: "Mobility with",
      titleLine2: "Orthovin Thailam",
      description:
        "Deep penetrating classical thailam delivering thermal relief directly to rigid synovial joints and cartilage.",
      productId: "franch-orthovin-thailam",
      productUrl: "/product/franch-orthovin-thailam",
      ctaText: "Shop Orthovin",
      video: "/VIDEO/orthovine-banner-clean.mp4",
      poster: "/VIDEO/orthovine-banner-poster.jpg",
      mobVideo: "/VIDEO/orthovine-banner-clean.mp4",
      mobPoster: "/VIDEO/orthovine-banner-poster.jpg",
      badgeText: "Synovial Thermal Warmth",
      features: [
        { icon: "activity", line1: "Fast Thermal", line2: "Joint Relief" },
        { icon: "leaf", line1: "Classical", line2: "Ayurvedic Thailam" },
        { icon: "droplets", line1: "Deep Synovial", line2: "Penetration" },
        { icon: "shield", line1: "Mobility &", line2: "Cartilage Care" }
      ]
    },
    {
      id: "omega-3",
      kicker: "100% VEGAN OMEGA-3 ALA",
      tabLabel: "OG-3 Veg",
      tabSub: "Heart & Brain",
      titleLine1: "Vitality with",
      titleLine2: "OG-3 Veg Softgels",
      description:
        "Pure cold-pressed organic flaxseed omega-3 softgels. Zero fishy burps, zero ocean toxins, daily heart & brain wellness.",
      productId: "omega-3",
      productUrl: "/product/omega-3",
      ctaText: "Shop OG-3 Veg",
      video: "/VIDEO/omega-3-banner-clean.mp4",
      poster: "/VIDEO/omega-3-banner-poster.jpg",
      mobVideo: "/VIDEO/omega-3-banner-clean.mp4",
      mobPoster: "/VIDEO/omega-3-banner-poster.jpg",
      badgeText: "Organic Plant-Based ALA",
      features: [
        { icon: "leaf", line1: "100% Vegan", line2: "Plant Omega-3" },
        { icon: "heart", line1: "Daily Heart &", line2: "Brain Health" },
        { icon: "sparkles", line1: "Zero Fishy", line2: "Burps or Toxins" },
        { icon: "shield", line1: "Pure Organic", line2: "Flaxseed ALA" }
      ]
    },
    {
      id: "franch-soap",
      kicker: "AYURVEDIC CLEAR SKIN RADIANCE",
      tabLabel: "Herbal Soap",
      tabSub: "Clear Skin Care",
      titleLine1: "Radiance with",
      titleLine2: "Franch Herbal Soap",
      description:
        "Enriched with Franch Oil NH+ and pure botanical extracts. Deeply cleanses impurities, purifies blemishes, and locks in natural herbal hydration.",
      productId: "franch-ayurveda-skin-soap",
      productUrl: "/product/franch-ayurveda-skin-soap",
      ctaText: "Shop Herbal Soap",
      video: "/VIDEO/franch-soap-banner-clean.mp4",
      poster: "/VIDEO/franch-soap-banner-poster.jpg",
      mobVideo: "/VIDEO/franch-soap-banner-clean.mp4",
      mobPoster: "/VIDEO/franch-soap-banner-poster.jpg",
      badgeText: "Enriched with Franch Oil NH+",
      features: [
        { icon: "sparkles", line1: "Clear Skin", line2: "Blemish Care" },
        { icon: "droplets", line1: "Enriched with", line2: "Franch Oil NH+" },
        { icon: "leaf", line1: "100% Pure", line2: "Botanical Base" },
        { icon: "shield", line1: "Gentle Daily", line2: "Moisturizing" }
      ]
    }
  ];

  const currentSlide = slidesData[activeSlide];

  // Dynamic icon helper for product features
  const renderFeatureIcon = (iconName) => {
    switch (iconName) {
      case "leaf":
        return <Leaf className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-white text-white" />;
      case "sparkles":
        return <Sparkles className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />;
      case "droplets":
        return <Droplets className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />;
      case "shield":
        return <ShieldCheck className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />;
      case "heart":
        return <Heart className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-white text-white" />;
      case "activity":
        return <Activity className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />;
      default:
        return <Leaf className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-white text-white" />;
    }
  };

  // Window resize handler
  useEffect(() => {
    let lastWidth = typeof window !== "undefined" ? window.innerWidth : 1440;
    const handleResize = () => {
      if (Math.abs(window.innerWidth - lastWidth) > 3) {
        lastWidth = window.innerWidth;
        setWindowWidth(window.innerWidth);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Safe video playback management across slides: reset currentTime to 0 on switch
  const ensureVideoPlaying = useCallback((index) => {
    const desk = desktopVideoRefs.current[index];
    if (desk) {
      try {
        if (desk.readyState >= 1) {
          desk.currentTime = 0;
        }
        desk.play().catch(() => {});
      } catch (_) {}
    }
    const mob = mobileVideoRefs.current[index];
    if (mob) {
      try {
        if (mob.readyState >= 1) {
          mob.currentTime = 0;
        }
        mob.play().catch(() => {});
      } catch (_) {}
    }
  }, []);

  // On active slide change: play new video immediately and pause inactive ones after fade transition
  useEffect(() => {
    ensureVideoPlaying(activeSlide);

    const pauseTimer = setTimeout(() => {
      desktopVideoRefs.current.forEach((vid, idx) => {
        if (vid && idx !== activeSlide) {
          vid.pause();
        }
      });
      mobileVideoRefs.current.forEach((vid, idx) => {
        if (vid && idx !== activeSlide) {
          vid.pause();
        }
      });
    }, 1100);

    return () => clearTimeout(pauseTimer);
  }, [activeSlide, ensureVideoPlaying]);

  // Navigate to specific slide with direction calculation
  const goToSlide = useCallback(
    (targetIndex, manualDir = null) => {
      if (targetIndex === activeSlide) return;
      const computedDir =
        manualDir !== null
          ? manualDir
          : targetIndex > activeSlide
          ? 1
          : -1;

      setDirection(computedDir);
      ensureVideoPlaying(targetIndex);
      setActiveSlide(targetIndex);
      setProgress(0);
    },
    [activeSlide, ensureVideoPlaying]
  );

  const handlePrev = useCallback(() => {
    const nextIdx = activeSlide === 0 ? slidesData.length - 1 : activeSlide - 1;
    goToSlide(nextIdx, -1);
  }, [activeSlide, goToSlide, slidesData.length]);

  const handleNext = useCallback(() => {
    const nextIdx = (activeSlide + 1) % slidesData.length;
    goToSlide(nextIdx, 1);
  }, [activeSlide, goToSlide, slidesData.length]);

  // Auto-advance with progress tracking (pauses gracefully when user hovers or opens video)
  useEffect(() => {
    if (isPaused || isVideoModalOpen) return;

    const intervalMs = 40;
    const step = (intervalMs / SLIDE_DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPaused, isVideoModalOpen, handleNext]);

  // Mobile Touch Gestures
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const heroAspectRatio =
    windowWidth < 768
      ? "9 / 16"
      : windowWidth > 1200
      ? "16 / 6.5"
      : "16 / 9";

  // Framer Motion Animation Variants for Content
  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 44 : -44,
      opacity: 0,
      filter: "blur(5px)"
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        x: { type: "spring", stiffness: 260, damping: 28 },
        opacity: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
        filter: { duration: 0.38 }
      }
    },
    exit: (dir) => ({
      x: dir > 0 ? -36 : 36,
      opacity: 0,
      filter: "blur(5px)",
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    })
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#FAFBF9]">
      {/* 1. HERO MAIN CONTAINER - ROCK-SOLID STATIC VIDEO (NO PARALLAX, NO SHAKING) */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative flex items-start md:items-center w-full overflow-hidden aspect-[9/16] md:aspect-[16/9] min-[1201px]:aspect-[16/6.5] select-none"
        style={{ aspectRatio: heroAspectRatio }}
      >
        {/* Fixed Background Video Container: 100% static, rock-solid, no mouse tracking */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* DESKTOP POSTER & VIDEO LAYER (Screen width >= md) */}
          <div className="hidden md:block absolute inset-0 w-full h-full">
            {slidesData.map((slide, idx) => {
              const isActive = idx === activeSlide;
              return (
                <div
                  key={`desktop-slide-layer-${slide.id}`}
                  className="absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out"
                  style={{
                    opacity: isActive ? 1 : 0,
                    pointerEvents: "none",
                    zIndex: isActive ? 2 : 1,
                    willChange: "opacity"
                  }}
                >
                  {/* First frame banner preview image (visible instantly before and while video loads) */}
                  <img
                    src={slide.poster}
                    alt={`${slide.tabLabel} preview banner`}
                    loading={idx === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <video
                    ref={(el) => (desktopVideoRefs.current[idx] = el)}
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster={slide.poster}
                    preload="auto"
                    className="absolute inset-0 w-full h-full object-cover bg-transparent"
                  >
                    <source src={slide.video} type="video/mp4" />
                  </video>
                </div>
              );
            })}
          </div>

          {/* MOBILE PORTRAIT POSTER & VIDEO LAYER (Screen width < md) */}
          <div className="block md:hidden absolute inset-0 w-full h-full overflow-hidden">
            {slidesData.map((slide, idx) => {
              const isActive = idx === activeSlide;
              return (
                <div
                  key={`mobile-slide-layer-${slide.id}`}
                  className="absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out overflow-hidden"
                  style={{
                    opacity: isActive ? 1 : 0,
                    pointerEvents: "none",
                    zIndex: isActive ? 2 : 1,
                    willChange: "opacity"
                  }}
                >
                  {/* First frame mobile banner preview image (visible instantly before and while video loads) */}
                  <img
                    src={slide.mobPoster}
                    alt={`${slide.tabLabel} mobile preview banner`}
                    loading={idx === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                  <video
                    ref={(el) => (mobileVideoRefs.current[idx] = el)}
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster={slide.mobPoster}
                    preload="auto"
                    className="absolute inset-0 w-full h-full object-cover object-center bg-transparent"
                  >
                    <source src={slide.mobVideo} type="video/mp4" />
                  </video>
                </div>
              );
            })}
          </div>
        </div>

        {/* Responsive Gradient Overlay: Darker on text side for crisp legibility, transparent on product side */}
        <div className="hero-gradient-overlay absolute inset-0 z-0 pointer-events-none" />

        {/* Floating Side Navigation Arrows (Desktop & Tablet) */}
        <button
          type="button"
          onClick={handlePrev}
          className="hidden sm:flex absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/25 hover:bg-[#145C34] text-white backdrop-blur-md border border-white/25 shadow-2xl items-center justify-center transition-all duration-300 hover:scale-105 active:scale-90 z-20 group"
          title={`Previous: ${
            slidesData[
              activeSlide === 0 ? slidesData.length - 1 : activeSlide - 1
            ].tabLabel
          }`}
        >
          <ChevronLeft className="w-5 h-5 text-white group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="hidden sm:flex absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/25 hover:bg-[#145C34] text-white backdrop-blur-md border border-white/25 shadow-2xl items-center justify-center transition-all duration-300 hover:scale-105 active:scale-90 z-20 group"
          title={`Next: ${
            slidesData[(activeSlide + 1) % slidesData.length].tabLabel
          }`}
        >
          <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* MAIN CONTENT CONTAINER */}
        <div className="max-w-7xl mx-auto px-5 sm:px-12 pt-7 sm:pt-10 pb-72 sm:pb-80 md:py-8 lg:py-12 w-full relative z-10 my-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-6 items-center">
            {/* LEFT CONTENT COLUMN (7 cols) with Staggered Framer Motion Reveal */}
            <div className="md:col-span-7">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={`hero-slide-content-${activeSlide}`}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-3.5 sm:space-y-4 lg:space-y-5 text-center md:text-left flex flex-col items-center md:items-start"
                >
                  {/* Kicker tag with Botanical Accent */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
                    <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-[0.2em] text-[#A7F3D0]">
                      {currentSlide.kicker}
                    </span>
                    {currentSlide.badgeText && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-white/40 hidden sm:inline-block" />
                        <span className="text-[10px] sm:text-[11px] font-medium text-white/80 hidden sm:inline-block">
                          {currentSlide.badgeText}
                        </span>
                      </>
                    )}
                  </motion.div>

                  {/* Main Headline - Bold display typography */}
                  <motion.h1
                    initial={{ opacity: 0, y: 22, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.52,
                      delay: 0.15,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    className="text-[34px] sm:text-5xl lg:text-[54px] font-extrabold text-white leading-[1.12] sm:leading-[1.12] tracking-[-0.03em] drop-shadow-lg text-center md:text-left font-sans"
                  >
                    {currentSlide.titleLine1} <br />
                    <span className="relative inline-block">
                      <span>{currentSlide.titleLine2}</span>
                      {/* Sprouting leaf badge with spring entry */}
                      <motion.span
                        initial={{ scale: 0, rotate: -35 }}
                        animate={{ scale: 1, rotate: -12 }}
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 18,
                          delay: 0.28
                        }}
                        className="absolute left-full top-1/2 -translate-y-1/2 pl-1.5 sm:pl-2 inline-flex items-center text-[#4ADE80]"
                      >
                        <Leaf className="w-6 h-6 sm:w-7 sm:h-7 fill-[#4ADE80] text-[#22C55E] transform -translate-y-0.5" />
                      </motion.span>
                    </span>
                  </motion.h1>

                  {/* Paragraph description */}
                  <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.42, delay: 0.22, ease: "easeOut" }}
                    className="text-[11px] sm:text-sm text-white/90 leading-relaxed max-w-sm sm:max-w-xl font-normal drop-shadow text-center md:text-left mx-auto md:mx-0"
                  >
                    {currentSlide.description}
                  </motion.p>

                  {/* 4 Feature Circles Row (Desktop > 1200px) - Dynamically tailored to current slide */}
                  {windowWidth > 1200 && currentSlide.features && (
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: 0.28, ease: "easeOut" }}
                      className="hidden min-[1201px]:flex flex-wrap items-center gap-2 sm:gap-5 py-2.5 sm:py-4 border-y border-white/20"
                    >
                      {currentSlide.features.map((feat, idx) => (
                        <React.Fragment key={`feature-${currentSlide.id}-${idx}`}>
                          {idx > 0 && <div className="hidden sm:block w-px h-8 bg-white/20" />}
                          <div className="flex items-center gap-1.5 sm:gap-2.5">
                            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-white/15 backdrop-blur-sm text-white flex items-center justify-center flex-shrink-0 shadow-xs border border-white/20">
                              {renderFeatureIcon(feat.icon)}
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-white leading-tight">
                              {feat.line1} <br /> {feat.line2}
                            </span>
                          </div>
                        </React.Fragment>
                      ))}
                    </motion.div>
                  )}

                  {/* Action Buttons: Shop Formulation & Watch Video */}
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.34, ease: "easeOut" }}
                    className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-5 pt-1 w-full"
                  >
                    {/* Primary Direct Product CTA */}
                    <Link
                      to={currentSlide.productUrl}
                      className="inline-flex items-center gap-2.5 sm:gap-3 bg-[#145C34] hover:bg-[#0D381E] text-white pl-5 pr-2 py-2.5 sm:pl-7 sm:pr-3 sm:py-3.5 rounded-full font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-[#145C34]/30 hover:shadow-xl hover:shadow-[#145C34]/40 transform active:scale-95 transition-all group"
                    >
                      <span>{currentSlide.ctaText}</span>
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-[#145C34] flex items-center justify-center font-bold text-[10px] sm:text-xs group-hover:translate-x-0.5 transition-transform">
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#145C34]" />
                      </div>
                    </Link>

                    {/* Watch Video modal trigger */}
                    <button
                      type="button"
                      onClick={() => setIsVideoModalOpen(true)}
                      className="flex items-center gap-2.5 sm:gap-3 text-left group"
                    >
                      <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white/15 backdrop-blur-sm group-hover:bg-white/25 text-white flex items-center justify-center shadow-xs transition-colors border border-white/20">
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white ml-0.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-bold text-white group-hover:text-[#A7F3D0] transition-colors leading-snug">
                          Watch Video
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-white/70 font-medium">
                          See formulation story
                        </span>
                      </div>
                    </button>
                  </motion.div>
                </motion.div>
              </AnimatePresence>

              {/* ─────────────────────────────────────────────────────────────
                  PREMIUM SEGMENTED SLIDE INDICATORS (DESKTOP & TABLET)
                  ───────────────────────────────────────────────────────────── */}
              <div className="hidden sm:flex items-center gap-3 pt-5 sm:pt-6 w-full">
                <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/35 backdrop-blur-md border border-white/20 shadow-2xl">
                  {slidesData.map((slide, idx) => {
                    const isActive = activeSlide === idx;
                    return (
                      <button
                        key={`tab-indicator-${slide.id}`}
                        type="button"
                        onClick={() => goToSlide(idx)}
                        className={`relative px-3.5 py-2 rounded-xl text-left transition-all duration-300 group overflow-hidden ${
                          isActive
                            ? "bg-white/20 text-white shadow-xs"
                            : "text-white/60 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {/* Live Animated Progress Bar */}
                        {isActive && (
                          <div
                            className="absolute bottom-0 left-0 h-[2.5px] bg-gradient-to-r from-[#4ADE80] to-[#22C55E] transition-all duration-75 ease-linear shadow-[0_0_8px_rgba(74,222,128,0.8)]"
                            style={{ width: `${progress}%` }}
                          />
                        )}

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono tracking-wider font-bold ${
                              isActive ? "text-[#4ADE80]" : "text-white/40"
                            }`}
                          >
                            0{idx + 1}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold leading-tight tracking-tight">
                              {slide.tabLabel}
                            </span>
                            <span className="text-[9px] text-white/60 hidden md:inline-block leading-tight font-medium">
                              {slide.tabSub}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Editorial Slide Counter */}
                <div className="px-3.5 py-2.5 rounded-2xl bg-black/35 backdrop-blur-md border border-white/20 text-white/80 font-mono text-xs font-semibold">
                  <span className="text-[#4ADE80]">0{activeSlide + 1}</span>
                  <span className="text-white/40 mx-1">/</span>
                  <span className="text-white/60">0{slidesData.length}</span>
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  MOBILE STREAMLINED PROGRESS BARS & COUNTER
                  ───────────────────────────────────────────────────────────── */}
              <div className="flex sm:hidden items-center justify-between w-full pt-4 px-1">
                <div className="flex items-center gap-2">
                  {slidesData.map((slide, idx) => {
                    const isActive = activeSlide === idx;
                    return (
                      <button
                        key={`mob-indicator-${slide.id}`}
                        type="button"
                        onClick={() => goToSlide(idx)}
                        className="relative h-2 rounded-full overflow-hidden transition-all duration-300"
                        style={{ width: isActive ? "44px" : "18px" }}
                        title={slide.tabLabel}
                      >
                        <div className="absolute inset-0 bg-white/30 rounded-full" />
                        {isActive && (
                          <div
                            className="absolute inset-0 bg-gradient-to-r from-[#4ADE80] to-[#22C55E] rounded-full transition-all duration-75 ease-linear"
                            style={{ width: `${progress}%` }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <span className="text-[11px] font-mono text-white/90 font-semibold px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-xs border border-white/20">
                  0{activeSlide + 1} / 0{slidesData.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FLOATING BOTTOM TRUST BAR (Overlapping bottom edge) */}
      <div className="max-w-6xl mx-auto px-4 -mt-8 sm:-mt-10 pb-12 relative z-30">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-gray-300/60 border border-gray-100 p-5 sm:p-6 grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          {/* Item 1: Free shipping */}
          <div className="flex items-center gap-3.5 pt-2 sm:pt-0">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] text-[#145C34] flex items-center justify-center flex-shrink-0 shadow-xs">
              <Truck className="w-6 h-6 text-[#145C34]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                Free shipping
              </h4>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium">
                On all orders
              </p>
            </div>
          </div>

          {/* Item 2: Secure payment */}
          <div className="flex items-center gap-3.5 lg:pl-6 pt-2 sm:pt-0">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] text-[#145C34] flex items-center justify-center flex-shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6 text-[#145C34]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                Secure payment
              </h4>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium">
                100% safe & trusted
              </p>
            </div>
          </div>

          {/* Item 3: Natural & Ayurvedic */}
          <div className="flex items-center gap-3.5 lg:pl-6 pt-2 sm:pt-0">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] text-[#145C34] flex items-center justify-center flex-shrink-0 shadow-xs">
              <Leaf className="w-6 h-6 text-[#145C34] fill-[#145C34]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                Natural & Ayurvedic
              </h4>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium">
                Premium quality
              </p>
            </div>
          </div>

          {/* Item 4: 24/7 Support */}
          <div className="flex items-center gap-3.5 lg:pl-6 pt-2 sm:pt-0">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] text-[#145C34] flex items-center justify-center flex-shrink-0 shadow-xs">
              <Headphones className="w-6 h-6 text-[#145C34]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                24/7 Support
              </h4>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium">
                We're here to help
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. VIDEO MODAL (Watch Video Action) */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 bg-[#0D381E] text-white">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-[#4ADE80]" />
                <span className="font-display font-bold text-sm">
                  {currentSlide.titleLine1} {currentSlide.titleLine2} — Formulation Story
                </span>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video bg-black flex items-center justify-center relative">
              <video
                controls
                autoPlay
                className="w-full h-full object-contain"
                poster={currentSlide.poster}
              >
                <source src={currentSlide.video} type="video/mp4" />
              </video>
            </div>

            <div className="p-4 bg-emerald-50/60 border-t border-emerald-100 flex items-center justify-between">
              <span className="text-xs text-emerald-950 font-semibold">
                25+ Years of Botanical Science • {currentSlide.badgeText}
              </span>
              <Link
                to={currentSlide.productUrl}
                onClick={() => setIsVideoModalOpen(false)}
                className="text-xs font-bold bg-[#145C34] text-white px-4 py-2 rounded-xl hover:bg-[#0D381E]"
              >
                {currentSlide.ctaText}
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
