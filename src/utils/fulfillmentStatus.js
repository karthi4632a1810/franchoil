export const FULFILLMENT_STEPS = [
  { key: "placed", label: "Order placed" },
  { key: "shipped", label: "Order shipped" },
  { key: "in_transit", label: "In transit" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Order delivered" },
];

/** All valid fulfillment status keys (linear steps + terminal states). */
const ALL_VALID_STATUSES = [...FULFILLMENT_STEPS.map((s) => s.key), "cancelled"];

export function normalizeFulfillmentStatus(status) {
  const s = String(status || "placed").toLowerCase();
  return ALL_VALID_STATUSES.includes(s) ? s : "placed";
}

export function fulfillmentLabel(status) {
  const key = normalizeFulfillmentStatus(status);
  if (key === "cancelled") return "Cancelled";
  return FULFILLMENT_STEPS.find((s) => s.key === key)?.label || "Order placed";
}

export function fulfillmentStepIndex(status) {
  const key = normalizeFulfillmentStatus(status);
  return FULFILLMENT_STEPS.findIndex((s) => s.key === key);
}

/** Customer-facing AWB / courier link — only while parcel is on the way. */
export function showCourierTracking(status) {
  const key = normalizeFulfillmentStatus(status);
  return key === "shipped" || key === "in_transit" || key === "out_for_delivery";
}

const STATUS_MESSAGES = {
  placed: "Your order is confirmed. We will ship it soon.",
  shipped: "Your order has been shipped.",
  in_transit: "Your package is on the way to you.",
  out_for_delivery: "Your package is out for delivery today.",
  delivered: "Your order has been delivered. Thank you for shopping with us.",
};

export function fulfillmentStatusMessage(status) {
  const key = normalizeFulfillmentStatus(status);
  return STATUS_MESSAGES[key] || STATUS_MESSAGES.placed;
}

/**
 * Map a Delhivery tracking status string to internal fulfillment step.
 * @param {string} delhiveryStatus - e.g. "Manifested", "In Transit", "Delivered", "RTO"
 * @returns {string} - one of the fulfillment step keys
 */
export function delhiveryStatusToFulfillment(delhiveryStatus) {
  const s = String(delhiveryStatus || "").toLowerCase().trim();

  // Delivered states
  if (s.includes("delivered")) return "delivered";

  // Out for delivery
  if (s.includes("out for delivery") || s === "ofd") return "out_for_delivery";

  // In transit variants
  if (
    s.includes("in transit") ||
    s.includes("intransit") ||
    s.includes("reached") ||
    s.includes("dispatched") ||
    s.includes("added to bag") ||
    s.includes("bag added") ||
    s.includes("connected")
  ) return "in_transit";

  // Shipped / manifested / picked up
  if (
    s.includes("manifested") ||
    s.includes("picked up") ||
    s.includes("pickup") ||
    s.includes("shipped")
  ) return "shipped";

  // RTO / return / cancelled — show as shipped (not delivered)
  if (s.includes("rto") || s.includes("return")) return "in_transit";

  return "placed";
}

