import React, { useState, useEffect } from "react";
import ModernHeader from "../components/modern/ModernHeader";
import ModernHeroCarousel from "../components/modern/ModernHeroCarousel";
import ModernShowcaseSection from "../components/modern/ModernShowcaseSection";
import ModernProductGrid from "../components/modern/ModernProductGrid";
import ModernCategoryBanners from "../components/modern/ModernCategoryBanners";
import ModernBrandStory from "../components/modern/ModernBrandStory";
import ModernTestimonialCarousel from "../components/modern/ModernTestimonialCarousel";
import ModernSecondaryCta from "../components/modern/ModernSecondaryCta";
import ModernFaqSection from "../components/modern/ModernFaqSection";
import ModernFooter from "../components/modern/ModernFooter";
import ModernCartDrawer from "../components/modern/ModernCartDrawer";
import ModernQuickViewModal from "../components/modern/ModernQuickViewModal";
import { PRODUCTS_CATALOG } from "../data/franchCatalog";
import { MessageCircle, Check, Sparkles } from "lucide-react";

export default function ModernFranchHome() {
  // 1. Cart state (Preloaded with 1 Franch Oil NH* Plus 100ml as demonstration)
  const [cartItems, setCartItems] = useState([
    {
      id: "franch-oil-nh-plus",
      name: "Franch Oil NH* Plus",
      price: 210,
      mainImage: "/images/hero-section/oil.webp",
      selectedSize: "100ml",
      quantity: 1
    }
  ]);

  // 2. Wishlist state
  const [wishlist, setWishlist] = useState(["franch-oil-nh-plus", "omega-3"]);

  // 3. UI Drawer & Modal states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Toast trigger
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Add to cart handler
  const handleAddToCart = (product, variant, quantity = 1) => {
    const chosenVariant = variant || product.variants[product.defaultVariantIndex];
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.id === product.id && item.selectedSize === chosenVariant.size
      );

      if (existingIndex > -1) {
        const newItems = [...prevItems];
        newItems[existingIndex].quantity += quantity;
        return newItems;
      } else {
        return [
          ...prevItems,
          {
            id: product.id,
            name: product.name,
            price: chosenVariant.price,
            mainImage: product.mainImage,
            selectedSize: chosenVariant.size,
            quantity: quantity
          }
        ];
      }
    });

    showToast(`Added ${product.name} (${chosenVariant.size}) to your bag!`);
    setIsCartOpen(true);
  };

  // Update cart item quantity
  const handleUpdateQuantity = (productId, selectedSize, newQty) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId && item.selectedSize === selectedSize
          ? { ...item, quantity: newQty }
          : item
      )
    );
  };

  // Remove cart item
  const handleRemoveCartItem = (productId, selectedSize) => {
    setCartItems((prev) =>
      prev.filter(
        (item) => !(item.id === productId && item.selectedSize === selectedSize)
      )
    );
    showToast("Item removed from bag.");
  };

  // Toggle wishlist
  const handleToggleWishlist = (productId) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        showToast("Removed from wishlist.");
        return prev.filter((id) => id !== productId);
      } else {
        showToast("Added to your wishlist!");
        return [...prev, productId];
      }
    });
  };

  // Open quick view modal
  const handleOpenQuickView = (product) => {
    setQuickViewProduct(product);
  };

  // Smooth scroll helper
  const scrollToProducts = () => {
    const el = document.getElementById("products");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white text-[#121814] font-body selection:bg-[#145C34] selection:text-white">
      {/* 1. Modern Sticky Header with Mega-Menu, Search, Cart Preview */}
      <ModernHeader
        cartItems={cartItems}
        wishlist={wishlist}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => {
          showToast(`You have ${wishlist.length} saved formulations in your wishlist.`);
          scrollToProducts();
        }}
        onQuickView={handleOpenQuickView}
      />

      <main>
        {/* 2. Hero Section matching user design with floating trust bar */}
        <ModernHeroCarousel
          onAddToCart={handleAddToCart}
          onQuickView={handleOpenQuickView}
        />

        {/* 3. The 25-Year Heritage & 4 Flagship 3D Formulations Showcase */}
        <ModernShowcaseSection
          onAddToCart={handleAddToCart}
          onQuickView={handleOpenQuickView}
        />

        {/* 4. Complete Card-Based Product Grid with Soft Shadows, Variant Selectors, and Ratings */}
        <ModernProductGrid
          onAddToCart={handleAddToCart}
          onQuickView={handleOpenQuickView}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
        />

        {/* 5. Editorial Category Promo Banners (Pain Mobility, Vegan Omega-3, Skin Care) */}
        <ModernCategoryBanners
          onQuickView={handleOpenQuickView}
          onAddToCart={handleAddToCart}
        />

        {/* 6. Brand Story Section (FM Group 25-Year Legacy, Cold-Pressed Bioactive Science) */}
        <ModernBrandStory />

        {/* 7. Interactive Testimonial Carousel with Star Ratings & Verified Avatars */}
        <ModernTestimonialCarousel />

        {/* 8. Secondary CTA Section with First-Order Privilege & Coupon Code */}
        <ModernSecondaryCta onShopNow={scrollToProducts} />

        {/* 9. Frequently Asked Questions Section */}
        <ModernFaqSection />
      </main>

      {/* 10. Multi-Column Footer with Newsletter Signup & Trust Certifications */}
      <ModernFooter onQuickView={handleOpenQuickView} />

      {/* 11. Interactive Slide-Out Cart Drawer */}
      <ModernCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={() => {
          setTimeout(() => setCartItems([]), 1800);
        }}
      />

      {/* 12. Interactive Quick View Modal */}
      <ModernQuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        wishlist={wishlist}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* 13. Floating WhatsApp Consultation Widget */}
      <aside aria-label="Ayurvedic Health Support" className="fixed bottom-6 right-6 z-40">
        <a
          href="https://wa.me/919841854321?text=Hello%20Franch%20Ayurveda,%20I%20would%20like%20guidance%20on%20choosing%20the%20right%20product%20for%20my%20joint%20pain%20or%20wellness."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white px-4 py-3 rounded-full shadow-2xl shadow-emerald-900/30 hover:scale-105 active:scale-95 transition-all group"
          title="Chat with Ayurvedic Specialist"
        >
          <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
          <span className="text-xs font-extrabold tracking-wide hidden sm:inline">
            Ayurvedic Advice
          </span>
        </a>
      </aside>

      {/* 14. Floating Toast Notification */}
      {toastMessage && (
        <aside
          aria-label="Notification"
          className="fixed bottom-6 left-6 z-50 bg-[#0E4325] text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-600/50 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="w-5 h-5 rounded-full bg-[#F2C230] text-gray-950 flex items-center justify-center flex-shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>{toastMessage}</span>
        </aside>
      )}
    </div>
  );
}
