/**
 * Determines whether an order destination is inside Tamil Nadu (CGST + SGST)
 * or outside Tamil Nadu / Interstate (IGST).
 *
 * Evaluation Order (Priority Waterfall):
 * 1. GSTIN Check (If buyer provided GSTIN, state code 33 = Tamil Nadu)
 * 2. Explicit State Check (Trust explicit state first; e.g. "Andhra Pradesh", "Karnataka", "Kerala")
 * 3. PIN Code Check (India Post standard: 600000 - 643999 is TN, excluding 605xxx / 609xxx which are Puducherry UT)
 * 4. Fallback to sanitized city list ONLY if state and PIN are missing/unknown
 */
export function isTamilNaduOrder(orderData, TamilnaduCities = []) {
  if (!orderData) return false;

  const receiver = orderData?.receiver || orderData?.consignee || {};
  const consignee = orderData?.consignee || {};

  // 1. GSTIN Check (If B2B customer provided GSTIN)
  // Tamil Nadu GST state code is '33'
  const gstin = String(receiver?.gstin || consignee?.gstin || orderData?.userGST || "").trim();
  if (/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/i.test(gstin)) {
    return gstin.startsWith("33");
  }

  // 2. Explicit State Check (Trust explicit state first!)
  const stateRaw = String(receiver?.state || consignee?.state || "").toLowerCase().trim();
  if (stateRaw && stateRaw !== "unknown" && stateRaw !== "—" && stateRaw !== "-") {
    return (
      stateRaw.includes("tamil") ||
      stateRaw === "tn" ||
      stateRaw === "in_tn" ||
      stateRaw === "in-tn" ||
      stateRaw === "33"
    );
  }

  // 3. PIN Code Check (India Post standard)
  const pinRaw = String(receiver?.pincode || consignee?.pincode || "").replace(/\D/g, "");
  if (pinRaw.length === 6) {
    const pinNum = parseInt(pinRaw, 10);
    const prefix3 = parseInt(pinRaw.slice(0, 3), 10);

    // Puducherry UT (605xxx) and Karaikal (609xxx) are Union Territories under IGST (State Code 34)
    if (prefix3 === 605 || prefix3 === 609) {
      return false;
    }

    // Tamil Nadu PIN codes strictly range between 600000 and 643999
    if (pinNum >= 600000 && pinNum <= 643999) {
      return true;
    }

    // Any other valid 6-digit PIN code (e.g. 51xxxx for AP, 56xxxx for KA) is outside Tamil Nadu
    return false;
  }

  // 4. Last-Resort City Fallback (Only if State and PIN code are both missing/invalid)
  const cityStr = String(receiver?.city || consignee?.city || "").toLowerCase().trim();
  if (cityStr && Array.isArray(TamilnaduCities) && TamilnaduCities.includes(cityStr)) {
    return true;
  }

  return false;
}

