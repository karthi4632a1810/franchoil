import { useEffect, useState } from "react";
import { phpApi, phpRoutes } from "../lib/phpApi";
import { getProductCoverImage } from "../utils/productImages";

// Global memory cache shared across all admin pages (Dashboard, View Orders, Order Tracking, Reports)
const ordersStore = {
    orders: [],
    webhooks: [],
    initiations: [],
    stats: {
        totalOrders: 0,
        paidOrders: 0,
        pendingOrders: 0,
        failedOrders: 0,
        missingOrders: 0,
        trashOrders: 0,
    },
    trashOrders: [],
    hasLoadedOnce: false,
    lastFetchedAt: 0,
    activePromise: null,
    listeners: new Set(),
};

// Hydrate from sessionStorage if available for 0ms cold-start on tab reload
try {
    if (typeof window !== "undefined") {
        const saved = sessionStorage.getItem("franch_admin_orders_cache_v2");
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed?.orders) && parsed.orders.length > 0) {
                ordersStore.orders = parsed.orders;
                ordersStore.stats = parsed.stats || ordersStore.stats;
                ordersStore.trashOrders = parsed.trashOrders || [];
                ordersStore.webhooks = parsed.webhooks || [];
                ordersStore.hasLoadedOnce = true;
                ordersStore.lastFetchedAt = parsed.timestamp || 0;
            }
        }
    }
} catch (_) {}

/**
 * Comprehensive hook to fetch all Razorpay-related data:
 * - payments collection (old orders)
 * - orders collection (new orders from webhook)
 * - razorpay_webhooks collection (webhook events)
 * - razorpay_order_snapshots (Razorpay order API data)
 * 
 * Compares data to identify missing orders and show status
 */
export const useRazorpayOrdersComplete = () => {
    const [orders, setOrders] = useState(() => ordersStore.orders);
    const [webhooks, setWebhooks] = useState(() => ordersStore.webhooks);
    const [initiations] = useState(() => ordersStore.initiations);
    const [loading, setLoading] = useState(() => !ordersStore.hasLoadedOnce);
    const [stats, setStats] = useState(() => ordersStore.stats);
    const [trashOrdersState, setTrashOrdersState] = useState(() => ordersStore.trashOrders);

    const toDateValue = (value) => {
        if (!value) return new Date(0);
        if (value?.toDate && typeof value.toDate === "function") return value.toDate();
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? new Date(0) : date;
    };

    const extractWebhookOrderId = (webhook) => {
        const payload = webhook?.payload_json || {};
        return (
            payload?.payload?.payment?.entity?.order_id ||
            payload?.payload?.order?.entity?.id ||
            payload?.payload?.order_id ||
            payload?.order_id ||
            payload?.razorpay_order_id ||
            null
        );
    };

    const extractWebhookPaymentId = (webhook) => {
        const payload = webhook?.payload_json || {};
        return (
            payload?.payload?.payment?.entity?.id ||
            payload?.payment?.id ||
            webhook?.entity_id ||
            null
        );
    };

    const extractWebhookPaymentEntity = (webhook) => {
        const payload = webhook?.payload_json || {};
        return payload?.payload?.payment?.entity || payload?.payment?.entity || payload?.payment || null;
    };

    const normalizeEventType = (eventType) =>
        String(eventType || "")
            .toLowerCase()
            .replace(/[\s_]+/g, ".")
            .trim();

    const closeEnough = (a, b) => Math.abs(Number(a || 0) - Number(b || 0)) < 0.01;
    const resolveLocalOrderImage = (item = {}) => {
        return getProductCoverImage(item);
    };
    const normalizeDisplayProductTitle = (value) =>
        String(value || "")
            .replace(/\s*,\s*/g, " - ")
            .replace(/\s+/g, " ")
            .trim();

    const parseItemsSummaryText = (text, amountRupees = 0, resolveSkuFromTitle, productPriceBySku = {}) => {
        const raw = String(text || "").trim();
        if (!raw) return [];
        const matchedParts = [...raw.matchAll(/(.*?\s+x\s+\d+)(?:\s*[;,\n\r]\s*|$)/gi)]
            .map((match) => String(match[1] || "").trim())
            .filter(Boolean);
        const parts = matchedParts.length > 0
            ? matchedParts
            : [raw];
        if (parts.length === 0) return [];

        const parsedItems = parts.map((part, idx) => {
            const match = part.match(/^(.*)\s+x\s+(\d+)$/i);
            const title = (match?.[1] || part).trim();
            const qty = Math.max(1, Number(match?.[2] || 1));
            const resolvedSku = resolveSkuFromTitle ? resolveSkuFromTitle(title) : "";
            const catalogUnitPrice =
                resolvedSku && productPriceBySku
                    ? Number(productPriceBySku[resolvedSku] || 0)
                    : 0;

            return {
                id: `summary_${idx}`,
                sku: resolvedSku || "",
                title: normalizeDisplayProductTitle(title || "Item"),
                imageURL: getProductCoverImage({ title, sku: resolvedSku }),
                qty,
                catalogUnitPrice,
            };
        });

        const hasMultipleItems = parsedItems.length > 1;
        const allHaveCatalogPrice = parsedItems.every((item) => Number(item.catalogUnitPrice) > 0);

        return parsedItems.map((item) => {
            let unitPrice = 0;

            if (hasMultipleItems && allHaveCatalogPrice) {
                // For true multi-item summaries, trust per-item catalog price.
                unitPrice = Number(item.catalogUnitPrice);
            } else if (amountRupees > 0) {
                // Single-item (or fallback) summaries should match paid total.
                unitPrice = Number((amountRupees / item.qty).toFixed(2));
            } else if (item.catalogUnitPrice > 0) {
                unitPrice = Number(item.catalogUnitPrice);
            }

            return {
                id: item.id,
                sku: item.sku,
                title: item.title,
                imageURL: item.imageURL,
                qty: item.qty,
                price: unitPrice,
            };
        });
    };

    /**
     * `payments.is_valid` in DB is Razorpay signature validity — NOT whether money was captured.
     * Failed webhooks are still validly signed, so we must use `event` / entity status for Paid vs Failed.
     */
    const derivePaymentOutcomeFromRow = (paymentRow) => {
        const p = paymentRow || {};
        const evtRaw = p.event;
        const evt = normalizeEventType(evtRaw);
        const inner = p?.payload?.payment?.entity || p?.payment?.entity || {};
        const st = String(inner.status || p.payment_status || p.status || "").toLowerCase();

        if (evt === "payment.failed" || st === "failed") {
            return { payment_status: "failed", status: "failed", isValid: false };
        }
        if (
            evt === "payment.captured" ||
            evt === "order.paid" ||
            st === "captured"
        ) {
            return { payment_status: "captured", status: "success", isValid: true };
        }
        if (evt === "payment.authorized" || st === "authorized") {
            return {
                payment_status: "authorized",
                status: p.status || "pending",
                isValid: false,
            };
        }
        // Client `/verify` path: success handler only; payload often has no `event` field.
        if ((evtRaw === undefined || evtRaw === null || String(evtRaw).trim() === "") && p.isValid) {
            return { payment_status: "captured", status: "success", isValid: true };
        }
        return {
            payment_status: p.payment_status || st || "pending",
            status: p.status || "pending",
            isValid: false,
        };
    };

    /** Prefer settlement events when several webhooks refer to the same Razorpay order (retry flows). */
    const webhookOutcomeRank = (eventType) => {
        const e = normalizeEventType(eventType);
        if (e === "order.paid") return 4;
        if (e === "payment.captured") return 3;
        if (e === "payment.authorized") return 2;
        if (e === "payment.failed") return 1;
        return 0;
    };

    /**
     * If `payments` was overwritten by a late payment.failed for another attempt, razorpay_webhooks still
     * lists payment.captured / order.paid — use that to restore Paid in the admin UI.
     */
    const reconcileOrderOutcomeFromRazorpayWebhooks = (order, hooksWithIds) => {
        const oid = String(order.razorpay_order_id || "").trim();
        if (!oid) return order;
        let bestRank = 0;
        for (const w of hooksWithIds) {
            const wid = String(extractWebhookOrderId(w) || "").trim();
            if (wid !== oid) continue;
            const r = webhookOutcomeRank(w.event_type);
            if (r > bestRank) bestRank = r;
        }
        if (bestRank >= 3) {
            if (order.payment_status === "captured" && order.status === "success") return order;
            return { ...order, payment_status: "captured", status: "success", isValid: true };
        }
        if (bestRank === 2) {
            if (order.status === "success") return order;
            return { ...order, payment_status: "authorized", status: "pending", isValid: false };
        }
        return order;
    };

    const resolveAmountRupees = ({ paymentAmount, payloadAmount, initiationAmount, paymentEntityAmount }) => {
        const pay = Number(paymentAmount || 0);
        const pld = Number(payloadAmount || 0);
        const init = Number(initiationAmount || 0);
        const entityPaise = Number(paymentEntityAmount || 0);

        // If initiation exists, trust it as checkout total in rupees.
        if (init > 0) return init;

        if (entityPaise > 0) return entityPaise / 100;

        // Fallbacks for old rows with mixed units.
        if (pay > 0 && pld > 0 && closeEnough(pay, pld)) {
            return pay >= 1000 ? pay / 100 : pay;
        }
        if (pay > 0) return pay >= 1000 ? pay / 100 : pay;
        if (pld > 0) return pld >= 1000 ? pld / 100 : pld;
        return 0;
    };

    const fetchAllData = (isBackground = false) => {
        if (ordersStore.activePromise) {
            return ordersStore.activePromise;
        }

        if (!ordersStore.hasLoadedOnce && !isBackground) {
            setLoading(true);
        }

        ordersStore.activePromise = (async () => {
            try {
                const [paymentsRes, webhooksRes, snapshotsRes, initiationsRes, productsRes] = await Promise.all([
                phpApi.get(`${phpRoutes.payments}?pageSize=2000`),
                phpApi.get(`${phpRoutes.razorpayWebhooks}?pageSize=2000`),
                phpApi.get(`${phpRoutes.razorpayOrderSnapshots}?pageSize=2000`),
                phpApi.get(`${phpRoutes.orderInitiations}?pageSize=2000`),
                phpApi.get(`${phpRoutes.products}?pageSize=2000&onlyActive=true`),
            ]);

            const payments = Array.isArray(paymentsRes?.data?.payments) ? paymentsRes.data.payments : [];
            const webhooksRaw = Array.isArray(webhooksRes?.data?.webhooks) ? webhooksRes.data.webhooks : [];
            const snapshotsRaw = Array.isArray(snapshotsRes?.data?.snapshots) ? snapshotsRes.data.snapshots : [];
            const initiationsRaw = Array.isArray(initiationsRes?.data?.initiations)
                ? initiationsRes.data.initiations
                : [];
            const productsRaw = Array.isArray(productsRes?.data?.products) ? productsRes.data.products : [];

            const initiationByOrderId = new Map();
            initiationsRaw.forEach((row) => {
                const orderId = String(row?.razorpay_order_id || "").trim();
                const payload = row?.payload_json && typeof row.payload_json === "object" ? row.payload_json : {};
                if (orderId) initiationByOrderId.set(orderId, payload);
            });

            const productPriceBySku = productsRaw.reduce((acc, p) => {
                const sku = String(p?.sku || "").trim().toLowerCase();
                if (!sku) return acc;
                acc[sku] = Number(p?.price) || 0;
                return acc;
            }, {});

            const normalizeTitleForSku = (t) =>
                String(t || "")
                    .toLowerCase()
                    .replace(/\*/g, "")
                    .replace(/[^a-z0-9 ]/g, " ")
                    .replace(/\s+/g, " ")
                    .trim();

            const resolveSkuFromTitle = (title) => {
                const t = normalizeTitleForSku(title);
                if (!t) return "";

                if (t.includes("franch oil nh") && t.includes("plus")) return "franch-oil-nh-plus";
                if (t.includes("clear skin soap")) return "franch-ayurveda-skin-soap";
                if (t.includes("orthovin thailam")) return "franch-orthovin-thailam";
                if (
                    t.includes("og-3") ||
                    t.includes("omega 3") ||
                    t.includes("omega-3") ||
                    t.includes("omega3") ||
                    t.includes("og 3")
                ) return "omega-3";

                if (t.includes("omega 3 veg")) return "omega-3";
                return "";
            };

            const webhooksList = webhooksRaw.map((webhook) => ({
                ...webhook,
                razorpay_order_id: extractWebhookOrderId(webhook),
                razorpay_payment_id: extractWebhookPaymentId(webhook),
                payment_entity: extractWebhookPaymentEntity(webhook),
            }));

            setWebhooks(webhooksList);

            const snapshotByOrderId = new Map();
            snapshotsRaw.forEach((s) => {
                const orderId = String(s?.razorpay_order_id || "").trim();
                if (orderId) snapshotByOrderId.set(orderId, s?.payload_json || {});
            });

            const fromAny = (...values) =>
                values.find((v) => {
                    const s = String(v ?? "").trim();
                    return s !== "" && s !== "—";
                });

            const nameFromEmail = (email) => {
                const e = String(email || "").trim().toLowerCase();
                const at = e.indexOf("@");
                if (at <= 0) return "";
                const local = e
                    .slice(0, at)
                    .replace(/[._+-]+/g, " ")
                    .trim();
                if (!local) return "";
                return local
                    .split(/\s+/)
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ");
            };
            const normalizeAddress = (rawAddress, fallback = {}) => {
                const base = (rawAddress && typeof rawAddress === "object") ? rawAddress : {};
                const fb = (fallback && typeof fallback === "object") ? fallback : {};
                return {
                    name: fromAny(base.name, fb.name, ""),
                    line1: fromAny(base.line1, base.address, fb.line1, fb.address, ""),
                    line2: fromAny(base.line2, base.street, fb.line2, fb.street, ""),
                    area: fromAny(base.area, fb.area, ""),
                    city: fromAny(base.city, fb.city, ""),
                    state: fromAny(base.state, fb.state, ""),
                    country: fromAny(base.country, fb.country, "India"),
                    pincode: fromAny(base.pincode, base.zipcode, fb.pincode, fb.zipcode, ""),
                };
            };
            const normalizeLineItems = (rawItems) => {
                if (!Array.isArray(rawItems)) return [];
                return rawItems.map((item, idx) => {
                    const unitRaw = Number(item?.offer_price ?? item?.price ?? item?.unit_amount ?? 0);
                    const unit = unitRaw > 1000 ? unitRaw / 100 : unitRaw;
                    return {
                        id: item?.id || item?.sku || item?.reference_id || `line_item_${idx}`,
                        sku: item?.sku || item?.reference_id || item?.itemCode || "",
                        title: normalizeDisplayProductTitle(item?.title || item?.name || "Item"),
                        imageURL: resolveLocalOrderImage(item),
                        qty: Number(item?.qty || item?.quantity || 1),
                        price: Number(unit || 0),
                    };
                });
            };
            const normalizeCart = (rawCart) => {
                if (!Array.isArray(rawCart)) return [];
                return rawCart.map((item, idx) => ({
                    id: item?.id || item?.productId || item?.sku || `item_${idx}`,
                    sku: item?.sku || item?.productId || "",
                    title: normalizeDisplayProductTitle(item?.title || item?.name || "Item"),
                    imageURL: resolveLocalOrderImage(item),
                    qty: Number(item?.qty || item?.quantity || 1),
                    price: Number(item?.price || item?.offer_price || 0),
                }));
            };
            const pickItems = (...sources) => {
                for (const src of sources) {
                    if (Array.isArray(src) && src.length > 0) {
                        return src;
                    }
                }
                return [];
            };

            const paymentOrders = payments.map((payment) => {
                // API already returns PaymentOrderHelper::normalizePaymentView (flat customer fields).
                const nestedPayload =
                    payment?.payload_json && typeof payment.payload_json === "object"
                        ? payment.payload_json
                        : null;
                const flat = nestedPayload ? { ...nestedPayload, ...payment } : { ...(payment || {}) };
                const webhookPayload = flat?.payload || flat?.payload_json || {};
                const paymentOutcome = derivePaymentOutcomeFromRow(flat);
                const paymentEntity =
                    webhookPayload?.payload?.payment?.entity ||
                    webhookPayload?.payment?.entity ||
                    flat?.payment?.entity ||
                    {};
                const orderIdKey = String(flat?.razorpay_order_id || "").trim();
                const initiationPayload = initiationByOrderId.get(orderIdKey) || {};
                const snapshotPayload = snapshotByOrderId.get(orderIdKey) || {};
                const snapshotCustomer = snapshotPayload?.customer_details || {};
                const shippingAddress = snapshotCustomer?.shipping_address || {};
                const billingAddress = snapshotCustomer?.billing_address || {};
                const customer = flat.customer || {};
                const notes = paymentEntity?.notes || {};
                const rawAddress =
                    flat.selectedAddress ||
                    flat.address ||
                    initiationPayload?.selectedAddress ||
                    initiationPayload?.address ||
                    {};
                const notesAddress = {
                    line1: notes.address_line1,
                    line2: notes.address_line2,
                    area: notes.area,
                    city: notes.city,
                    state: notes.state,
                    country: notes.country,
                    pincode: notes.pincode,
                };
                const snapshotAddress = {
                    line1: shippingAddress?.line1 || billingAddress?.line1 || "",
                    line2: shippingAddress?.line2 || billingAddress?.line2 || "",
                    city: shippingAddress?.city || billingAddress?.city || "",
                    state: shippingAddress?.state || billingAddress?.state || "",
                    country: shippingAddress?.country || billingAddress?.country || "",
                    pincode: shippingAddress?.zipcode || billingAddress?.zipcode || "",
                };
                const selectedAddress = normalizeAddress(rawAddress, {
                    ...normalizeAddress(notesAddress, snapshotAddress),
                    name: fromAny(
                        rawAddress?.name,
                        shippingAddress?.name,
                        billingAddress?.name,
                        initiationPayload?.selectedAddress?.name,
                        initiationPayload?.customer_name
                    ),
                });
                const amountValue = resolveAmountRupees({
                    paymentAmount: flat.amount,
                    payloadAmount: flat.amount,
                    initiationAmount: 0,
                    paymentEntityAmount: paymentEntity?.amount,
                });
                const notesItemsText =
                    paymentEntity?.notes?.items ||
                    flat?.payload?.payment?.entity?.notes?.items ||
                    snapshotPayload?.notes?.items ||
                    paymentEntity?.description ||
                    "";
                const cart = pickItems(
                    normalizeCart(flat?.cart),
                    normalizeCart(flat?.items),
                    normalizeLineItems(flat?.line_items),
                    normalizeLineItems(snapshotPayload?.line_items),
                    parseItemsSummaryText(notesItemsText, amountValue, resolveSkuFromTitle, productPriceBySku)
                );
                const paid = paymentOutcome.isValid;
                const trackingEligible = flat.trackingEligible !== false;
                return {
                    id: flat.id,
                    dbPaymentId: Number(flat.id || 0),
                    phpOrderId: paid && trackingEligible ? String(flat.id || "") : "",
                    paymentId: paid && trackingEligible ? String(flat.id || "") : "",
                    trackingEligible,
                    trackingCutoffAt: flat.trackingCutoffAt || "",
                    fulfillmentStatus: flat.fulfillmentStatus || "placed",
                    awbNumber: flat.awbNumber || "",
                    trackingUrl: flat.trackingUrl || "",
                    razorpay_order_id: flat.razorpay_order_id,
                    razorpay_payment_id: flat.razorpay_payment_id,
                    amount: amountValue,
                    name:
                        fromAny(
                            flat.customerName,
                            flat.name,
                            flat.customer_name,
                            customer.name,
                            initiationPayload?.customer_name,
                            initiationPayload?.name,
                            rawAddress?.name,
                            selectedAddress?.name,
                            shippingAddress?.name,
                            billingAddress?.name,
                            paymentEntity?.name,
                            notes?.name,
                            notes?.customer_name
                        ) ||
                        nameFromEmail(
                            fromAny(
                                flat.customerEmail,
                                flat.email,
                                customer.email,
                                initiationPayload?.customer_email,
                                initiationPayload?.email,
                                paymentEntity?.email
                            )
                        ) ||
                        "—",
                    email: fromAny(
                        flat.customerEmail,
                        customer.email,
                        flat.email,
                        initiationPayload?.customer_email,
                        initiationPayload?.email,
                        snapshotCustomer?.email,
                        paymentEntity?.email,
                        "—"
                    ),
                    phone: fromAny(
                        flat.customerPhone,
                        customer.phone,
                        flat.phone,
                        snapshotCustomer?.contact,
                        paymentEntity?.contact,
                        "—"
                    ),
                    selectedAddress,
                    cart,
                    isValid: paymentOutcome.isValid,
                    payment_status: paymentOutcome.payment_status,
                    status: paymentOutcome.status,
                    isDeleted: !!flat.isDeleted,
                    source: "payments_table",
                    collection: "payments",
                    createdAt: flat.createdAt,
                    updatedAt: flat.updatedAt,
                    hasWebhook: false,
                    webhookEvent: null,
                    webhookReceivedAt: null,
                };
            });

            const allOrders = paymentOrders;

            const orderIdMap = new Map();
            allOrders.forEach((order) => {
                if (order.razorpay_order_id) {
                    orderIdMap.set(String(order.razorpay_order_id).trim(), order);
                }
            });

            const orderIdToWebhookMap = new Map();
            const paymentIdToWebhookMap = new Map();
            webhooksList.forEach((webhook) => {
                const orderId = webhook.razorpay_order_id ? String(webhook.razorpay_order_id).trim() : "";
                const paymentId = webhook.razorpay_payment_id ? String(webhook.razorpay_payment_id).trim() : "";
                const eventType = normalizeEventType(webhook.event_type);
                if (
                    eventType === "payment.captured" ||
                    eventType === "payment.authorized" ||
                    eventType === "order.paid" ||
                    eventType === "payment.failed"
                ) {
                    if (orderId) {
                        const prev = orderIdToWebhookMap.get(orderId);
                        if (
                            !prev ||
                            webhookOutcomeRank(webhook.event_type) > webhookOutcomeRank(prev.event_type)
                        ) {
                            orderIdToWebhookMap.set(orderId, webhook);
                        }
                    }
                }
                if (paymentId) {
                    paymentIdToWebhookMap.set(paymentId, webhook);
                }
            });

            allOrders.forEach((order) => {
                const orderId = String(order.razorpay_order_id || "").trim();
                const paymentId = String(order.razorpay_payment_id || "").trim();
                const webhook =
                    orderIdToWebhookMap.get(orderId) ||
                    paymentIdToWebhookMap.get(paymentId) ||
                    null;
                order.hasWebhook = !!webhook;
                order.webhookEvent = webhook?.event_type || null;
                order.webhookReceivedAt = webhook?.createdAt || null;

                // Backfill customer/order details from webhook payload when payments payload is sparse.
                const p = webhook?.payment_entity || {};
                if ((!order.email || order.email === "—") && p.email) order.email = p.email;
                if ((!order.phone || order.phone === "—") && p.contact) order.phone = p.contact;
                if ((!order.name || order.name === "—") && p.notes?.name) order.name = p.notes.name;
                if ((!order.name || order.name === "—") && p.name) order.name = p.name;
                if ((!order.name || order.name === "—") && order.selectedAddress?.name) {
                    order.name = order.selectedAddress.name;
                }
                if ((!order.name || order.name === "—") && order.email && order.email !== "—") {
                    const derived = nameFromEmail(order.email);
                    if (derived) order.name = derived;
                }
                if ((!order.amount || order.amount === 0) && p.amount) order.amount = Number(p.amount);
                if ((!order.razorpay_order_id || order.razorpay_order_id === "—") && p.order_id) {
                    order.razorpay_order_id = p.order_id;
                }
                if ((!order.razorpay_payment_id || order.razorpay_payment_id === "—") && p.id) {
                    order.razorpay_payment_id = p.id;
                }

                // Imported paid rows may not have a mirrored webhook row in DB.
                // Show a consistent webhook badge for paid state in that case.
                if (!order.hasWebhook) {
                    const paidLike =
                        order.isValid ||
                        order.payment_status === "captured" ||
                        order.status === "success";
                    if (paidLike) {
                        order.hasWebhook = true;
                        order.webhookEvent = "order.paid";
                    }
                }
            });

            for (let i = 0; i < allOrders.length; i++) {
                allOrders[i] = reconcileOrderOutcomeFromRazorpayWebhooks(allOrders[i], webhooksList);
            }

            const missingOrders = [];
            orderIdToWebhookMap.forEach((webhook, orderId) => {
                if (!orderIdMap.has(orderId)) {
                    const paymentEntity = webhook?.payload_json?.payload?.payment?.entity || {};
                    const eventType = normalizeEventType(webhook.event_type);

                    let paymentStatus = "pending";
                    if (eventType === "payment.captured" || eventType === "order.paid") paymentStatus = "captured";
                    else if (eventType === "payment.failed") paymentStatus = "failed";
                    else if (eventType === "payment.authorized") paymentStatus = "authorized";

                    missingOrders.push({
                        id: webhook.id,
                        razorpay_order_id: orderId,
                        razorpay_payment_id: webhook.razorpay_payment_id || paymentEntity?.id || webhook.id,
                        event_type: webhook.event_type,
                        webhookReceivedAt: webhook.createdAt,
                        payload: webhook.payload_json,
                        status: "missing_order",
                        payment_status: paymentStatus,
                        collection: "webhook_only",
                        source: "razorpay_webhooks_table",
                        name: paymentEntity?.notes?.name || "—",
                        email: paymentEntity?.email || "—",
                        phone: paymentEntity?.contact || "—",
                        amount: Number(paymentEntity?.amount || 0),
                        cart: [],
                        selectedAddress: {},
                    });
                }
            });

            const finalOrders = [...allOrders, ...missingOrders];
            finalOrders.sort((a, b) => {
                const dateA = toDateValue(a.createdAt || a.webhookReceivedAt);
                const dateB = toDateValue(b.createdAt || b.webhookReceivedAt);
                return dateB - dateA;
            });

            const activeOrders = [];
            const trashOrders = [];

            finalOrders.forEach(order => {
                if (order.isDeleted || order.status === 'deleted') {
                    trashOrders.push(order);
                } else if (order.status === "missing_order") {
                    // Keep missing webhook-only records out of admin list/stats.
                    // Live DB data remains untouched; this only controls visibility.
                    return;
                } else {
                    activeOrders.push(order);
                }
            });

            setOrders(activeOrders);
            setTrashOrdersState(trashOrders);

            const paidOrders = activeOrders.filter(o =>
                o.isValid || o.payment_status === "captured" || o.status === "success"
            );
            const failedOrders = activeOrders.filter(o =>
                o.payment_status === "failed" || o.status === "failed"
            );
            const pendingOrders = activeOrders.filter(o =>
                !paidOrders.includes(o) && !failedOrders.includes(o)
            );

            const newStats = {
                totalOrders: activeOrders.length,
                paidOrders: paidOrders.length,
                pendingOrders: pendingOrders.length,
                failedOrders: failedOrders.length,
                missingOrders: 0,
                trashOrders: trashOrders.length,
            };

            setOrders(activeOrders);
            setTrashOrdersState(trashOrders);
            setStats(newStats);

            // Update global shared memory cache
            ordersStore.orders = activeOrders;
            ordersStore.trashOrders = trashOrders;
            ordersStore.webhooks = webhooksList;
            ordersStore.stats = newStats;
            ordersStore.hasLoadedOnce = true;
            ordersStore.lastFetchedAt = Date.now();

            // Save to sessionStorage for fast subsequent reloads
            try {
                if (typeof window !== "undefined") {
                    sessionStorage.setItem("franch_admin_orders_cache_v2", JSON.stringify({
                        orders: activeOrders.slice(0, 300),
                        stats: newStats,
                        trashOrders: trashOrders.slice(0, 50),
                        webhooks: webhooksList.slice(0, 100),
                        timestamp: Date.now(),
                    }));
                }
            } catch (_) {}

            // Notify all listening components
            ordersStore.listeners.forEach((cb) => {
                try {
                    cb(ordersStore);
                } catch (_) {}
            });

        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            ordersStore.activePromise = null;
            setLoading(false);
        }
        })();

        return ordersStore.activePromise;
    };

    useEffect(() => {
        const listener = (store) => {
            setOrders(store.orders);
            setTrashOrdersState(store.trashOrders);
            setWebhooks(store.webhooks);
            setStats(store.stats);
            setLoading(false);
        };
        ordersStore.listeners.add(listener);

        // Fetch immediately if never loaded, or if data is older than 15 seconds
        const isStale = !ordersStore.hasLoadedOnce || (Date.now() - ordersStore.lastFetchedAt > 15000);
        if (isStale) {
            fetchAllData(ordersStore.hasLoadedOnce);
        }

        const interval = setInterval(() => {
            fetchAllData(true);
        }, 30000);

        return () => {
            ordersStore.listeners.delete(listener);
            clearInterval(interval);
        };
    }, []);

    return {
        orders,
        webhooks,
        initiations,
        loading,
        stats,
        trashOrders: trashOrdersState,
        refreshOrders: () => fetchAllData(false)
    };
};
