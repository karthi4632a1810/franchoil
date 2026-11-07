/** Checks whether special discount offer is active on a product. */
export function isProductDiscountActive(product) {
  const isEnabled = Boolean(
    product?.isDiscountEnabled ?? product?.is_discount_enabled
  );
  const discountPrice = Number(
    product?.discountPrice ?? product?.discount_price ?? 0
  );
  return isEnabled && Number.isFinite(discountPrice) && discountPrice > 0;
}

/** Effective active selling price (returns discount price when offer enabled, otherwise regular price). */
export function getProductEffectivePrice(product) {
  if (isProductDiscountActive(product)) {
    const discountPrice = Number(
      product?.discountPrice ?? product?.discount_price ?? 0
    );
    if (Number.isFinite(discountPrice) && discountPrice > 0) {
      return discountPrice;
    }
  }
  const regularPrice = Number(product?.price ?? product?.actual_price ?? 0);
  return Number.isFinite(regularPrice) && regularPrice > 0 ? regularPrice : 0;
}

/** MRP / strike-through price (supports special discount strike price and legacy delPrize). */
export function getProductMrp(product) {
  if (isProductDiscountActive(product)) {
    const strike = Number(
      product?.discountStrikePrice ?? product?.discount_strike_price ?? 0
    );
    if (Number.isFinite(strike) && strike > 0) return strike;
    const baseOrig = Number(
      product?.originalPrice ?? product?.delPrize ?? product?.rawPrice ?? product?.price ?? 0
    );
    if (Number.isFinite(baseOrig) && baseOrig > 0) return baseOrig;
  }

  const mrp = Number(
    product?.originalPrice ?? product?.delPrize ?? product?.discount_strike_price ?? 0
  );
  return Number.isFinite(mrp) && mrp > 0 ? mrp : 0;
}

/** Discount % for badge — uses stored value or derives from MRP vs effective sale price. */
export function getProductDiscountPercent(product) {
  const stored = Number(product?.discountPercent ?? product?.offer_percentage);
  if (Number.isFinite(stored) && stored > 0) return stored;

  const mrp = getProductMrp(product);
  const sale = getProductEffectivePrice(product);
  if (!mrp || !sale || mrp <= sale) return null;
  return Math.round((1 - sale / mrp) * 100);
}

/** Custom discount tagline / percentage string (e.g., "10%" or "10% OFF"). */
export function getProductDiscountTag(product) {
  const customTag = String(
    product?.discountTag ?? product?.discount_tag ?? ""
  ).trim();
  if (customTag) return customTag;

  const pct = getProductDiscountPercent(product);
  return pct != null && pct > 0 ? `${pct}%` : "";
}

/** Custom badge label for the white pill (default: "SPECIAL OFFER"). */
export function getProductDiscountBadgeLabel(product) {
  const label = String(
    product?.discountBadgeLabel ?? product?.discount_badge_label ?? "SPECIAL OFFER"
  ).trim();
  return label || "SPECIAL OFFER";
}

export function calcDiscountPercentFromPrices(originalPrice, salePrice) {
  const mrp = Number(originalPrice);
  const sale = Number(salePrice);
  if (!mrp || !sale || mrp <= sale) return 0;
  return Math.round((1 - sale / mrp) * 100);
}

/** When only discount % is set, derive MRP from sale price. */
export function calcMrpFromSaleAndPercent(salePrice, discountPercent) {
  const sale = Number(salePrice);
  const pct = Number(discountPercent);
  if (!sale || !pct || pct <= 0 || pct >= 100) return 0;
  return Math.ceil(sale / (1 - pct / 100));
}

/** Normalize pricing fields for admin save / API payload. */
export function resolveProductPricing({
  price,
  originalPrice,
  discountPercent,
  isDiscountEnabled,
  discountTag,
  discountPrice,
  discountStrikePrice,
}) {
  const sale = Number(price) || 0;
  let mrp = Number(originalPrice) || 0;
  let percent = Number(discountPercent) || 0;

  const enabled = Boolean(isDiscountEnabled);
  const tag = String(discountTag ?? "").trim();
  const dPrice = Number(discountPrice) || 0;
  const dStrike = Number(discountStrikePrice) || 0;

  if (mrp > sale) {
    percent = calcDiscountPercentFromPrices(mrp, sale);
  } else if (percent > 0 && sale > 0) {
    mrp = calcMrpFromSaleAndPercent(sale, percent);
  } else {
    percent = 0;
    mrp = 0;
  }

  return {
    price: sale,
    originalPrice: mrp,
    discountPercent: percent,
    isDiscountEnabled: enabled,
    discountTag: tag,
    discountPrice: dPrice,
    discountStrikePrice: dStrike,
  };
}
