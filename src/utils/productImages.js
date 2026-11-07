// ============================================================================
// PRODUCT COVER IMAGES UTILITY
// Provides real, high-quality cover images and fallbacks for all Franch products
// ============================================================================

export const PRODUCT_COVER_IMAGES = {
    "franch-oil-nh-plus": "/images/hero-section/oil.webp",
    "landing-franch-oil-nh-plus-pack-of-2": "/images/product/landing/fnh-plus-pack-of-2.jpg",
    "franch-orthovin-thailam": "/images/hero-section/thailam-product.webp",
    "franch-ayurveda-skin-soap": "/images/hero-section/soap-1.webp",
    "omega-3": "/images/hero-section/tablet.webp",
};

export const PRODUCT_FALLBACK_IMAGES = {
    "franch-oil-nh-plus": "/images/product/franch-oil-nh-plus/1.webp",
    "landing-franch-oil-nh-plus-pack-of-2": "/images/product/landing/fnh-pack-of-2.png",
    "franch-orthovin-thailam": "/images/product/franch-orthovin-thailam/1.webp",
    "franch-ayurveda-skin-soap": "/images/product/franch-ayurveda-skin-soap/1.webp",
    "omega-3": "/images/product/omega-3/1.webp",
};

/**
 * Returns the authentic cover image URL for a given product or cart item
 */
export function getProductCoverImage(item = {}) {
    if (!item) return PRODUCT_COVER_IMAGES["franch-oil-nh-plus"];

    const sku = String(item.sku || item.code || item.id || item.productId || "").toLowerCase().trim();
    const name = String(item.name || item.title || item.productName || "").toLowerCase().trim();
    const raw = String(item.imageURL || item.image || item.thumbnail || "").trim();

    // 1. Direct SKU match
    if (sku && PRODUCT_COVER_IMAGES[sku]) {
        return PRODUCT_COVER_IMAGES[sku];
    }

    // 2. Intelligent keyword match on title / product name
    if (name.includes("soap") || sku.includes("soap")) {
        return PRODUCT_COVER_IMAGES["franch-ayurveda-skin-soap"];
    }
    if (name.includes("pack of 2") || name.includes("pack-of-2") || sku.includes("pack-of-2")) {
        return PRODUCT_COVER_IMAGES["landing-franch-oil-nh-plus-pack-of-2"];
    }
    if (name.includes("orthovin") || name.includes("thailam") || sku.includes("orthovin") || sku.includes("thailam")) {
        return PRODUCT_COVER_IMAGES["franch-orthovin-thailam"];
    }
    if (name.includes("omega") || name.includes("og-3") || name.includes("og 3") || sku.includes("omega")) {
        return PRODUCT_COVER_IMAGES["omega-3"];
    }
    if (name.includes("franch oil") || name.includes("nh plus") || name.includes("nh*") || sku.includes("franch-oil")) {
        return PRODUCT_COVER_IMAGES["franch-oil-nh-plus"];
    }

    // 3. If raw URL is valid and not a broken legacy path
    if (raw && !raw.includes("/product-images/product-images/") && (raw.startsWith("/images/") || raw.startsWith("http"))) {
        return raw;
    }

    // 4. Default fallback to Franch Oil
    return PRODUCT_COVER_IMAGES["franch-oil-nh-plus"];
}
