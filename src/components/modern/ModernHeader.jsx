import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Heart,
  ShoppingCart,
  Headphones,
  Leaf,
  Gift,
  ChevronDown,
  Instagram,
  Youtube,
  Menu,
  X,
  Phone
} from "lucide-react";
import { PRODUCTS_CATALOG } from "../../data/franchCatalog";

export default function ModernHeader({
  cartItems = [],
  wishlist = [],
  onOpenCart,
  onOpenWishlist,
  onQuickView
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Home");
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1440
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > 1200) {
        setIsMobileMenuOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Exactly 5 real products (4 products + Franch Oil Pack of 2)
  const franchOilPackOf2 = {
    id: "franch-oil-nh-plus-pack-of-2",
    name: "Franch Oil NH* Plus (Pack of 2)",
    title: "Franch Oil NH* Plus (Pack of 2 - 100ml each)",
    shortTagline: "Multipurpose Ayurvedic Healing Oil - Value Pack of 2",
    category: "Pain Relief",
    mainImage: "/images/product/landing/fnh-plus-pack-of-2.jpg",
    variants: [
      { size: "Pack of 2 (100ml)", price: 380, mrp: 500, discount: "24% OFF" }
    ],
    defaultVariantIndex: 0
  };

  const REAL_PRODUCT_IDS = [
    "franch-oil-nh-plus",
    "franch-orthovin-thailam",
    "omega-3",
    "franch-ayurveda-skin-soap"
  ];
  const baseShopProducts = PRODUCTS_CATALOG.filter((p) =>
    REAL_PRODUCT_IDS.includes(p.id)
  );
  const shopProducts = [
    baseShopProducts[0],
    franchOilPackOf2,
    ...baseShopProducts.slice(1)
  ].filter(Boolean);

  const searchInputRef = useRef(null);
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Search filter
  const searchResults = searchQuery.trim()
    ? PRODUCTS_CATALOG.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.highlight.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSearchResultClick = (product) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    if (onQuickView) onQuickView(product);
  };

  return (
    <header className="w-full relative z-40 bg-white border-b border-gray-100 shadow-2xs">
      {/* 1. TOP ANNOUNCEMENT BAR (Ayurvedic Forest Green) */}
      <div className="bg-[#0B351C] text-white text-xs font-medium py-2 px-4 sm:px-6 border-b border-emerald-900/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Herbal & Heritage Badges */}
          <div className="flex items-center gap-2 text-emerald-100 text-[11px] sm:text-xs font-medium tracking-wide">
            <Leaf className="w-3.5 h-3.5 text-[#4ADE80] fill-[#4ADE80] flex-shrink-0" />
            <span className="whitespace-nowrap">100% Ayurvedic Formula</span>
            <span className="text-emerald-400/40 hidden sm:inline">•</span>
            <span className="hidden sm:inline whitespace-nowrap">GMP & AYUSH Certified</span>
            <span className="text-emerald-400/40 hidden md:inline">•</span>
            <span className="hidden md:inline whitespace-nowrap">Trusted For 25+ Years</span>
          </div>

          {/* Center: Complimentary Gift Announcement */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#F2C230] font-medium">
            <Gift className="w-3.5 h-3.5 text-[#F2C230] flex-shrink-0" />
            <span className="text-emerald-50">Complimentary Ayurvedic Gift on Orders</span>
          </div>

          {/* Right: Phone Helpline & Social */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs">
            <a
              href="tel:9841854321"
              className="text-emerald-100 hover:text-white flex items-center gap-1.5 transition-colors font-medium"
              title="Call Doctor Helpline"
            >
              <Phone className="w-3 h-3 text-[#4ADE80] flex-shrink-0" />
              <span className="hidden sm:inline text-emerald-300">Helpline:</span>
              <span className="font-bold text-white tracking-wide">98418 54321</span>
            </a>

            <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-emerald-800/60">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-5 h-5 rounded-full bg-white/10 hover:bg-white text-emerald-100 hover:text-[#0B351C] flex items-center justify-center text-[10px] font-bold transition-all"
                title="Facebook"
              >
                f
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-5 h-5 rounded-full bg-white/10 hover:bg-white text-emerald-100 hover:text-[#0B351C] flex items-center justify-center p-1 transition-all"
                title="Instagram"
              >
                <Instagram className="w-3 h-3" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-5 h-5 rounded-full bg-white/10 hover:bg-white text-emerald-100 hover:text-[#0B351C] flex items-center justify-center p-1 transition-all"
                title="YouTube"
              >
                <Youtube className="w-3 h-3" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-5 h-5 rounded-full bg-white/10 hover:bg-white text-emerald-100 hover:text-[#0B351C] flex items-center justify-center text-[10px] font-bold transition-all"
                title="Twitter / X"
              >
                𝕏
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN BRAND & UTILITIES BAR (Classic Balanced Layout) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4 lg:gap-8">
          {/* LEFT: Brand Logo & Heritage Tagline */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <a href="/" className="flex items-center gap-2 group">
              <img
                src="/images/logo.webp"
                alt="FM Group of Companies"
                className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <img
                src="/images/icon.webp"
                alt="A FM Product"
                className="h-8 sm:h-9 w-auto object-contain"
              />
            </a>

            <div className="hidden xl:flex flex-col pl-3 border-l border-gray-200 text-left">
              <span className="text-[10px] font-extrabold text-[#145C34] tracking-widest uppercase">
                Ayurvedic Botanical
              </span>
              <span className="text-[9px] text-gray-500 font-medium">
                Est. 1998 • Chennai
              </span>
            </div>
          </div>

          {/* CENTER: Classic Luxury Search Input Pill (Desktop & Tablet) */}
          <div className="hidden md:flex flex-1 max-w-md mx-auto">
            <div
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center gap-3 bg-gray-50 hover:bg-white border border-gray-200/90 hover:border-[#145C34]/40 focus-within:border-[#145C34] rounded-full px-4 py-2 transition-all shadow-2xs cursor-pointer group"
            >
              <Search className="w-4 h-4 text-[#145C34] flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors flex-1 truncate">
                Search Franch Oil, Soaps, Orthovin, Omega-3...
              </span>
              <span className="text-[10px] uppercase font-bold text-[#145C34] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full shadow-2xs">
                Search
              </span>
            </div>
          </div>

          {/* RIGHT: Actions, 25-Years Seal, and Mobile Triggers */}
          <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
            {/* Mobile Search Icon Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden w-9 h-9 rounded-full bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-[#145C34] flex items-center justify-center border border-gray-200 transition-colors"
              title="Search products"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Helpline (Desktop) */}
            <div className="hidden xl:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#145C34] flex items-center justify-center flex-shrink-0">
                <Headphones className="w-4 h-4 text-[#145C34]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                  Expert Care
                </span>
                <a
                  href="tel:9841854321"
                  className="text-xs font-bold text-gray-900 hover:text-[#145C34] tracking-tight transition-colors"
                >
                  98418 54321
                </a>
              </div>
            </div>

            {/* Wishlist */}
            <button
              onClick={onOpenWishlist}
              className="flex items-center gap-1.5 text-gray-700 hover:text-[#145C34] transition-colors p-1"
              title="Wishlist"
            >
              <div className="relative">
                <Heart className="w-5 h-5 text-gray-700 hover:text-[#145C34]" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#F2C230] text-gray-900 text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-xs font-semibold">
                Wishlist
              </span>
            </button>

            {/* Cart with Counter Badge */}
            <button
              onClick={onOpenCart}
              className="flex items-center gap-1.5 text-gray-700 hover:text-[#145C34] transition-colors p-1"
              title="Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-gray-700 hover:text-[#145C34]" />
                <span className="absolute -top-2 -right-2 bg-[#145C34] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {totalCartCount}
                </span>
              </div>
              <span className="hidden sm:inline text-xs font-semibold">
                Cart
              </span>
            </button>

            {/* 25 YEARS Authentic Heritage Seal (Seamlessly integrated into header flow) */}
            <div className="hidden lg:flex items-center pl-3 border-l border-gray-200">
              <img
                src="/images/25_years.webp"
                alt="25 Years of Natural Care"
                className="h-10 w-auto object-contain transition-transform hover:scale-105 drop-shadow-xs"
              />
            </div>

            {/* Mobile Hamburger Drawer Trigger (Shown on <= 1200px) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="min-[1201px]:hidden p-2 rounded-xl text-gray-700 hover:text-[#145C34] hover:bg-gray-100 transition-colors"
              title="Open Navigation Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. CLASSIC NAVIGATION BAR (Refined Luxury Nav) - Visible ONLY > 1200px */}
      {windowWidth > 1200 && (
        <nav className="hidden min-[1201px]:flex items-center justify-center gap-7 xl:gap-9 py-2.5 bg-[#FAFBF9]/80 border-t border-b border-gray-100/90 text-xs font-bold tracking-[0.06em] uppercase text-gray-700">
        <a
          href="/"
          onClick={() => setActiveNav("Home")}
          className={`transition-all pb-1 relative hover:text-[#145C34] ${
            activeNav === "Home"
              ? "text-[#145C34] border-b-2 border-[#145C34]"
              : "text-gray-700"
          }`}
        >
          Home
        </a>

        {/* Shop All Formulations Dropdown */}
        <div
          className="relative"
          onMouseEnter={() => setIsMegaMenuOpen(true)}
          onMouseLeave={() => setIsMegaMenuOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
            className={`flex items-center gap-1 transition-all pb-1 font-bold hover:text-[#145C34] ${
              activeNav === "Shop"
                ? "text-[#145C34] border-b-2 border-[#145C34]"
                : "text-gray-700"
            }`}
          >
            <span>Shop Formulations</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {isMegaMenuOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 w-80 z-50 animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 space-y-1.5 divide-y divide-gray-50">
                <div className="px-2 pt-1 pb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#145C34] flex items-center justify-between">
                  <span>Authentic Formulations (5)</span>
                  <span className="text-gray-400 font-normal">Direct From Brand</span>
                </div>
                {shopProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setIsMegaMenuOpen(false);
                      if (onQuickView) onQuickView(p);
                    }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-50/80 cursor-pointer transition-colors group"
                  >
                    <img
                      src={p.mainImage}
                      alt={p.name}
                      className="w-9 h-9 object-contain rounded-lg bg-gray-50 p-1 border border-gray-100 group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-bold text-gray-900 group-hover:text-[#145C34] truncate transition-colors">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {p.category} • ₹{p.variants[p.defaultVariantIndex].price}
                      </p>
                    </div>
                    <span className="text-[10px] font-extrabold text-[#145C34] bg-white px-2 py-0.5 rounded border border-emerald-100">
                      View
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <a
          href="#flagship-showcase"
          onClick={() => setActiveNav("Franch Oil")}
          className={`transition-all pb-1 relative hover:text-[#145C34] ${
            activeNav === "Franch Oil"
              ? "text-[#145C34] border-b-2 border-[#145C34]"
              : "text-gray-700"
          }`}
        >
          Franch Oil NH* Plus
        </a>

        <a
          href="#flagship-showcase"
          onClick={() => setActiveNav("Orthovin")}
          className={`transition-all pb-1 relative hover:text-[#145C34] ${
            activeNav === "Orthovin"
              ? "text-[#145C34] border-b-2 border-[#145C34]"
              : "text-gray-700"
          }`}
        >
          Orthovin Thailam
        </a>

        <a
          href="#flagship-showcase"
          onClick={() => setActiveNav("Omega-3")}
          className={`transition-all pb-1 relative hover:text-[#145C34] ${
            activeNav === "Omega-3"
              ? "text-[#145C34] border-b-2 border-[#145C34]"
              : "text-gray-700"
          }`}
        >
          OG-3 Veg
        </a>

        <a
          href="#flagship-showcase"
          onClick={() => setActiveNav("Soap")}
          className={`transition-all pb-1 relative hover:text-[#145C34] ${
            activeNav === "Soap"
              ? "text-[#145C34] border-b-2 border-[#145C34]"
              : "text-gray-700"
          }`}
        >
          Ayurvedic Soap
        </a>

        <a
          href="#brand-story"
          onClick={() => setActiveNav("About Us")}
          className={`transition-all pb-1 relative hover:text-[#145C34] ${
            activeNav === "About Us"
              ? "text-[#145C34] border-b-2 border-[#145C34]"
              : "text-gray-700"
          }`}
        >
          Our 25-Year Story
        </a>

        <a
          href="#faqs"
          onClick={() => setActiveNav("Contact Us")}
          className={`transition-all pb-1 relative hover:text-[#145C34] ${
            activeNav === "Contact Us"
              ? "text-[#145C34] border-b-2 border-[#145C34]"
              : "text-gray-700"
          }`}
        >
          Contact & Helpline
        </a>
      </nav>
      )}

      {/* 4. MOBILE & TABLET DRAWER NAVIGATION (Available on <= 1200px) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 min-[1201px]:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl p-6 flex flex-col z-50 animate-in slide-in-from-right duration-300">
            {/* Drawer Top Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <img
                  src="/images/logo.webp"
                  alt="FM Group"
                  className="h-8 w-auto object-contain"
                />
                <img
                  src="/images/icon.webp"
                  alt="A FM Product"
                  className="h-7 w-auto object-contain"
                />
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Search inside Drawer */}
            <div className="pt-4">
              <div
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSearchOpen(true);
                }}
                className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 cursor-pointer text-gray-400 text-xs"
              >
                <Search className="w-4 h-4 text-[#145C34]" />
                <span>Search products...</span>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto py-5 space-y-1 text-sm font-semibold">
              <a
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl font-bold text-[#145C34] bg-emerald-50/70"
              >
                Home
              </a>
              <a
                href="#flagship-showcase"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-gray-700 hover:text-[#145C34] hover:bg-gray-50 transition-colors"
              >
                Franch Oil NH* Plus (Multipurpose)
              </a>
              <a
                href="#products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-gray-700 hover:text-[#145C34] hover:bg-gray-50 transition-colors"
              >
                Franch Oil NH* Plus (Pack of 2)
              </a>
              <a
                href="#flagship-showcase"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-gray-700 hover:text-[#145C34] hover:bg-gray-50 transition-colors"
              >
                Orthovin Thailam (Joint Relief)
              </a>
              <a
                href="#flagship-showcase"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-gray-700 hover:text-[#145C34] hover:bg-gray-50 transition-colors"
              >
                Franch OG-3 Veg (Omega-3)
              </a>
              <a
                href="#flagship-showcase"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-gray-700 hover:text-[#145C34] hover:bg-gray-50 transition-colors"
              >
                Franch Ayurveda Herbal Soap
              </a>
              <a
                href="#brand-story"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-gray-700 hover:text-[#145C34] hover:bg-gray-50 transition-colors"
              >
                About Our 25-Year Heritage
              </a>
              <a
                href="#faqs"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-gray-700 hover:text-[#145C34] hover:bg-gray-50 transition-colors"
              >
                FAQ & Clinical Inquiries
              </a>
            </div>

            {/* 25-Year Badge + Helpline in Drawer Footer */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-center p-2 bg-[#FAFBF9] rounded-xl border border-gray-100">
                <img
                  src="/images/25_years.webp"
                  alt="25 Years of Natural Care"
                  className="h-9 w-auto object-contain"
                />
              </div>

              <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider">
                    Doctor & Customer Helpline
                  </p>
                  <a
                    href="tel:9841854321"
                    className="text-xs font-bold text-[#145C34]"
                  >
                    +91 98418 54321
                  </a>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#145C34] text-white flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. FULLSCREEN SEARCH OVERLAY */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 sm:pt-24 px-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 p-5 sm:p-6 animate-in slide-in-from-top-3 duration-200">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <Search className="w-5 h-5 text-[#145C34] flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Franch Oil, Soaps, Orthovin, Omega-3..."
                className="w-full text-sm sm:text-base text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Close Search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 mt-2">
              {searchQuery.trim() === "" ? (
                <div className="py-6 text-center space-y-3">
                  <p className="text-xs text-gray-400">
                    Popular authentic formulations:
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {shopProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSearchResultClick(p)}
                        className="text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-emerald-50 hover:text-[#145C34] border border-gray-200 rounded-full px-3 py-1 transition-colors"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500">
                  No formulations found matching "{searchQuery}".
                </div>
              ) : (
                searchResults.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleSearchResultClick(prod)}
                    className="flex items-center gap-3 p-3 hover:bg-emerald-50/70 rounded-xl cursor-pointer transition-colors"
                  >
                    <img
                      src={prod.mainImage}
                      alt={prod.name}
                      className="w-12 h-12 object-contain rounded-lg bg-gray-50 p-1 border border-gray-100"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {prod.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {prod.shortTagline || prod.category}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#145C34]">
                      ₹{prod.variants[prod.defaultVariantIndex].price}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Click outside to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery("");
            }}
          />
        </div>
      )}
    </header>
  );
}
