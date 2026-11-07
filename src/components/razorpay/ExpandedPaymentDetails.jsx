import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ShoppingCart, CreditCard, MapPin, Key, Truck, ExternalLink, Loader2, Mail, MailX } from "lucide-react";
import { Button } from "../ui/button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { phpApi, phpRoutes } from "../../lib/phpApi";
import { FULFILLMENT_STEPS, fulfillmentLabel, normalizeFulfillmentStatus } from "../../utils/fulfillmentStatus";
import { getProductCoverImage } from "../../utils/productImages";

export function ExpandedPaymentDetails({ order, onOrderUpdated }) {
    const [fulfillmentStatus, setFulfillmentStatus] = useState(
        normalizeFulfillmentStatus(order?.fulfillmentStatus)
    );
    const [awbNumber, setAwbNumber] = useState(order?.awbNumber || "");
    const [trackingUrl, setTrackingUrl] = useState(order?.trackingUrl || "");
    const [saving, setSaving] = useState(false);
    const [statusDialog, setStatusDialog] = useState(null);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [dispatchLoading, setDispatchLoading] = useState(false);
    const resolveImageURL = (item) => {
        return getProductCoverImage(item);
    };

    const normalizeItems = (raw) => {
        if (!Array.isArray(raw)) return [];
        return raw.map((item, idx) => {
            const rawPrice = Number(item?.price ?? item?.offer_price ?? 0);
            const price = rawPrice > 1000 ? rawPrice / 100 : rawPrice;
            return {
                id: item?.id || item?.sku || item?.reference_id || idx,
                sku: item?.sku || item?.reference_id || "",
                title: item?.title || item?.name || "Item",
                imageURL: resolveImageURL(item),
                qty: Number(item?.qty || item?.quantity || 1),
                price,
            };
        });
    };
    const items = (() => {
        const sources = [order?.cart, order?.items, order?.line_items];
        for (const src of sources) {
            const normalized = normalizeItems(src);
            if (normalized.length > 0) return normalized;
        }
        return [];
    })();
    const amount = Number(order?.amount || 0);
    const displayAmount = amount.toFixed(2);
    const address = order?.selectedAddress || order?.address || {};
    const line1 = address?.line1 || address?.address || "";
    const line2 = address?.line2 || address?.area || address?.street || "";
    const city = address?.city || "";
    const state = address?.state || "";
    const pincode = address?.pincode || address?.zipcode || "";
    const country = address?.country || "India";

    const hasPaidPayment = Boolean(
        (order?.dbPaymentId || order?.paymentId) && order?.isValid
    );
    const trackingLinked = Boolean(
        hasPaidPayment && order?.trackingEligible !== false
    );
    const trackingCutoffLabel = order?.trackingCutoffAt
        ? new Date(order.trackingCutoffAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
          })
        : order?.trackingCutoffAt || "";

    const patchOrder = async (payload) => {
        const phpOrderId = order?.phpOrderId || order?.paymentId || order?.dbPaymentId;
        if (!phpOrderId) return;
        setSaving(true);
        try {
            await phpApi.patch(`${phpRoutes.orders}/${phpOrderId}`, payload);
            if (payload.fulfillmentStatus) {
                setFulfillmentStatus(payload.fulfillmentStatus);
            }
            if (payload.awbNumber !== undefined) {
                setAwbNumber(payload.awbNumber);
            }
            if (payload.trackingUrl !== undefined) {
                setTrackingUrl(payload.trackingUrl);
            }
            onOrderUpdated?.();
        } catch (e) {
            alert(e?.response?.data?.error || e?.message || "Failed to save.");
            throw e;
        } finally {
            setSaving(false);
        }
    };

    const handleAwbChange = (val) => {
        setAwbNumber(val);
        const trimmed = val.trim();
        if (trimmed && (!trackingUrl.trim() || trackingUrl.includes("delhivery.com/track/package"))) {
            setTrackingUrl(`https://www.delhivery.com/track/package/${encodeURIComponent(trimmed)}`);
        }
    };

    const handleDispatchDelhivery = async () => {
        const phpOrderId = order?.phpOrderId || order?.paymentId || order?.dbPaymentId || order?.id;
        if (!phpOrderId) return;
        setDispatchLoading(true);
        try {
            const { data } = await phpApi.post(phpRoutes.delhiveryCreateOrder, {
                payment_id: phpOrderId,
            });
            if (data?.waybill) {
                setAwbNumber(data.waybill);
                setTrackingUrl(data.tracking_url || `https://www.delhivery.com/track/package/${encodeURIComponent(data.waybill)}`);
                setFulfillmentStatus("shipped");
                onOrderUpdated?.();
                setStatusDialog({
                    type: "success",
                    nextLabel: "Shipped via Delhivery",
                    sendsEmail: true,
                });
            } else {
                alert(data?.message || "Order dispatched to Delhivery");
            }
        } catch (e) {
            alert(e?.response?.data?.error || e?.message || "Delhivery dispatch failed");
        } finally {
            setDispatchLoading(false);
        }
    };

    const handleSaveTracking = () => {
        const finalUrl = trackingUrl.trim() || (awbNumber.trim() ? `https://www.delhivery.com/track/package/${encodeURIComponent(awbNumber.trim())}` : "");
        patchOrder({
            awbNumber: awbNumber.trim(),
            trackingUrl: finalUrl,
        });
    };

    const fulfillmentChangeSendsEmail = (status) =>
        status === "shipped" || status === "in_transit" || status === "delivered";

    const openFulfillmentConfirm = (nextStatus) => {
        if (nextStatus === fulfillmentStatus) return;

        if (nextStatus === "shipped" && !trackingUrl.trim()) {
            if (awbNumber.trim()) {
                const autoUrl = `https://www.delhivery.com/track/package/${encodeURIComponent(awbNumber.trim())}`;
                setTrackingUrl(autoUrl);
                setStatusDialog({ type: "confirm", nextStatus });
                return;
            }
            setStatusDialog({
                type: "alert",
                title: "Tracking link or AWB required",
                description:
                    "Enter the Delhivery AWB number or paste a tracking link, then change status to Shipped. The customer will get an email with AWB and tracking link.",
            });
            return;
        }

        setStatusDialog({ type: "confirm", nextStatus });
    };

    const handleConfirmFulfillment = async () => {
        if (statusDialog?.type !== "confirm") return;
        const nextStatus = statusDialog.nextStatus;
        const nextLabel = fulfillmentLabel(nextStatus);
        const sendsEmail = fulfillmentChangeSendsEmail(nextStatus);

        try {
            await patchOrder({
                fulfillmentStatus: nextStatus,
                awbNumber: awbNumber.trim(),
                trackingUrl: trackingUrl.trim(),
            });
            setStatusDialog({
                type: "success",
                nextLabel,
                sendsEmail,
            });
        } catch {
            setStatusDialog(null);
        }
    };

    const handleCancelShipment = async () => {
        const waybill = awbNumber.trim();
        if (!waybill) return;
        const phpOrderId = order?.phpOrderId || order?.paymentId || order?.dbPaymentId;
        if (!phpOrderId) return;

        if (!window.confirm(`Cancel Delhivery shipment AWB ${waybill}? This cannot be undone.`)) return;

        setCancelLoading(true);
        try {
            await phpApi.post(phpRoutes.delhiveryCancel, {
                waybill,
                payment_id: phpOrderId,
            });
            setFulfillmentStatus("cancelled");
            onOrderUpdated?.();
        } catch (e) {
            alert(e?.response?.data?.error || e?.message || "Cancellation failed.");
        } finally {
            setCancelLoading(false);
        }
    };

    const confirmNextLabel =
        statusDialog?.type === "confirm" ? fulfillmentLabel(statusDialog.nextStatus) : "";
    const confirmSendsEmail =
        statusDialog?.type === "confirm" && fulfillmentChangeSendsEmail(statusDialog.nextStatus);

    return (
        <div className="p-6 animate-in slide-in-from-top-2 duration-200">
            <ConfirmDialog
                open={statusDialog?.type === "confirm"}
                onClose={() => setStatusDialog(null)}
                title={`Update to ${confirmNextLabel}?`}
                description="This updates what the customer sees on My Orders and order tracking."
                icon={Truck}
                confirmText="Update status"
                cancelText="Cancel"
                loading={saving}
                onConfirm={handleConfirmFulfillment}
            >
                <div
                    className={`mt-3 flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${
                        confirmSendsEmail
                            ? "border-green-200 bg-green-50 text-green-900"
                            : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                >
                    {confirmSendsEmail ? (
                        <Mail className="h-4 w-4 shrink-0 mt-0.5 text-green-700" />
                    ) : (
                        <MailX className="h-4 w-4 shrink-0 mt-0.5 text-slate-500" />
                    )}
                    <span>
                        {confirmSendsEmail
                            ? "A notification email will be sent to the customer for this status."
                            : "No email is sent for this change. The order-placed email is sent only once when payment succeeds."}
                    </span>
                </div>
            </ConfirmDialog>

            <ConfirmDialog
                open={statusDialog?.type === "alert"}
                onClose={() => setStatusDialog(null)}
                title={statusDialog?.title || ""}
                description={statusDialog?.description || ""}
                variant="warning"
                hideCancel
                confirmText="Got it"
                onConfirm={() => setStatusDialog(null)}
            />

            <ConfirmDialog
                open={statusDialog?.type === "success"}
                onClose={() => setStatusDialog(null)}
                title="Status updated"
                description={
                    statusDialog?.sendsEmail
                        ? `${statusDialog.nextLabel} — customer notification email sent (if email is configured).`
                        : `${statusDialog?.nextLabel} — saved. No customer email was sent for this status.`
                }
                variant="success"
                hideCancel
                confirmText="Done"
                onConfirm={() => setStatusDialog(null)}
            />
            <Card className={`shadow-sm mb-6 ${trackingLinked ? "border-green-200 bg-green-50/40" : "border-slate-200 bg-slate-50/80"}`}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                        <Truck className={`h-4 w-4 ${trackingLinked ? "text-green-700" : "text-slate-500"}`} />
                        Customer delivery status
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {trackingLinked ? (
                        <>
                            <p className="text-sm text-muted-foreground m-0">
                                <strong>Workflow:</strong> Shiprocket → Ship Now → copy <strong>AWB</strong> + <strong>tracking link</strong> below → then set status to <strong>Shipped</strong> (email goes to customer).
                            </p>
                            {fulfillmentStatus === "cancelled" && (
                                <p className="text-sm font-medium text-red-600 flex items-center gap-1.5">
                                    <span>✕</span> Shipment cancelled
                                </p>
                            )}
                            <div className="grid sm:grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="text-xs font-medium text-slate-600">AWB number</span>
                                    <input
                                        type="text"
                                        className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                                        placeholder="e.g. 123456789012"
                                        value={awbNumber}
                                        disabled={saving || dispatchLoading}
                                        onChange={(e) => handleAwbChange(e.target.value)}
                                    />
                                </label>
                                <label className="block sm:col-span-1">
                                    <span className="text-xs font-medium text-slate-600">Courier tracking link</span>
                                    <input
                                        type="url"
                                        className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                                        placeholder="https://..."
                                        value={trackingUrl}
                                        disabled={saving || dispatchLoading}
                                        onChange={(e) => setTrackingUrl(e.target.value)}
                                    />
                                </label>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={saving || dispatchLoading}
                                    onClick={handleSaveTracking}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                            Saving…
                                        </>
                                    ) : (
                                        "Save AWB & link"
                                    )}
                                </Button>
                                {!awbNumber.trim() && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={saving || dispatchLoading}
                                        onClick={handleDispatchDelhivery}
                                        className="bg-green-700 hover:bg-green-800 text-white"
                                    >
                                        {dispatchLoading ? (
                                            <>
                                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                                Dispatching to Delhivery…
                                            </>
                                        ) : (
                                            <>
                                                <Truck className="h-3.5 w-3.5 mr-1.5" />
                                                Auto-Dispatch with Delhivery
                                            </>
                                        )}
                                    </Button>
                                )}
                                {trackingUrl.trim() ? (
                                    <a
                                        href={trackingUrl.trim()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Preview courier link
                                    </a>
                                ) : null}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-green-200/60">
                                <p className="text-sm text-muted-foreground m-0 flex-1">
                                    Customer sees: <strong>{fulfillmentLabel(fulfillmentStatus)}</strong>
                                    {awbNumber ? (
                                        <>
                                            {" "}
                                            · AWB <strong>{awbNumber}</strong>
                                        </>
                                    ) : null}
                                </p>
                                <div className="flex flex-col sm:items-end gap-1.5">
                                    <div className="flex items-center gap-2">
                                        <select
                                            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white min-w-[200px] disabled:opacity-60"
                                            value={fulfillmentStatus}
                                            disabled={saving}
                                            onChange={(e) => openFulfillmentConfirm(e.target.value)}
                                        >
                                            {FULFILLMENT_STEPS.map((step) => (
                                                <option key={step.key} value={step.key}>
                                                    {step.label}
                                                </option>
                                            ))}
                                        </select>
                                        {saving ? (
                                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 whitespace-nowrap">
                                                <Loader2 className="h-4 w-4 animate-spin text-green-700" />
                                                Updating…
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                            {awbNumber.trim() && fulfillmentStatus !== "delivered" && fulfillmentStatus !== "cancelled" && (
                                <div className="pt-2 border-t border-red-100">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={cancelLoading || saving}
                                        onClick={handleCancelShipment}
                                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                    >
                                        {cancelLoading ? (
                                            <>
                                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                                Cancelling…
                                            </>
                                        ) : (
                                            "Cancel Shipment (Delhivery)"
                                        )}
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : hasPaidPayment && order?.trackingEligible === false ? (
                        <p className="text-sm text-slate-600 m-0">
                            Delivery tracking is not available for this order — it was placed before the tracking
                            start date
                            {trackingCutoffLabel ? (
                                <>
                                    {" "}
                                    (<strong>{trackingCutoffLabel}</strong>)
                                </>
                            ) : null}
                            . Use Shiprocket and invoice as usual; status emails apply only to newer orders. Set{" "}
                            <code className="text-xs bg-slate-100 px-1 rounded">TRACKING_FEATURE_START_AT</code> in
                            server <code className="text-xs bg-slate-100 px-1 rounded">.env</code> to change the cutoff.
                        </p>
                    ) : (
                        <p className="text-sm text-slate-600 m-0">
                            Delivery tracking is not available for this payment row. Save a paid checkout to the
                            payments table first, or refresh after payment completes.
                        </p>
                    )}
                </CardContent>
            </Card>
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Cart Items */}
                <Card className="border-border/50 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                            <ShoppingCart className="h-4 w-4 text-green-700" />
                            Cart Items
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {items.map((item, idx) => (
                            <div
                                key={item.id || item.sku || idx}
                                className="flex items-center gap-4 p-3 rounded-lg bg-accent/30 border border-border/30"
                            >
                                {item.imageURL ? (
                                    <img
                                        src={item.imageURL}
                                        alt={item.title || item.name || "Item"}
                                        className="w-14 h-14 rounded-lg object-cover border border-border/50"
                                        onError={(e) => {
                                            const fallback = productImageBySku[String(item?.sku || "").toLowerCase()];
                                            if (fallback && e.currentTarget.src !== window.location.origin + fallback) {
                                                e.currentTarget.src = fallback;
                                                return;
                                            }
                                            e.currentTarget.style.display = "none";
                                        }}
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-lg border border-border/50 bg-muted" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground truncate">{item.title || item.name || "Item"}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Qty {item.qty || item.quantity || 1} × ₹{Number(item.price || 0)}
                                    </p>
                                </div>
                                <div className="font-semibold text-foreground">
                                    ₹{(Number(item.qty || item.quantity || 1) * Number(item.price || 0)).toFixed(2)}
                                </div>
                            </div>
                        ))}
                        {items.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No cart items
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Payment & Address Info */}
                <div className="space-y-4">
                    {/* Payment Info */}
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                                <CreditCard className="h-4 w-4 text-green-700" />
                                Payment Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 font-mono text-xs text-muted-foreground bg-accent/30 p-4 rounded-lg border border-border/30">
                                <p className="break-all">
                                    <span className="font-semibold text-foreground">Name:</span>{" "}
                                    {order?.name || "Customer"}
                                </p>
                                <p className="break-all">
                                    <span className="font-semibold text-foreground">Phone:</span>{" "}
                                    {order.phone || "N/A"}
                                </p>
                                <p className="break-all">
                                    <span className="font-semibold text-foreground">Email:</span>{" "}
                                    {order.email || "N/A"}
                                </p>
                                <p className="break-all">
                                    <span className="font-semibold text-foreground">Order:</span>{" "}
                                    {order.razorpay_order_id}
                                </p>
                                <p className="break-all">
                                    <span className="font-semibold text-foreground">Payment:</span>{" "}
                                    {order.razorpay_payment_id}
                                </p>
                                <p>
                                    <span className="font-semibold text-foreground">Amount:</span>{" "}
                                    ₹{displayAmount}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address */}
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                                <MapPin className="h-4 w-4 text-green-700" />
                                Delivery Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm leading-relaxed bg-accent/30 p-4 rounded-lg border border-border/30 text-muted-foreground">
                                {line1 || line2 || city || state || pincode ? (
                                    <>
                                        <p>{line1}</p>
                                        {line2 && (
                                            <p>{line2}</p>
                                        )}
                                        {city && <p>{city}</p>}
                                        <p>
                                            {state} {pincode ? `- ${pincode}` : ""}
                                        </p>
                                        <p>{country}</p>
                                    </>
                                ) : (
                                    <p className="text-center py-2">No address provided</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Signature */}
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                                <Key className="h-4 w-4 text-green-700" />
                                Razorpay Signature
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="font-mono text-[10px] break-all text-muted-foreground bg-accent/30 p-4 rounded-lg border border-border/30">
                                {order.razorpay_signature || "N/A"}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
