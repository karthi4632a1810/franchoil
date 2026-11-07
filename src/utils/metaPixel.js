// =================== META CATALOG PRODUCT IDs ===================
// Confirmed IDs from Meta Commerce Catalog (ID: 1839288780030603)
export const META_CONTENT_IDS = {
  "franch-oil-nh-plus": "hj949dhw77",
  "landing-franch-oil-nh-plus-pack-of-2": "hj949dhw77", // same product, pack of 2
  "franch-orthovin-thailam": "7gljowkn08",
  "omega-3": "gaj2ifflhn",
  "franch-ayurveda-skin-soap": "qsarjijoa4",
};

// =================== HELPERS ===================

/**
 * Resolve SKU (including landing/variant SKUs) to Meta catalog content ID
 */
export const getMetaContentId = (sku) => {
  if (!sku) return null;
  // Direct match first (handles landing-* and pack-of-2 variants mapped above)
  if (META_CONTENT_IDS[sku]) return META_CONTENT_IDS[sku];
  // Clean landing- prefix fallback
  let cleanSku = sku;
  if (cleanSku.startsWith("landing-")) cleanSku = cleanSku.replace("landing-", "");
  if (cleanSku.endsWith("-pack-of-2")) cleanSku = cleanSku.replace("-pack-of-2", "");
  return META_CONTENT_IDS[cleanSku] || cleanSku;
};

/**
 * Generate a unique event ID for Pixel+CAPI deduplication
 */
export const generateEventId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// =================== ADVANCED MATCHING ===================

/**
 * Re-initialize pixel with user PII for Advanced Matching.
 * Call this as soon as user email/phone/name is known (after login or profile load).
 * @param {{ email?: string, phone?: string, name?: string }} userData
 */
export const initPixelWithUser = (userData = {}) => {
  if (!window.fbq) return;

  const params = {};

  if (userData.email && userData.email.trim()) {
    params.em = userData.email.trim().toLowerCase();
  }

  if (userData.phone && userData.phone.trim()) {
    // Normalize: remove non-digits, strip country code 91 if 12 digits
    let phone = userData.phone.replace(/\D/g, "");
    if (phone.startsWith("91") && phone.length === 12) phone = phone.slice(2);
    if (phone.length >= 10) params.ph = phone;
  }

  if (userData.name && userData.name.trim()) {
    const parts = userData.name.trim().toLowerCase().split(/\s+/);
    params.fn = parts[0] || "";
    if (parts.length > 1) params.ln = parts.slice(1).join(" ");
  }

  if (Object.keys(params).length > 0) {
    window.fbq("init", "829463349947822", params);
    console.log("[Meta Pixel] Advanced matching updated:", Object.keys(params));
  }
};

// =================== DEDUP GUARDS ===================
// Module-level guards prevent duplicate events within a page session
let _lastViewedSku = null;
let _purchaseFiredOrderId = null;

// =================== PAGE VIEW ===================

/**
 * Fires standard PageView (called on every route change in App.jsx)
 */
export const trackPageView = () => {
  if (window.fbq) {
    window.fbq("track", "PageView");
  }
};

// =================== VIEW CONTENT ===================

/**
 * Fires ViewContent once per unique SKU per page load.
 * Includes value, currency, content_ids.
 * @param {string} sku
 * @param {number} price
 * @returns {string|null} eventId (for CAPI pairing)
 */
export const trackViewContent = (sku, price) => {
  if (!window.fbq || !sku) return null;

  // Dedup: don't re-fire for the same SKU
  if (_lastViewedSku === sku) return null;
  _lastViewedSku = sku;

  const contentId = getMetaContentId(sku);
  const eventId = generateEventId();

  window.fbq(
    "track",
    "ViewContent",
    {
      content_ids: [contentId],
      content_type: "product",
      value: Number(price) || 0,
      currency: "INR",
    },
    { eventID: eventId }
  );

  console.log("[Meta Pixel] ViewContent fired:", { sku, contentId, price, eventId });
  return eventId;
};

// =================== ADD TO CART ===================

/**
 * Fires AddToCart with value, currency, content_ids.
 * @param {string} sku
 * @param {number} price
 * @param {number} qty
 * @returns {string} eventId (for CAPI pairing)
 */
export const trackAddToCart = (sku, price, qty = 1) => {
  if (!window.fbq || !sku) return null;

  const contentId = getMetaContentId(sku);
  const eventId = generateEventId();
  const value = Number(price) * Number(qty) || Number(price) || 0;

  window.fbq(
    "track",
    "AddToCart",
    {
      content_ids: [contentId],
      content_type: "product",
      value,
      currency: "INR",
    },
    { eventID: eventId }
  );

  console.log("[Meta Pixel] AddToCart fired:", { sku, contentId, price, qty, value, eventId });
  return eventId;
};

// =================== INITIATE CHECKOUT ===================

/**
 * Fires InitiateCheckout with aggregated cart value, currency, content_ids.
 * @param {Array<{ sku: string, price: number, qty: number }>} cartItems
 * @returns {string} eventId (for CAPI pairing)
 */
export const trackInitiateCheckout = (cartItems) => {
  if (!window.fbq || !cartItems || cartItems.length === 0) return null;

  const contentIds = cartItems
    .map((item) => getMetaContentId(item.sku))
    .filter(Boolean);

  const totalValue = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1),
    0
  );

  const eventId = generateEventId();

  window.fbq(
    "track",
    "InitiateCheckout",
    {
      content_ids: contentIds,
      content_type: "product",
      value: Number(totalValue),
      currency: "INR",
      num_items: cartItems.length,
    },
    { eventID: eventId }
  );

  console.log("[Meta Pixel] InitiateCheckout fired:", {
    contentIds,
    totalValue,
    numItems: cartItems.length,
    eventId,
  });
  return eventId;
};

// =================== PURCHASE ===================

/**
 * Fires Purchase exactly once per order ID (deduplication via module-level guard).
 * Includes value, currency, content_ids, eventId for CAPI dedup.
 * @param {Array<{ sku: string, price: number, qty: number }>} cartItems
 * @param {number} totalValue
 * @param {string} orderId - Razorpay order ID or Firestore order ID
 * @param {string} [eventId] - Optional: pass a pre-generated ID for CAPI pairing
 * @returns {string|null} eventId that was used (for CAPI pairing)
 */
export const trackPurchase = (cartItems, totalValue, orderId, eventId) => {
  console.log(`[Meta Pixel] Attempting Purchase for Order: ${orderId}`, {
    items: cartItems,
    total: totalValue,
  });

  if (!window.fbq) {
    console.warn("[Meta Pixel] fbq not found. Purchase event skipped.");
    return null;
  }

  if (!orderId) {
    console.error("[Meta Pixel] Missing orderId. Purchase event skipped.");
    return null;
  }

  if (orderId === _purchaseFiredOrderId) {
    console.log(
      `[Meta Pixel] Purchase already fired for Order: ${orderId}. Skipping (dedup).`
    );
    return null;
  }

  const contentIds = (cartItems || [])
    .map((item) => getMetaContentId(item.sku))
    .filter(Boolean);

  const finalEventId = eventId || generateEventId();

  window.fbq(
    "track",
    "Purchase",
    {
      content_ids: contentIds,
      content_type: "product",
      value: Number(totalValue),
      currency: "INR",
      num_items: cartItems?.length || 1,
    },
    { eventID: finalEventId }
  );

  _purchaseFiredOrderId = orderId;

  console.log(`[Meta Pixel] ✅ Purchase fired for Order: ${orderId}`, {
    content_ids: contentIds,
    value: totalValue,
    num_items: cartItems?.length,
    eventId: finalEventId,
  });

  return finalEventId;
};
