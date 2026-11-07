import { getAnonymousCart, setAnonymousCart } from "./localStorageUser";
import { getProductEffectivePrice, getProductMrp } from "./productDiscount";

export const FRANCH_OIL_SINGLE_SKU = "franch-oil-nh-plus";
export const FRANCH_OIL_PACK_SKU = "landing-franch-oil-nh-plus-pack-of-2";

/** Default fallback price when no dynamic discount is configured: Qty 1 → ₹220; qty 2+ → ₹200. */
export const FRANCH_OIL_PRICE_QTY1 = 220;
export const FRANCH_OIL_PRICE_QTY2_PLUS = 200;

/** Used when pack SKU is inactive / missing from the active products list. */
export const FRANCH_OIL_PACK_FALLBACK = {
  id: "ohVpHawuqQk38BENvo2o",
  sku: FRANCH_OIL_PACK_SKU,
  title:
    "Franch Oil NH* Plus | Multipurpose Healing Oil - Stretch Marks, Small Burns, Scars, Aches & Pains - 100 ML (Pack of 2)",
  subTitle: "Pack of 2 · Ayurvedic Multipurpose Healing Oil (100 ml each)",
  price: FRANCH_OIL_PRICE_QTY1,
  imageURL: "/images/product/landing/fnh-pack-of-2.png",
  images: ["/images/product/landing/fnh-pack-of-2.png"],
};

export function isFranchOilSku(sku) {
  const s = (sku || "").toLowerCase();
  return s === FRANCH_OIL_SINGLE_SKU || s === FRANCH_OIL_PACK_SKU;
}

/** Single + pack-of-2 PDPs share one review list in MySQL (stored under single SKU). */
export function getFranchOilReviewProductId(routeOrSku) {
  const s = (routeOrSku || "").toLowerCase();
  if (s === FRANCH_OIL_PACK_SKU || s === FRANCH_OIL_SINGLE_SKU) {
    return FRANCH_OIL_SINGLE_SKU;
  }
  return routeOrSku || "";
}

export function isFranchOilPackSku(sku) {
  return (sku || "").toLowerCase() === FRANCH_OIL_PACK_SKU;
}

/** Pack-of-2 is checkout-only (qty 2+ on single); hide from product grids/lists. */
export function shouldHideFromProductListings(product) {
  const sku = (product?.sku || "").toLowerCase();
  return sku === FRANCH_OIL_PACK_SKU;
}

export function normalizeFranchOilBottleQty(qty) {
  return Math.max(1, Math.floor(Number(qty) || 1));
}

export function normalizeFranchOilPackQty(qty) {
  return Math.max(1, Math.floor(Number(qty) || 1));
}

/**
 * Unit price for the given product and quantity.
 * Dynamically respects active product discount offers (e.g. ₹198) before falling back to ₹220/₹200.
 * Supports both signatures: getFranchOilUnitPrice(product, qty) and getFranchOilUnitPrice(qty).
 */
export function getFranchOilUnitPrice(productOrQty, maybeQty) {
  let product = null;
  let qty = 1;
  if (typeof productOrQty === "object" && productOrQty !== null) {
    product = productOrQty;
    qty = maybeQty ?? 1;
  } else {
    qty = productOrQty ?? 1;
  }
  const q = normalizeFranchOilBottleQty(qty);

  let basePrice = FRANCH_OIL_PRICE_QTY1;
  if (product) {
    const effective = getProductEffectivePrice(product);
    if (Number.isFinite(effective) && effective > 0) {
      basePrice = effective;
    }
  }

  // Tiered bulk pricing: for 2+ bottles, offer bulk rate (or active discount if lower)
  if (q >= 2) {
    return Math.min(FRANCH_OIL_PRICE_QTY2_PLUS, basePrice);
  }
  return basePrice;
}

export function getFranchOilLineTotal(qty, product = null) {
  const q = normalizeFranchOilBottleQty(qty);
  return getFranchOilUnitPrice(product, q) * q;
}

export function getFranchOilTargetSku(bottleQty) {
  return normalizeFranchOilBottleQty(bottleQty) >= 2
    ? FRANCH_OIL_PACK_SKU
    : FRANCH_OIL_SINGLE_SKU;
}

export function findFranchOilCartItem(cart) {
  return (cart || []).find((c) => isFranchOilSku(c.sku));
}

export function findProductBySku(products, sku) {
  const target = (sku || "").toLowerCase();
  return (products || []).find((p) => {
    const candidates = [p.sku, p.slug, p.id]
      .filter(Boolean)
      .map((v) => String(v).toLowerCase());
    return candidates.includes(target);
  });
}

export function upsertFranchOilAnonymousCart(line) {
  const existing = findFranchOilCartItem(getAnonymousCart());
  const currentCart = getAnonymousCart().filter((c) => !isFranchOilSku(c.sku));
  const newItem = {
    id: existing?.id || `cart_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    ...line,
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
  const updatedCart = [...currentCart, newItem];
  setAnonymousCart(updatedCart);
  return updatedCart;
}

function lineFromProduct(product, qty) {
  const unitPrice = getFranchOilUnitPrice(product, qty);
  const isPack = isFranchOilPackSku(product?.sku);
  const unitMrp = getProductMrp(product) || FRANCH_OIL_PRICE_QTY1; // 220
  const mrp = isPack ? (qty >= 2 ? unitMrp : 440) : unitMrp;
  return {
    productId: product.id,
    sku: product.sku,
    title: product.title,
    subTitle: product.subTitle || "",
    description: product.description || "",
    price: unitPrice,
    mrp: mrp,
    originalPrice: mrp,
    discountStrikePrice: mrp,
    imageURL: product.imageURL || "",
    qty,
  };
}

export function resolveFranchOilLine(products, bottleQty) {
  const qty = normalizeFranchOilBottleQty(bottleQty);
  const sku = getFranchOilTargetSku(qty);
  let product = findProductBySku(products, sku);

  if (!product && sku === FRANCH_OIL_PACK_SKU) {
    product = { ...FRANCH_OIL_PACK_FALLBACK };
  }

  if (!product) return null;

  return lineFromProduct(product, qty);
}

/**
 * Re-resolve cart/checkout line: qty 1 → single SKU @ ₹220; qty 2+ → pack SKU @ ₹200/unit.
 */
export function normalizeFranchOilCartLine(products, item) {
  if (!item || !isFranchOilSku(item.sku)) return item;
  const bottleQty = normalizeFranchOilBottleQty(item.qty);
  const line = resolveFranchOilLine(products, bottleQty);
  if (!line) return item;
  return {
    ...item,
    productId: line.productId,
    sku: line.sku,
    title: line.title,
    subTitle: line.subTitle || item.subTitle || "",
    price: line.price,
    mrp: line.mrp,
    originalPrice: line.originalPrice,
    discountStrikePrice: line.discountStrikePrice,
    imageURL: line.imageURL || item.imageURL || "",
    qty: line.qty,
  };
}

export function normalizeFranchOilCart(products, cart) {
  return (cart || []).map((item) => normalizeFranchOilCartLine(products, item));
}
