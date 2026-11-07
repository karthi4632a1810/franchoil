/**
 * Display semantics for Razorpay orders: DB `isValid` is signature validity, not capture.
 * Use with webhook `payment.failed` so filters match the table badges.
 */

export const normalizeWebhookEvent = (ev) =>
    String(ev || "")
        .toLowerCase()
        .replace(/[\s_]+/g, ".")
        .trim();

export const isDisplayFailed = (order) => {
    if (order?.status === "missing_order") return false;
    if (order?.payment_status === "failed" || order?.status === "failed") return true;
    if (normalizeWebhookEvent(order?.webhookEvent) === "payment.failed") return true;
    return false;
};

export const isDisplayPaid = (order) => {
    if (order?.status === "missing_order") return false;
    if (isDisplayFailed(order)) return false;
    return (
        !!order?.isValid ||
        order?.payment_status === "captured" ||
        order?.status === "success"
    );
};
