import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
    Search,
    Truck,
    CheckCircle2,
    Clock,
    Package,
    MapPin,
    Phone,
    Mail,
    ExternalLink,
    FileText,
    Copy,
    Share2,
    RefreshCw,
    Send,
    AlertCircle,
    User,
    ArrowLeft,
    Check,
    Calendar,
    IndianRupee,
    X,
    Printer
} from "lucide-react";
import { useRazorpayOrdersComplete } from "../../hooks/useRazorpayOrdersComplete";
import DelhiveryLiveTracking from "../../components/orders/DelhiveryLiveTracking";
import { isDisplayPaid } from "../../lib/razorpayOrderStatus";
import { fulfillmentLabel, normalizeFulfillmentStatus } from "../../utils/fulfillmentStatus";
import { phpApi } from "../../lib/phpApi";
import Invoice from "../InvoiceRazorpay";
import { toWords } from "number-to-words";
import { getProductCoverImage } from "../../utils/productImages";

function formatTimestamp(value) {
    if (!value) return "—";
    if (value?.toDate && typeof value.toDate === "function") {
        return value.toDate().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    }
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function getCatalogMrp(item) {
    if (!item) return 0;
    let directMrp = Number(item.mrp ?? item.originalPrice ?? item.original_price ?? item.delPrize ?? 0);
    if (directMrp > 1000) directMrp = directMrp / 100;

    const titleLower = String(item.title || item.name || "").toLowerCase();
    const skuLower = String(item.sku || item.itemCode || item.id || "").toLowerCase();

    // Detect known obsolete/incorrect hardcoded MRP values stored in older carts/orders
    const isLegacyIncorrect = (
        (directMrp === 65 || directMrp === 195 || directMrp === 325) && (titleLower.includes("soap") || skuLower.includes("soap"))
    ) || (
        (directMrp === 750 || directMrp === 1450) && (titleLower.includes("omega") || skuLower.includes("omega"))
    ) || (
        (directMrp === 300 || directMrp === 580) && (titleLower.includes("orthovin") || skuLower.includes("orthovin"))
    ) || (
        directMrp === 250 && (titleLower.includes("oil") || skuLower.includes("oil")) && !titleLower.includes("200")
    );

    if (directMrp > 0 && !isLegacyIncorrect) {
        return directMrp;
    }

    // Complete 4-in-1 Wellness Kit: MRP ₹1060 (Oil 220 + Orthovin 210 + OG-3 450 + Soap 3-pack 180)
    if (titleLower.includes("complete") || skuLower.includes("holistic") || titleLower.includes("wellness kit")) {
        return 1060;
    }
    // Ultimate Joint & Mobility Duo: 100ml+100ml Kit MRP ₹430 (220+210), 200ml Jumbo Kit MRP ₹870 (480+390)
    if (titleLower.includes("duo") || titleLower.includes("mobility") || skuLower.includes("pain-duo")) {
        if (titleLower.includes("200") || titleLower.includes("jumbo")) return 870;
        return 430;
    }
    // Franch Ayurveda Clear Skin Soap: Single 100g Bar MRP ₹60 (4 soaps = ₹240), Pack of 3 MRP ₹180, Pack of 5 MRP ₹300
    if (titleLower.includes("soap") || skuLower.includes("soap")) {
        if (titleLower.includes("pack of 5") || titleLower.includes("500g")) return 300;
        if (titleLower.includes("pack of 3") || titleLower.includes("300g")) return 180;
        return 60; // Single 100g Bar MRP is ₹60 (4 soaps = ₹240)
    }
    // Franch OG-3 Veg Omega-3: 60 Veg Caps MRP ₹450, Pack of 2 (120 Caps) MRP ₹900
    if (titleLower.includes("omega") || skuLower.includes("omega")) {
        if (titleLower.includes("120") || titleLower.includes("pack of 2")) return 900;
        return 450;
    }
    // Franch Orthovin Thailam: 100ml MRP ₹210, 200ml MRP ₹390
    if (titleLower.includes("orthovin") || skuLower.includes("orthovin")) {
        if (titleLower.includes("200")) return 390;
        return 210;
    }
    // Franch Oil NH* Plus: 50ml MRP ₹130, 100ml MRP ₹220, 200ml MRP ₹480, Pack of 2 MRP ₹440
    if (titleLower.includes("oil") || skuLower.includes("oil")) {
        if (titleLower.includes("pack of 2") || skuLower.includes("pack-of-2")) return 440;
        if (titleLower.includes("200")) return 480;
        if (titleLower.includes("50")) return 130;
        return 220; // Franch Oil NH* Plus 100ml Real MRP is ₹220
    }

    const p = Number(item.price ?? item.offer_price ?? 0);
    return p > 1000 ? p / 100 : p;
}

export default function AdminOrderTracking() {
    const [searchParams, setSearchParams] = useSearchParams();
    const targetIdFromUrl = searchParams.get("id") || "";

    const { orders, loading, refreshOrders } = useRazorpayOrdersComplete();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedOrderId, setSelectedOrderId] = useState(targetIdFromUrl);
    const [copied, setCopied] = useState(false);
    const [emailResending, setEmailResending] = useState(false);
    const [emailFeedback, setEmailFeedback] = useState(null);
    const [invoiceDataPdf, setInvoiceDataPdf] = useState(null);

    // Close invoice modal on Escape key
    useEffect(() => {
        if (!invoiceDataPdf) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setInvoiceDataPdf(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [invoiceDataPdf]);

    // Paid orders sorted by date descending
    const paidOrders = useMemo(() => {
        return orders.filter(o => isDisplayPaid(o));
    }, [orders]);

    // Sequential invoice calculator matching OrdersTable
    const getInvoiceNumber = (order) => {
        if (!order || !isDisplayPaid(order)) return null;

        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() :
            (order.createdAt ? new Date(order.createdAt) : new Date(0));

        const invoiceResetStart = new Date("2026-06-02T00:00:00+05:30");
        if (orderDate >= invoiceResetStart) {
            const resetSeriesOrders = paidOrders.filter((o) => {
                const d = o.createdAt?.toDate ? o.createdAt.toDate() :
                    (o.createdAt ? new Date(o.createdAt) : new Date(0));
                return d >= invoiceResetStart;
            });
            const resetIndex = resetSeriesOrders.findIndex((o) =>
                o.razorpay_order_id === order.razorpay_order_id || o.id === order.id
            );
            if (resetIndex === -1) return null;
            const num = 105 + resetIndex;
            return {
                prefix: "FM2627",
                number: num,
                formatted: "FM2627" + String(num).padStart(4, "0"),
            };
        }

        const fy2627Start = new Date('2026-04-01T00:00:00+05:30');
        const isFY2627 = orderDate >= fy2627Start;
        const relevantOrders = paidOrders.filter(o => {
            const d = o.createdAt?.toDate ? o.createdAt.toDate() :
                (o.createdAt ? new Date(o.createdAt) : new Date(0));
            return isFY2627 ? d >= fy2627Start : d < fy2627Start;
        });
        const yearIndex = relevantOrders.findIndex(o =>
            o.razorpay_order_id === order.razorpay_order_id || o.id === order.id
        );
        if (yearIndex === -1) return null;
        if (isFY2627) {
            const num = 1 + yearIndex;
            return { prefix: "FM2627", number: num, formatted: "FM2627" + String(num).padStart(4, "0") };
        }
        const num = 69 + yearIndex;
        return { prefix: "FM2526", number: num, formatted: "FM2526" + String(num).padStart(4, "0") };
    };

    const isOrderMatch = (o, id) => {
        if (!o || !id) return false;
        const target = String(id).trim();
        return (
            String(o.id || "") === target ||
            String(o.dbPaymentId || "") === target ||
            String(o.paymentId || "") === target ||
            String(o.razorpay_order_id || "") === target ||
            String(o.razorpay_payment_id || "") === target
        );
    };

    // Filtered orders list
    const filteredOrders = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return orders.filter(order => {
            const customerName = (order.name || order.userName || order.selectedAddress?.name || "").toLowerCase();
            const email = (order.email || order.userEmail || "").toLowerCase();
            const phone = String(order.phone || order.userPhone || order.selectedAddress?.phone || "");
            const rzpOrderId = String(order.razorpay_order_id || "").toLowerCase();
            const awb = String(order.awbNumber || "").toLowerCase();
            const inv = getInvoiceNumber(order)?.formatted.toLowerCase() || "";

            const matchesQuery = !q ||
                customerName.includes(q) ||
                email.includes(q) ||
                phone.includes(q) ||
                rzpOrderId.includes(q) ||
                awb.includes(q) ||
                inv.includes(q);

            const fulfillment = normalizeFulfillmentStatus(order.fulfillmentStatus || (order.awbNumber ? "shipped" : "placed"));
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "placed" && fulfillment === "placed") ||
                (statusFilter === "shipped" && (fulfillment === "shipped" || fulfillment === "in_transit" || fulfillment === "out_for_delivery")) ||
                (statusFilter === "delivered" && fulfillment === "delivered");

            return matchesQuery && matchesStatus;
        });
    }, [orders, searchQuery, statusFilter, paidOrders]);

    // Set initial selected order
    useEffect(() => {
        if (targetIdFromUrl && orders.length > 0) {
            const match = orders.find(o => isOrderMatch(o, targetIdFromUrl));
            if (match) {
                const id = match.id || match.razorpay_order_id;
                if (id !== selectedOrderId) {
                    setSelectedOrderId(id);
                }
                return;
            }
        }
        if (!selectedOrderId && filteredOrders.length > 0) {
            setSelectedOrderId(filteredOrders[0].id || filteredOrders[0].razorpay_order_id);
        }
    }, [orders, targetIdFromUrl, filteredOrders, selectedOrderId]);

    const selectedOrder = useMemo(() => {
        if (selectedOrderId) {
            const match = orders.find(o => isOrderMatch(o, selectedOrderId));
            if (match) return match;
        }
        if (targetIdFromUrl) {
            const match = orders.find(o => isOrderMatch(o, targetIdFromUrl));
            if (match) return match;
        }
        return filteredOrders[0] || null;
    }, [orders, selectedOrderId, targetIdFromUrl, filteredOrders]);

    const selectOrder = (order) => {
        const id = order.id || order.razorpay_order_id;
        setSelectedOrderId(id);
        setSearchParams({ id });
        setEmailFeedback(null);
    };

    // Customer & address normalized
    const selectedAddress = selectedOrder?.selectedAddress || selectedOrder?.address || {};
    const customerName = selectedOrder?.name || selectedOrder?.userName || selectedAddress?.name || "Customer";
    const customerPhone = String(selectedOrder?.phone || selectedOrder?.userPhone || selectedAddress?.phone || "").replace(/\D/g, "");
    const customerEmail = selectedOrder?.email || selectedOrder?.userEmail || "—";
    const invData = getInvoiceNumber(selectedOrder);
    const invoiceNumber = invData?.formatted || "FM-PENDING";

    const line1 = selectedAddress?.line1 || selectedAddress?.address || "";
    const line2 = selectedAddress?.area || selectedAddress?.line2 || selectedAddress?.street || "";
    const city = selectedAddress?.city || "";
    const state = selectedAddress?.state || "";
    const pincode = selectedAddress?.pincode || selectedAddress?.zipcode || "";
    const fullAddress = [line1, line2, city, state ? `${state} - ${pincode}` : pincode, "India"].filter(Boolean).join(", ");

    // Items list with Real MRP
    const rawItems = selectedOrder?.cart || selectedOrder?.items || selectedOrder?.line_items || [];
    const items = rawItems.map((item, idx) => {
        const rawPrice = Number(item.price ?? item.offer_price ?? 0);
        const price = rawPrice > 1000 ? rawPrice / 100 : rawPrice;
        let mrp = getCatalogMrp(item);
        const qty = Math.max(1, Number(item.qty ?? item.quantity ?? 1));
        const titleLower = String(item.title || item.name || "").toLowerCase();
        const skuLower = String(item.sku || item.itemCode || item.id || "").toLowerCase();
        if ((titleLower.includes("pack of 2") || skuLower.includes("pack-of-2")) && qty >= 2) {
            if (mrp >= 400 && mrp <= 480) mrp = 220;
            else if (mrp >= 800 && mrp <= 1000) mrp = 450;
        }
        return {
            title: item.title || item.name || `Product #${idx + 1}`,
            sku: item.sku || item.itemCode || `SKU_${idx + 1}`,
            imageURL: getProductCoverImage(item),
            qty,
            price,
            mrp,
            totalMrp: mrp * qty,
            totalPaid: price * qty,
        };
    });

    const totalPaid = Number(selectedOrder?.amount ? (selectedOrder.amount > 1000 ? selectedOrder.amount / 100 : selectedOrder.amount) : 0)
        || items.reduce((sum, it) => sum + it.totalPaid, 0);
    const totalMrp = items.reduce((sum, it) => sum + it.totalMrp, 0);
    const totalSavings = Math.max(0, totalMrp - totalPaid);

    const awb = selectedOrder?.awbNumber || "";
    const courierUrl = selectedOrder?.trackingUrl || (awb ? `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}` : "");
    const currentFulfillment = normalizeFulfillmentStatus(selectedOrder?.fulfillmentStatus || (awb ? "shipped" : "placed"));

    const trackingPortalUrl = `https://franchglobal.com/my-orders/${selectedOrder?.id || selectedOrder?.razorpay_order_id || ""}`;

    const handleCopyTrackingLink = () => {
        navigator.clipboard.writeText(trackingPortalUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleResendEmail = async () => {
        const paymentId = Number(selectedOrder?.id || 0);
        if (!paymentId) {
            setEmailFeedback({ type: "error", message: "Cannot send email: internal payment record ID missing." });
            return;
        }
        setEmailResending(true);
        setEmailFeedback(null);
        try {
            const { data } = await phpApi.post(`/api/orders/${paymentId}/resend-email`, {
                status: currentFulfillment
            });
            if (data?.success) {
                setEmailFeedback({ type: "success", message: `Confirmation email sent successfully to ${customerEmail}!` });
            } else {
                setEmailFeedback({ type: "error", message: data?.error || data?.message || "Failed to deliver email" });
            }
        } catch (err) {
            setEmailFeedback({ type: "error", message: err?.response?.data?.error || err?.message || "Failed to trigger email send" });
        } finally {
            setEmailResending(false);
        }
    };

    const handleOpenWhatsAppCustomer = () => {
        if (!customerPhone) return;
        const phoneFormatted = customerPhone.startsWith("91") ? customerPhone : `91${customerPhone}`;
        const message = `Hello ${customerName}, thank you for ordering with Franch Global! 🌿\n\nYour order #${invoiceNumber} is confirmed.\n📦 Courier: Delhivery Express\nAWB: ${awb || "Being assigned"}\n\nTrack your order in real time here:\n${trackingPortalUrl}\n\nFor any help, reply to this message.`;
        window.open(`https://wa.me/${phoneFormatted}?text=${encodeURIComponent(message)}`, "_blank");
    };

    // Print PDF Invoice handler
    const handlePrintInvoice = () => {
        if (!selectedOrder) return;
        const totalAmount = items.reduce((acc, it) => acc + it.price * it.qty, 0);
        const amountInWords = toWords(totalAmount) + " Rupees Only";
        setInvoiceDataPdf({
            ...selectedOrder,
            invoiceNo: invoiceNumber,
            invoiceDate: formatTimestamp(selectedOrder.createdAt),
            amountInWords,
            receiver: {
                name: customerName,
                address: fullAddress,
                city,
                state,
                pincode,
                contact: customerPhone,
                gstin: selectedOrder?.userGST || "—",
            },
            consignee: {
                name: customerName,
                address: fullAddress,
                city,
                state,
                pincode,
                contact: customerPhone,
            },
            items: items.map(it => ({
                name: it.title,
                code: it.sku,
                hsn: "3004",
                unit: it.price,
                qty: it.qty,
                cgstRate: 2.5,
                sgstRate: 2.5,
            })),
            terms: [
                "Seller is not responsible for any loss or damage of goods in transit",
                "Dispute if any will be Subject to Chennai, Tamil Nadu Court Jurisdiction Only",
                "Any inaccuracy in this bill must be notified immediately on its receipt",
                "This is a Computer Generated Invoice"
            ]
        });
    };

    // Stepper definitions
    const STEPS = [
        { key: "placed", label: "Order Placed", desc: "Payment verified & order created" },
        { key: "shipped", label: "Shipped", desc: awb ? `Booked with Delhivery (AWB: ${awb})` : "Packing & pickup scheduled" },
        { key: "in_transit", label: "In Transit", desc: "Package moving in logistics network" },
        { key: "out_for_delivery", label: "Out for Delivery", desc: "Handover to local delivery executive" },
        { key: "delivered", label: "Delivered", desc: "Package safely handed to customer" },
    ];

    const currentStepIndex = STEPS.findIndex(s => s.key === currentFulfillment);
    const activeStepIdx = currentStepIndex >= 0 ? currentStepIndex : (awb ? 1 : 0);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                <Truck className="w-6 h-6" />
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Order Confirmation & Live Tracking
                            </h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                            Real-time customer order verification, Delhivery courier tracking, and instant customer follow-up
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/admin/panel/orders"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to All Orders
                        </Link>
                        <button
                            onClick={refreshOrders}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition shadow-sm"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Main 2-Column Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column: Order Search & Selector List */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                                <input
                                    type="text"
                                    placeholder="Search name, phone, invoice, AWB..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
                                {["all", "placed", "shipped", "delivered"].map(st => (
                                    <button
                                        key={st}
                                        onClick={() => setStatusFilter(st)}
                                        className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                                            statusFilter === st
                                                ? "bg-emerald-700 text-white"
                                                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                                        }`}
                                    >
                                        {st === "all" ? "All" : st}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Orders List */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-700 max-h-[680px] overflow-y-auto">
                            {loading && orders.length === 0 ? (
                                <div className="p-3 space-y-2.5">
                                    {[1, 2, 3, 4, 5, 6].map((n) => (
                                        <div key={n} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 animate-pulse space-y-2">
                                            <div className="flex justify-between items-center">
                                                <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                                                <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-1/5" />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                                            </div>
                                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                                        </div>
                                    ))}
                                </div>
                            ) : filteredOrders.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">
                                    No matching orders found.
                                </div>
                            ) : (
                                filteredOrders.map(order => {
                                    const isSelected = (order.id || order.razorpay_order_id) === (selectedOrder?.id || selectedOrder?.razorpay_order_id);
                                    const inv = getInvoiceNumber(order);
                                    const cust = order.name || order.userName || order.selectedAddress?.name || "Customer";
                                    const amt = Number(order.amount ? (order.amount > 1000 ? order.amount / 100 : order.amount) : 0);
                                    const orderAwb = order.awbNumber || "";
                                    const fulfillment = normalizeFulfillmentStatus(order.fulfillmentStatus || (orderAwb ? "shipped" : "placed"));

                                    return (
                                        <button
                                            key={order.id || order.razorpay_order_id}
                                            onClick={() => selectOrder(order)}
                                            className={`w-full text-left p-4 transition-all flex flex-col gap-1.5 cursor-pointer ${
                                                isSelected
                                                    ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-l-4 border-emerald-600"
                                                    : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[170px]">
                                                    {cust}
                                                </span>
                                                <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                                    ₹{amt.toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                                <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                                                    {inv ? inv.formatted : "Invoice N/A"}
                                                </span>
                                                <span>{formatTimestamp(order.createdAt).split(",")[0]}</span>
                                            </div>

                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                                                    fulfillment === "delivered" ? "bg-emerald-100 text-emerald-800" :
                                                    fulfillment === "shipped" || fulfillment === "in_transit" ? "bg-blue-100 text-blue-800" :
                                                    "bg-amber-100 text-amber-800"
                                                }`}>
                                                    {fulfillmentLabel(fulfillment)}
                                                </span>
                                                {orderAwb && (
                                                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                                        AWB: {orderAwb.slice(-6)}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Column: Order Confirmation Hero & Real-Time Tracking */}
                    <div className="lg:col-span-8 space-y-6">
                        {!selectedOrder ? (
                            loading && orders.length === 0 ? (
                                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm animate-pulse space-y-5">
                                    <div className="h-28 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                                    <div className="grid grid-cols-5 gap-3">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-700/50 rounded-xl" />
                                        ))}
                                    </div>
                                    <div className="h-44 bg-slate-100 dark:bg-slate-700/50 rounded-2xl" />
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-slate-500">
                                    Please select an order from the left to view confirmation & live tracking.
                                </div>
                            )
                        ) : (
                            <>
                                {/* Hero Order Confirmed Banner */}
                                <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-green-900 text-white p-6 sm:p-7 rounded-2xl shadow-lg relative overflow-hidden">
                                    <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-8 translate-y-8">
                                        <Truck className="w-64 h-64 text-white" />
                                    </div>

                                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-2.5">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Order Confirmed & Paid
                                            </div>
                                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                                                Invoice #{invoiceNumber}
                                            </h2>
                                            <p className="text-emerald-100 text-xs sm:text-sm mt-1">
                                                Payment ID: <span className="font-mono font-bold text-white">{selectedOrder.razorpay_payment_id || selectedOrder.id}</span>
                                                {" • "}
                                                Placed on {formatTimestamp(selectedOrder.createdAt)}
                                            </p>
                                        </div>

                                        <div className="text-left sm:text-right bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-xl border border-white/20">
                                            <span className="text-xs uppercase font-bold text-emerald-200 block">Total Amount Paid</span>
                                            <span className="text-2xl sm:text-3xl font-extrabold text-white">
                                                ₹{totalPaid.toFixed(2)}
                                            </span>
                                            <span className="text-[11px] text-emerald-200 block mt-0.5">Prepaid via Razorpay</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Stepper Progress */}
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-5">
                                        Order Fulfillment Journey
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                                        {STEPS.map((step, idx) => {
                                            const isDone = idx <= activeStepIdx;
                                            const isCurrent = idx === activeStepIdx;

                                            return (
                                                <div
                                                    key={step.key}
                                                    className={`p-3.5 rounded-xl border transition-all ${
                                                        isCurrent
                                                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm"
                                                            : isDone
                                                            ? "bg-slate-50 dark:bg-slate-900 border-emerald-200 dark:border-emerald-800"
                                                            : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-50"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                                            isDone ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                                                        }`}>
                                                            {isDone ? "✓" : idx + 1}
                                                        </span>
                                                        <span className={`font-bold text-xs ${isCurrent ? "text-emerald-800 dark:text-emerald-300" : "text-slate-800 dark:text-slate-200"}`}>
                                                            {step.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                                                        {step.desc}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Delhivery Courier Tracking Banner & Live Scans */}
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Truck className="w-5 h-5 text-blue-600" />
                                                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                                                    Delhivery Express Shipment
                                                </h3>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Official courier partner for Franch Global doorstep delivery
                                            </p>
                                        </div>

                                        {awb ? (
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm font-bold bg-blue-50 text-blue-800 px-3 py-1.5 rounded-lg border border-blue-200">
                                                    AWB: {awb}
                                                </span>
                                                <a
                                                    href={courierUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition"
                                                >
                                                    Track on Delhivery
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        ) : (
                                            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                                                AWB Pending (Not yet dispatched)
                                            </span>
                                        )}
                                    </div>

                                    {/* Embedded Live Delhivery Scan Journey */}
                                    {awb ? (
                                        <div className="pt-2">
                                            <DelhiveryLiveTracking waybill={awb} />
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500 py-3 text-center">
                                            Once you click <strong>"Ship via Delhivery"</strong> in View Orders, the live tracking checkpoint scans will appear here automatically.
                                        </p>
                                    )}
                                </div>

                                {/* Customer Details & Delivery Address */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* Customer Contact */}
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                            <User className="w-4 h-4 text-emerald-600" />
                                            Customer Information
                                        </h3>

                                        <div>
                                            <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                                                {customerName}
                                            </p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                                                <Mail className="w-3.5 h-3.5" />
                                                {customerEmail}
                                            </p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-mono">
                                                <Phone className="w-3.5 h-3.5" />
                                                +91 {customerPhone || "N/A"}
                                            </p>
                                        </div>

                                        {/* Action buttons to contact customer */}
                                        <div className="flex items-center gap-2 pt-2">
                                            {customerPhone && (
                                                <>
                                                    <button
                                                        onClick={handleOpenWhatsAppCustomer}
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-green-600 hover:bg-green-700 transition cursor-pointer shadow-sm"
                                                    >
                                                        <Share2 className="w-3.5 h-3.5" />
                                                        WhatsApp Customer
                                                    </button>
                                                    <a
                                                        href={`tel:${customerPhone}`}
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 transition"
                                                    >
                                                        <Phone className="w-3.5 h-3.5" />
                                                        Call
                                                    </a>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Shipping Address with Full Landmark */}
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4 text-emerald-600" />
                                            Complete Delivery Address
                                        </h3>

                                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                            <p className="font-bold text-slate-900 dark:text-white mb-1">{customerName}</p>
                                            <p>{line1}</p>
                                            {line2 && <p className="font-semibold text-emerald-800 dark:text-emerald-300 mt-0.5">{line2}</p>}
                                            <p className="mt-1">{city}{state ? `, ${state}` : ""}</p>
                                            <p className="font-mono font-bold mt-1">PIN: {pincode}</p>
                                            <p className="text-slate-400 text-[11px] mt-1">Phone: {customerPhone}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items Table with Real MRP */}
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                                            Ordered Items ({items.length})
                                        </h3>
                                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-md">
                                            Customer Saved ₹{totalSavings.toFixed(2)} off MRP
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200 dark:border-slate-700">
                                                <tr>
                                                    <th className="py-2.5 px-3">Product Name</th>
                                                    <th className="py-2.5 px-3 text-center">Qty</th>
                                                    <th className="py-2.5 px-3 text-right">Real MRP</th>
                                                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                                                    <th className="py-2.5 px-3 text-right">Line Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                {items.map((it, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                                                        <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                                                            <div className="flex items-center gap-2.5">
                                                                <img
                                                                    src={it.imageURL || getProductCoverImage(it)}
                                                                    alt={it.title}
                                                                    onError={(e) => {
                                                                        const fallback = getProductCoverImage(it);
                                                                        if (e.currentTarget.src !== fallback) {
                                                                            e.currentTarget.src = fallback;
                                                                        }
                                                                    }}
                                                                    className="w-9 h-9 rounded-lg object-contain bg-slate-50 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 shrink-0"
                                                                />
                                                                <div>
                                                                    <span>{it.title}</span>
                                                                    <span className="block font-mono text-[10px] text-slate-400 mt-0.5">{it.sku}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3 text-center font-bold">{it.qty}</td>
                                                        <td className="py-3 px-3 text-right text-slate-400 line-through">₹{it.mrp.toFixed(2)}</td>
                                                        <td className="py-3 px-3 text-right font-semibold">₹{it.price.toFixed(2)}</td>
                                                        <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">₹{it.totalPaid.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="border-t-2 border-slate-200 dark:border-slate-700 font-bold">
                                                <tr>
                                                    <td colSpan={2} className="py-3 px-3 text-slate-600 dark:text-slate-300">Total Declared MRP</td>
                                                    <td className="py-3 px-3 text-right text-slate-500 line-through">₹{totalMrp.toFixed(2)}</td>
                                                    <td className="py-3 px-3 text-right text-slate-800 dark:text-slate-200">Paid Amount</td>
                                                    <td className="py-3 px-3 text-right text-base text-emerald-700 dark:text-emerald-400">₹{totalPaid.toFixed(2)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* Admin Action Toolbar */}
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Client Tools & Follow-Up Actions
                                    </h3>

                                    <div className="flex flex-wrap items-center gap-3">
                                        {/* Print Invoice PDF */}
                                        <button
                                            onClick={handlePrintInvoice}
                                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition shadow-sm cursor-pointer"
                                        >
                                            <FileText className="w-4 h-4 text-emerald-400" />
                                            Print Invoice PDF
                                        </button>

                                        {/* Copy Public Customer Link */}
                                        <button
                                            onClick={handleCopyTrackingLink}
                                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 transition cursor-pointer"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                            {copied ? "Link Copied!" : "Copy Customer Tracking Link"}
                                        </button>

                                        {/* Resend Confirmation Email */}
                                        <button
                                            onClick={handleResendEmail}
                                            disabled={emailResending}
                                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 transition cursor-pointer border border-emerald-200 dark:border-emerald-800"
                                        >
                                            <Send className={`w-4 h-4 ${emailResending ? "animate-spin" : ""}`} />
                                            {emailResending ? "Sending..." : "Resend Confirmation Email"}
                                        </button>
                                    </div>

                                    {/* Email feedback alert */}
                                    {emailFeedback && (
                                        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                                            emailFeedback.type === "success"
                                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                                : "bg-red-50 text-red-800 border border-red-200"
                                        }`}>
                                            {emailFeedback.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                                            {emailFeedback.message}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Printable Invoice Modal if clicked */}
                {invoiceDataPdf !== null && (
                    <div
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
                        onClick={() => setInvoiceDataPdf(null)}
                    >
                        <div
                            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 shrink-0">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-emerald-600" />
                                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                                        Invoice Preview {invoiceDataPdf.invoiceNo ? `(${invoiceDataPdf.invoiceNo})` : ""}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            document.head.querySelector("title").textContent = invoiceDataPdf.invoiceNo || "Invoice";
                                            window.print();
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer shadow-sm"
                                    >
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>Print</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setInvoiceDataPdf(null)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-red-600 hover:text-white text-slate-700 dark:bg-slate-700 dark:text-slate-200 transition cursor-pointer"
                                        title="Close Invoice (Esc)"
                                    >
                                        <X className="w-4 h-4" />
                                        <span>Close</span>
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="overflow-y-auto p-4 sm:p-6 flex-1 bg-white">
                                <Invoice orderData={invoiceDataPdf} edit={false} />
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
