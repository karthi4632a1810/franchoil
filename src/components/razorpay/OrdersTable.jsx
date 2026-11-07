import { useState, useMemo, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye, ChevronDown, ChevronUp, FileText, Truck, Plus, User, Mail, CheckCircle2, AlertCircle, Loader2, Trash2, RefreshCcw, Edit, XCircle, X, Printer, Save } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ExpandedPaymentDetails } from "./ExpandedPaymentDetails";
import { AddOrderModal } from "./AddOrderModal";
import Invoice from "../../pages/InvoiceRazorpay";
import MaskImage from "../../tools/MaskImage";
import { toWords } from "number-to-words";
import { firestore as db } from "../../firebase/config";
import { doc, setDoc, serverTimestamp, updateDoc, deleteDoc } from "firebase/firestore";
import { phpApi, phpRoutes } from "../../lib/phpApi";
import Toast from "../../components/Toast";
import { isDisplayFailed, isDisplayPaid } from "../../lib/razorpayOrderStatus";
import { SHIPROCKET_PACKAGE } from "../../utils/shiprocketPackageDefaults"; // package dimensions still used for Delhivery payload

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const CAPTURE_PAYMENT_URL = `${API_BASE_URL}/api/payments/razorpay/capture`;

export function OrdersTable({ orders, allOrders = [], onOrderAdded, isTrash = false }) {
    const [openId, setOpenId] = useState(null);
    const [invoiceData, setInvoiceData] = useState(null);
    const [invoiceDataEdit, setInvoiceDataEdit] = useState(false);
    const [shiprocketLoading, setShiprocketLoading] = useState({});
    const [captureLoading, setCaptureLoading] = useState({});
    const [showAddOrderModal, setShowAddOrderModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [actionLoading, setActionLoading] = useState({});
    const [toast, setToast] = useState(null); // { message, type }
    const [autoDispatchEnabled, setAutoDispatchEnabled] = useState(false);
    const [autoDispatchLoading, setAutoDispatchLoading] = useState(false);

    // Close invoice popup on Escape key press
    useEffect(() => {
        if (!invoiceData) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setInvoiceData(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [invoiceData]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const { data } = await phpApi.get(phpRoutes.delhiveryAutoDispatchSetting);
                if (mounted && data?.success) {
                    setAutoDispatchEnabled(Boolean(data.enabled));
                }
            } catch (e) {
                console.warn("Could not load Delhivery auto-dispatch setting:", e);
            }
        })();
        return () => { mounted = false; };
    }, []);

    const handleToggleAutoDispatch = async () => {
        const nextVal = !autoDispatchEnabled;
        const confirmMsg = nextVal
            ? "Enable Automatic Delhivery Dispatch on Purchase?\n\nWhen enabled, every new paid order will be automatically booked with Delhivery immediately upon purchase."
            : "Stop Automatic Delhivery Dispatch on Purchase?\n\nWhen stopped, new orders will remain in 'Placed' status without automatically booking Delhivery. You can review and manually click 'Auto-Dispatch with Delhivery' on any order whenever you are ready to ship.";
        if (!window.confirm(confirmMsg)) return;

        setAutoDispatchLoading(true);
        try {
            const { data } = await phpApi.post(phpRoutes.delhiveryAutoDispatchSetting, {
                enabled: nextVal,
            });
            if (data?.success) {
                setAutoDispatchEnabled(Boolean(data.enabled));
                showToast(data.message || (nextVal ? "Auto-dispatch enabled" : "Auto-dispatch stopped"), "success");
            } else {
                alert(data?.error || "Failed to update setting");
            }
        } catch (e) {
            alert(e?.response?.data?.error || e?.message || "Failed to update setting");
        } finally {
            setAutoDispatchLoading(false);
        }
    };

    const showToast = (message, type = "success") => setToast({ message, type });

    // Toggle edit mode
    const toggleEditMode = () => setEditMode(prev => !prev);

    // ... (keep existing useMemos and functions) ...

    const handleTrash = async (order) => {
        if (!confirm("Are you sure you want to move this order to Trash?")) return;
        const loadingId = order.id;
        setActionLoading(prev => ({ ...prev, [loadingId]: true }));
        try {
            // If it's a webhook-only missing order, we need to create a doc in 'orders' to mark it as deleted
            const orderId = String(order.razorpay_order_id).trim();
            const docRef = doc(db, "orders", orderId);

            if (order.collection === "webhook_only") {
                await setDoc(docRef, {
                    razorpay_order_id: orderId,
                    razorpay_payment_id: order.razorpay_payment_id || null,
                    isDeleted: true,
                    status: "missing_order", // Keep it as missing so it doesn't become 'paid' automatically
                    createdAt: serverTimestamp(),
                    // Save metadata so we can identify it later
                    amount: order.amount || 0,
                    name: order.name || "",
                    email: order.email || "",
                    phone: order.phone || "",
                }, { merge: true });
            } else {
                // If it's an existing order (orders or payments collection)
                // Note: 'payments' collection is old, better to not touch it or move to 'orders'
                // But for simplicity, we assume we can write to 'orders' to override/mask it or update if it's in 'orders'
                if (order.collection === "payments") {
                    await updateDoc(doc(db, "payments", order.id), { isDeleted: true });
                } else {
                    await updateDoc(docRef, { isDeleted: true });
                }
            }
            onOrderAdded?.();
        } catch (error) {
            console.error("Trash error:", error);
            alert("Failed to move to trash: " + error.message);
        } finally {
            setActionLoading(prev => ({ ...prev, [loadingId]: false }));
        }
    };

    const handleRestore = async (order) => {
        if (!confirm("Are you sure you want to restore this order?")) return;
        const loadingId = order.id;
        setActionLoading(prev => ({ ...prev, [loadingId]: true }));
        try {
            // For restored items, we simply set isDeleted: false
            // If it was in 'payments'
            if (order.collection === "payments") {
                await updateDoc(doc(db, "payments", order.id), { isDeleted: false });
            } else {
                await updateDoc(doc(db, "orders", order.razorpay_order_id || order.id), { isDeleted: false });
            }
            onOrderAdded?.();
        } catch (error) {
            console.error("Restore error:", error);
            alert("Failed to restore: " + error.message);
        } finally {
            setActionLoading(prev => ({ ...prev, [loadingId]: false }));
        }
    };

    const handleStatusChange = async (order, newStatus, newPaymentStatus) => {
        if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
        const loadingId = order.id;
        setActionLoading(prev => ({ ...prev, [loadingId]: true }));
        try {
            const orderId = order.razorpay_order_id;
            const docRef = doc(db, "orders", orderId);

            // If manual move from other status
            await setDoc(docRef, {
                status: newStatus,
                payment_status: newPaymentStatus,
                updatedAt: serverTimestamp()
            }, { merge: true });

            onOrderAdded?.();
        } catch (error) {
            console.error("Status change error:", error);
            alert("Failed to change status: " + error.message);
        } finally {
            setActionLoading(prev => ({ ...prev, [loadingId]: false }));
        }
    };
    const paidOrders = useMemo(() => {
        // Use allOrders to ensure invoice numbers are consistent regardless of filters
        return allOrders
            .filter(order => isDisplayPaid(order))
            .sort((a, b) => {
                // Match old Firebase behavior: strictly sort by created date ascending.
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() :
                    (a.createdAt ? new Date(a.createdAt) : new Date(0));
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() :
                    (b.createdAt ? new Date(b.createdAt) : new Date(0));
                return dateA - dateB;
            });
    }, [allOrders]);

    // Get invoice number for a paid order (only paid orders get invoice numbers)
    const getInvoiceNumber = useCallback((order) => {
        if (!isDisplayPaid(order)) {
            return null;
        }

        const paidIndex = paidOrders.findIndex(o =>
            o.razorpay_order_id === order.razorpay_order_id || o.id === order.id
        );

        if (paidIndex === -1) return null;

        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() :
            (order.createdAt ? new Date(order.createdAt) : new Date(0));

        // Invoice reset requested: from 2 Jun 2026 start FM26270105.
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

        // FY 26-27 starts April 1, 2026 (legacy behavior for pre-reset orders).
        const fy2627Start = new Date('2026-04-01T00:00:00+05:30');
        const isFY2627 = orderDate >= fy2627Start;

        const relevantOrders = paidOrders.filter(o => {
            const d = o.createdAt?.toDate ? o.createdAt.toDate() :
                (o.createdAt ? new Date(o.createdAt) : new Date(0));
            return isFY2627 ? d >= fy2627Start : d < fy2627Start;
        });

        // Current order index in the relevant financial year list
        const yearIndex = relevantOrders.findIndex(o =>
            o.razorpay_order_id === order.razorpay_order_id || o.id === order.id
        );

        if (yearIndex === -1) return null;

        if (isFY2627) {
            const num = 1 + yearIndex;
            return {
                prefix: "FM2627",
                number: num,
                formatted: "FM2627" + String(num).padStart(4, "0")
            };
        } else {
            const num = 69 + yearIndex;
            return {
                prefix: "FM2526",
                number: num,
                formatted: "FM2526" + String(num).padStart(4, "0")
            };
        }
    }, [paidOrders]);

    function invoiceEdit() {
        setInvoiceDataEdit(prev => prev ? false : true)
    }
    function formatNumber(num, length = 4) {
        return String(num).padStart(length, "0");
    }

    function toTitleCase(str) {
        return str
            .toLowerCase()
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }
    const parseOrderDate = (timestamp) => {
        if (!timestamp) return null;
        if (timestamp && typeof timestamp.toDate === "function") return timestamp.toDate();
        if (typeof timestamp === "number") return new Date(timestamp * 1000);
        if (typeof timestamp === "object" && timestamp._seconds) {
            return new Date(Number(timestamp._seconds) * 1000);
        }
        if (typeof timestamp === "string") {
            const normalized = timestamp.includes(" ") ? timestamp.replace(" ", "T") : timestamp;
            const d = new Date(normalized);
            if (!Number.isNaN(d.getTime())) return d;
        }
        const d = new Date(timestamp);
        return Number.isNaN(d.getTime()) ? null : d;
    };

    const formatTimestampToDDMMYYYY = (timestamp) => {
        try {
            const date = parseOrderDate(timestamp);
            if (!date || Number.isNaN(date.getTime())) {
                throw new Error("Invalid date");
            }

            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
            const year = date.getFullYear();

            return `${day}.${month}.${year}`;
        } catch (error) {
            console.error("Error formatting timestamp:", error.message);
            return null;
        }
    };


    const getNormalizedOrderItems = (order) => {
        const normalize = (list) => {
            if (!Array.isArray(list)) return [];
            return list.map((item, idx) => {
                const rawPrice = Number(item?.price ?? item?.offer_price ?? 0);
                const price = rawPrice > 1000 ? rawPrice / 100 : rawPrice;
                return {
                    id: item?.id || item?.sku || item?.reference_id || `item_${idx}`,
                    code: item?.itemCode || item?.sku || item?.reference_id || "",
                    name: item?.title || item?.name || "Item",
                    hsn: item?.hsn || "30039011",
                    unit: price,
                    qty: Number(item?.qty || item?.quantity || 1),
                };
            });
        };

        const sources = [order?.cart, order?.items, order?.line_items];
        for (const source of sources) {
            const parsed = normalize(source);
            if (parsed.length > 0) return parsed;
        }
        return [];
    };

    function handlePrintPdf(order, index) {
        // console.log("Generating invoice for order:", order);
        const orderItems = getNormalizedOrderItems(order);

        const itemDetails = orderItems.map(item => ({
            code: item.code,
            name: item.name,
            hsn: item.hsn,
            unit: item.unit,
            qty: item.qty,
            taxable: (item.unit / 1.05).toFixed(2),
            cgstRate: "2.5",
            cgstAmount: ((item.unit / 1.05) * 0.025 * item.qty).toFixed(2),
            sgstRate: "2.5",
            sgstAmount: ((item.unit / 1.05) * 0.025 * item.qty).toFixed(2),
            igstRate: "0",
            igstAmount: "0",
            totalAmount: (item.unit * item.qty).toFixed(2),
        }));

        const customer = order?.customer || {};
        const address = order?.selectedAddress || order?.address || {};
        const name = customer?.name || order?.name || order?.userName || "Unknown";
        const phone = customer?.phone || order?.phone || order?.userPhone || "Unknown";

        const receiver = {
            name: name,
            address: `${address?.line1 || address?.address || ""} ${address?.street || ""} ${address?.area || address?.line2 || ""}`.trim(),
            city: address?.city || "Unknown",
            state: address?.state || "Unknown",
            pincode: address?.pincode || "Unknown",
            contact: phone,
            gstin: order?.userGST || "—",
        };

        const consignee = {
            name: name,
            address: `${address?.line1 || address?.address || ""} ${address?.street || ""} ${address?.area || address?.line2 || ""}`.trim(),
            city: address?.city || "Unknown",
            state: address?.state || "Unknown",
            pincode: address?.pincode || "Unknown",
            contact: phone,
        };

        const totalAmount = orderItems.reduce(
            (acc, item) => acc + item.unit * item.qty,
            0
        );

        const amountInWords = toWords(totalAmount) + " Rupees Only";

        // Bypass invoice validation logic requested by user
        let invoiceDataObj = getInvoiceNumber(order);
        let invoiceNo = "";
        if (!invoiceDataObj) {
            // For unpaid/missing orders, generate a placeholder invoice number so user can still print
            invoiceNo = "FMXXXX0000";
        } else {
            invoiceNo = invoiceDataObj.formatted;
        }

        setInvoiceData(
            {
                ...order,
                items: itemDetails,
                amountInWords: toTitleCase(amountInWords),
                invoiceDate: formatTimestampToDDMMYYYY(order.createdAt),
                invoiceNo: invoiceNo,
                receiver,
                consignee,
                terms: [
                    "Seller is not responsible for any loss or damage of goods in transit",
                    "Dispute if any will be Subject to Chennai, Tamil Nadu Court Jurisdiction Only",
                    "Any inaccuracy in this bill must be notified immediately on its receipt",
                    "This is a Computer Generated Invoice"
                ]
            }
        );

    }

    const getCatalogMrp = (item) => {
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
    };

    const resolveShiprocketLineItems = (order) => {
        const sources = [order?.cart, order?.items, order?.line_items];
        for (const src of sources) {
            if (!Array.isArray(src) || src.length === 0) continue;
            return src.map((item, idx) => {
                const rawPrice = Number(item?.price ?? item?.offer_price ?? 0);
                const price = rawPrice > 1000 ? rawPrice / 100 : rawPrice;
                const units = Math.max(1, Number(item?.qty ?? item?.quantity ?? 1));
                let declaredPrice = getCatalogMrp(item);
                if (declaredPrice <= 0) declaredPrice = price;

                const titleLower = String(item?.title || item?.name || "").toLowerCase();
                const skuLower = String(item?.sku || item?.itemCode || item?.id || "").toLowerCase();

                // If units >= 2 represent individual units of a pack offer, unit MRP must reflect single unit
                // so that total declared amount (units * declaredPrice) equals the true pack MRP
                if ((titleLower.includes("pack of 2") || skuLower.includes("pack-of-2")) && units >= 2) {
                    if (declaredPrice >= 400 && declaredPrice <= 480) {
                        declaredPrice = 220; // 2 bottles * 220 = 440
                    } else if (declaredPrice >= 800 && declaredPrice <= 1000) {
                        declaredPrice = 450; // 2 bottles * 450 = 900
                    }
                }

                return {
                    name: item?.title || item?.name || "Product",
                    sku: item?.sku || item?.itemCode || `SKU_${idx + 1}`,
                    units: units,
                    selling_price: declaredPrice,
                    mrp: declaredPrice,
                    price: price,
                    hsn: String(item?.hsn || "30039011").replace(/\D/g, "") || "30039011",
                };
            });
        }
        return [];
    };

    const createShipmentOrder = async (order) => {
        const orderId = order.id;
        setShiprocketLoading(prev => ({ ...prev, [orderId]: true }));

        try {
            const selectedAddress = order?.selectedAddress || order?.address || {};
            const customer = order?.customer || {};
            const lineItems = resolveShiprocketLineItems(order);

            const requiredFields = {
                name: customer?.name || order?.name || order?.userName || selectedAddress?.name,
                address: selectedAddress?.line1 || selectedAddress?.address,
                city: selectedAddress?.city,
                state: selectedAddress?.state,
                pincode: selectedAddress?.pincode || selectedAddress?.zipcode,
                phone: customer?.phone || order?.phone || order?.userPhone || selectedAddress?.phone,
                email: customer?.email || order?.email || order?.userEmail,
            };

            const missingFields = Object.entries(requiredFields)
                .filter(([, value]) => !value)
                .map(([key]) => key);

            if (missingFields.length > 0) {
                showToast("Missing required fields: " + missingFields.join(", "), "error"); return;
            }

            if (lineItems.length === 0) {
                showToast("Order has no items.", "error"); return;
            }

            const cleanPhone = String(requiredFields.phone || "").replace(/\D/g, "");
            if (cleanPhone.length < 10) {
                showToast("Invalid phone number — must be at least 10 digits.", "error"); return;
            }

            const invData = getInvoiceNumber(order);
            const invoiceNo = invData?.formatted || "";

            const combinedAddress = [
                selectedAddress?.line1 || selectedAddress?.address || "",
                selectedAddress?.area || selectedAddress?.line2 || selectedAddress?.street || ""
            ].filter(Boolean).join(", ");

            const subTotal = lineItems.reduce((sum, item) => sum + (item.selling_price * item.units), 0)
                || (typeof order.amount === "number" ? (order.amount > 1000 ? order.amount / 100 : order.amount) : 0);

            const orderData = {
                order_id: invoiceNo || order.razorpay_order_id || `FM_${Date.now()}`,
                invoice_no: invoiceNo,
                order_date: new Date().toISOString().slice(0, 10),
                pickup_location: "Primary",
                billing: {
                    name: requiredFields.name,
                    last_name: "",
                    address: combinedAddress,
                    address_2: selectedAddress?.area || selectedAddress?.line2 || selectedAddress?.street || "",
                    city: selectedAddress?.city || "",
                    state: selectedAddress?.state || "",
                    country: selectedAddress?.country || "India",
                    pincode: String(requiredFields.pincode || "").trim(),
                    email: requiredFields.email || "",
                    phone: cleanPhone,
                },
                shipping: {
                    is_billing: true,
                    name: requiredFields.name,
                    last_name: "",
                    address: combinedAddress,
                    address_2: selectedAddress?.area || selectedAddress?.line2 || selectedAddress?.street || "",
                    city: selectedAddress?.city || "",
                    state: selectedAddress?.state || "",
                    country: selectedAddress?.country || "India",
                    pincode: String(requiredFields.pincode || "").trim(),
                    email: requiredFields.email || "",
                    phone: cleanPhone,
                },
                order_items: lineItems,
                payment_method: "Prepaid",
                sub_total: subTotal,
                length: SHIPROCKET_PACKAGE.length,
                breadth: SHIPROCKET_PACKAGE.breadth,
                height: SHIPROCKET_PACKAGE.height,
                weight: SHIPROCKET_PACKAGE.weight,
            };

            // Always ship via Delhivery; pass payment_id so backend auto-saves AWB + tracking URL
            orderData.payment_id = orderId;

            const { data } = await phpApi.post("/api/shipping/delhivery/create-order", orderData);

            if (data.success) {
                showToast("Shipped via Delhivery! AWB: " + (data.waybill || "pending") + ". AWB & tracking saved, shipped email sent.", "success");
                onOrderAdded?.();
            } else {
                const errorMsg = data.error || data.message || "Unknown error";
                if (String(errorMsg).toLowerCase().includes("delhivery") || String(errorMsg).toLowerCase().includes("token")) {
                    showToast("Delhivery is not configured. Add DELHIVERY_API_TOKEN, DELHIVERY_BASE_URL, DELHIVERY_PICKUP_LOCATION, DELHIVERY_CLIENT_CODE in backend-php/.env", "error");
                } else {
                    showToast("Failed to create shipment: " + errorMsg, "error");
                }
            }
        } catch (error) {
            const apiMsg = error?.response?.data?.error || error?.message || "Unknown error";
            showToast(String(apiMsg), "error");
        } finally {
            setShiprocketLoading(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const capturePayment = async (order) => {
        const paymentId = order.razorpay_payment_id || order.payload?.payload?.payment?.entity?.id;
        if (!paymentId) {
            alert("Payment ID not found for this order.");
            return;
        }
        setCaptureLoading(prev => ({ ...prev, [paymentId]: true }));
        try {
            const res = await fetch(CAPTURE_PAYMENT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payment_id: paymentId }),
            });
            const data = await res.json();
            if (data.success) {
                alert("Payment captured. Order will be created via webhook. Refreshing…");
                onOrderAdded?.();
                setTimeout(() => onOrderAdded?.(), 4000);
            } else {
                alert("Capture failed: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error("Capture error:", err);
            alert("Capture failed: " + err.message);
        } finally {
            setCaptureLoading(prev => ({ ...prev, [paymentId]: false }));
        }
    };

    const moveToPaid = async (order) => {
        if (!confirm("Are you sure you want to move this order to PAID? This will create a valid order record.")) return;

        const loadingId = order.razorpay_payment_id || order.id;
        // reuse capture loading state to show spinner on the button
        setCaptureLoading(prev => ({ ...prev, [loadingId]: true }));

        try {
            const orderId = order.razorpay_order_id;
            if (!orderId) throw new Error("No Order ID found");

            // Construct valid order data to be saved in 'orders' collection
            const newOrderData = {
                razorpay_order_id: orderId,
                razorpay_payment_id: order.razorpay_payment_id,
                amount: order.amount, // preservation of original amount format (paise)
                status: "success",
                payment_status: "captured",
                method: "manual_move_to_paid",
                createdAt: serverTimestamp(),

                // Customer details
                name: order.name,
                email: order.email,
                phone: order.phone,

                // Address
                selectedAddress: order.selectedAddress || {},

                // Cart
                cart: order.cart || [],

                // Meta
                source: "admin_manual_move",
                movedFromMissing: true,
                originalWebhookId: order.webhook_id || null
            };

            await setDoc(doc(db, "orders", orderId), newOrderData);

            alert("Order moved to Paid successfully!");
            onOrderAdded?.(); // Trigger refresh

        } catch (error) {
            console.error("Move to paid error:", error);
            alert("Failed to move order: " + error.message);
        } finally {
            setCaptureLoading(prev => ({ ...prev, [loadingId]: false }));
        }
    };

    return (
        <>
            <AddOrderModal
                isOpen={showAddOrderModal}
                onClose={() => setShowAddOrderModal(false)}
                onSuccess={() => {
                    onOrderAdded?.();
                    setShowAddOrderModal(false);
                }}
                existingOrders={allOrders}
            />
            <div className={`bg-card rounded-xl border border-border/50 shadow-lg overflow-hidden w-full ${invoiceData ? 'print-hidden' : ''}`}>
                <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print-hidden bg-slate-50/60 dark:bg-slate-900/30">
                    {/* Left: Delhivery Auto-Dispatch Status & Control Toggle */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <div
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-sm transition-all"
                            style={{
                                borderColor: autoDispatchEnabled ? '#10b981' : '#cbd5e1',
                                backgroundColor: autoDispatchEnabled ? '#ecfdf5' : '#f8fafc',
                                color: autoDispatchEnabled ? '#065f46' : '#475569',
                            }}
                        >
                            <Truck className={`h-4 w-4 ${autoDispatchEnabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span>Delhivery Auto-Dispatch:</span>
                            <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase ${
                                    autoDispatchEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                }`}
                            >
                                {autoDispatchEnabled ? 'ON (Auto)' : 'OFF (Manual)'}
                            </span>
                        </div>

                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={autoDispatchLoading}
                            onClick={handleToggleAutoDispatch}
                            className={`text-xs font-semibold h-8 transition-colors ${
                                autoDispatchEnabled
                                    ? 'border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                                    : 'border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                            }`}
                            title={
                                autoDispatchEnabled
                                    ? 'Click to turn off automatic order generation in Delhivery'
                                    : 'Click to turn on automatic order generation in Delhivery'
                            }
                        >
                            {autoDispatchLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            ) : null}
                            {autoDispatchEnabled ? 'Turn OFF Auto-Flow' : 'Turn ON Auto-Flow'}
                        </Button>

                        <span className="text-[11px] text-muted-foreground hidden md:inline-block">
                            {autoDispatchEnabled
                                ? '⚡ New purchases are automatically booked on Delhivery'
                                : '🛡️ Auto-flow is stopped. Use "Auto-Dispatch with Delhivery" button on each order.'}
                        </span>
                    </div>

                    {/* Right: Edit Mode & Add Order */}
                    <div className="flex items-center gap-2 justify-end">
                        <Button
                            onClick={toggleEditMode}
                            variant={editMode ? "default" : "outline"}
                            className={`flex items-center gap-2 transition-all duration-300 ${editMode
                                ? "bg-red-500 hover:bg-red-600 text-white border-red-600 shadow-sm"
                                : "hover:bg-accent hover:text-accent-foreground"
                                }`}
                        >
                            {editMode ? <XCircle className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                            {editMode ? "Close Edit Mode" : "Edit Mode"}
                        </Button>
                        <Button
                            onClick={() => setShowAddOrderModal(true)}
                            className="flex items-center gap-2 text-white bg-green-700 hover:bg-green-800"
                        >
                            <Plus className="h-4 w-4" />
                            Add Order
                        </Button>
                    </div>
                </div>
                <div className="overflow-x-auto w-full">
                    <Table className="w-full" style={{ tableLayout: 'auto', width: '100%' }}>
                        <TableHeader>
                            <TableRow className="bg-green-700/5 hover:bg-green-700/5 border-b border-border/50 w-full">
                                <TableHead className="font-semibold text-foreground">Name</TableHead>
                                <TableHead className="font-semibold text-foreground">Email</TableHead>
                                <TableHead className="font-semibold text-foreground">Amount</TableHead>
                                <TableHead className="font-semibold text-foreground">Status</TableHead>
                                <TableHead className="font-semibold text-foreground">Date</TableHead>
                                <TableHead className="font-semibold text-foreground">Details</TableHead>
                                <TableHead className="font-semibold text-foreground text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order, index) => {
                                const isOpen = openId === order.id;
                                return (
                                    <>
                                        <TableRow
                                            key={order.id}
                                            className="hover:bg-accent/30 transition-colors"
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium">{order?.name || order?.userName || "—"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm">{order?.email || order?.userEmail || "—"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold text-foreground">
                                                ₹{typeof order.amount === 'number'
                                                    ? order.amount.toFixed(2)
                                                    : "0.00"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    {/* Payment Status */}
                                                    {order.status === "missing_order" ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-orange-100 text-orange-700 border-orange-300"
                                                        >
                                                            <AlertCircle className="h-3 w-3 mr-1" />
                                                            Missing Order
                                                        </Badge>
                                                    ) : isDisplayFailed(order) ? (
                                                        <Badge
                                                            variant="destructive"
                                                            className="bg-destructive/15 text-destructive hover:bg-destructive/20 border-destructive/30"
                                                        >
                                                            Failed
                                                        </Badge>
                                                    ) : isDisplayPaid(order) ? (
                                                        <Badge
                                                            variant="default"
                                                            className="bg-green-700/15 text-green-700 hover:bg-green-700/20 border-green-700/30"
                                                        >
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            Paid
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-yellow-100 text-yellow-700 border-yellow-300"
                                                        >
                                                            Pending
                                                        </Badge>
                                                    )}

                                                    {/* Collection Source */}
                                                    {order.collection && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {order.collection === "orders" && "✓ Orders"}
                                                            {order.collection === "payments" && "📄 Payments"}
                                                            {order.collection === "webhook_only" && "⚠️ Webhook Only"}
                                                        </span>
                                                    )}

                                                    {/* Webhook Status */}
                                                    {order.hasWebhook && (
                                                        <span className="text-xs text-blue-600">
                                                            ✓ Webhook: {order.webhookEvent}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {(() => {
                                                    const date = parseOrderDate(order.createdAt) || parseOrderDate(order.webhookReceivedAt);
                                                    return date ? date.toLocaleString() : "—";
                                                })()}
                                            </TableCell>
                                            {/* INVOICE AND SHIPROCKET BUTTONS */}
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handlePrintPdf(order, index)}
                                                    >
                                                        <FileText className="h-4 w-4 mr-1" />
                                                        {(() => {
                                                            const invData = getInvoiceNumber(order);
                                                            return invData ? `Invoice ${invData.formatted}` : "Invoice N/A";
                                                        })()}
                                                    </Button>
                                                    <Link
                                                        to={`/admin/panel/order-tracking?id=${encodeURIComponent(order.id || order.razorpay_order_id || '')}`}
                                                        className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors shadow-sm"
                                                        title="Track & View Order Confirmation"
                                                    >
                                                        <Eye className="h-3.5 w-3.5 mr-1 text-blue-600" />
                                                        Track
                                                    </Link>
                                                    {order.awbNumber ? (
                                                        <div
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
                                                            title={`Shipped via Delhivery. AWB: ${order.awbNumber}`}
                                                        >
                                                            <Truck className="h-3.5 w-3.5 text-emerald-600" />
                                                            <span className="font-mono">AWB: {order.awbNumber}</span>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => createShipmentOrder(order)}
                                                            disabled={!!shiprocketLoading[order.id] || !isDisplayPaid(order)}
                                                            title={!isDisplayPaid(order) ? "Only for paid orders" : "Ship via Delhivery"}
                                                            className={!isDisplayPaid(order) ? "opacity-50 cursor-not-allowed" : "text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"}
                                                        >
                                                            <Truck className="h-4 w-4 mr-1" />
                                                            {shiprocketLoading[order.id] ? "Sending…" : "Ship via Delhivery"}
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* TRASH ACTIONS */}
                                                    {isTrash && (
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            onClick={() => handleRestore(order)}
                                                            disabled={!!actionLoading[order.id]}
                                                            className="bg-green-600 hover:bg-green-700"
                                                        >
                                                            {actionLoading[order.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-1" />}
                                                            Restore
                                                        </Button>
                                                    )}

                                                    {/* EDIT MODE ACTIONS */}
                                                    {editMode && !isTrash && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleTrash(order)}
                                                                disabled={!!actionLoading[order.id]}
                                                                className="h-8 w-8 p-0 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 hover:border-red-300 transition-colors"
                                                            >
                                                                {actionLoading[order.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                            </Button>

                                                            {/* Status Change Options for Paid Orders */}
                                                            {isDisplayPaid(order) && (
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        size="icon"
                                                                        variant="outline"
                                                                        title="Move to Missing"
                                                                        className="h-8 w-8 text-orange-600 border-orange-200"
                                                                        onClick={() => handleStatusChange(order, "missing_order", "pending")}
                                                                    >
                                                                        M
                                                                    </Button>
                                                                    <Button
                                                                        size="icon"
                                                                        variant="outline"
                                                                        title="Move to Failed"
                                                                        className="h-8 w-8 text-red-600 border-red-200"
                                                                        onClick={() => handleStatusChange(order, "failed", "failed")}
                                                                    >
                                                                        F
                                                                    </Button>
                                                                    <Button
                                                                        size="icon"
                                                                        variant="outline"
                                                                        title="Move to Pending"
                                                                        className="h-8 w-8 text-yellow-600 border-yellow-200"
                                                                        onClick={() => handleStatusChange(order, "pending", "pending")}
                                                                    >
                                                                        P
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    {!isTrash && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setOpenId(isOpen ? null : order.id)}
                                                            className="text-green-700 hover:text-green-700 hover:bg-green-700/10"
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            {isOpen ? (
                                                                <ChevronUp className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {isOpen && (
                                            <TableRow className="bg-accent/20 hover:bg-accent/20">
                                                <TableCell colSpan={7} className="p-0">
                                                    <ExpandedPaymentDetails order={order} onOrderUpdated={onOrderAdded} />
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                );
                            })}
                            {orders.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="h-32 text-center text-muted-foreground"
                                    >
                                        No payments found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            {/* INVOICE AT BOTTOM */}
            {invoiceData && (
                <div className="fixed inset-0 z-[999] bg-white overflow-y-auto invoice-print-container">
                    <style>
                        {`
                            @media print {
                                @page { margin: 0; }
                                html, body {
                                    margin: 0 !important;
                                    padding: 0 !important;
                                    height: 100% !important;
                                    overflow: hidden !important;
                                    page-break-after: avoid;
                                    page-break-before: avoid;
                                }
                                body * { visibility: hidden; }
                                .invoice-print-container, .invoice-print-container * { visibility: visible; }
                                .invoice-print-container {
                                    position: fixed !important;
                                    left: 0 !important;
                                    top: 0 !important;
                                    bottom: 0 !important;
                                    right: 0 !important;
                                    width: 100vw !important;
                                    height: 100vh !important;
                                    padding: 15mm;
                                    box-sizing: border-box;
                                    margin: 0;
                                    overflow: hidden;
                                }
                            }
                        `}
                    </style>
                    {/* Fixed Top-Right Close Button */}
                    <div className="print-hidden fixed top-5 right-6 z-[1000] flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setInvoiceData(null)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900/90 hover:bg-red-600 text-white font-semibold text-xs shadow-xl backdrop-blur-md transition-all cursor-pointer border border-white/20"
                            title="Close Invoice (Press Esc)"
                        >
                            <X className="w-4 h-4" />
                            <span>Close (Esc)</span>
                        </button>
                    </div>

                    <Invoice orderData={invoiceData} edit={invoiceDataEdit} />

                    {/* Floating Bottom Toolbar (Edit, Print, Close) */}
                    <div className="print-hidden fixed right-6 bottom-6 z-[1000] flex items-center gap-2.5 bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-slate-700/80">
                        <button
                            type="button"
                            onClick={() => invoiceEdit()}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition cursor-pointer shadow-sm ${
                                invoiceDataEdit
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-slate-800 hover:bg-slate-700 border border-slate-600"
                            }`}
                        >
                            {invoiceDataEdit ? <Save className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
                            <span>{invoiceDataEdit ? "Save" : "Edit"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                document.head.querySelector("title").textContent = invoiceData.invoiceNo || "Invoice";
                                window.print();
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer shadow-sm"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setInvoiceData(null)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition cursor-pointer shadow-sm"
                            title="Close Invoice (Esc)"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span>Close</span>
                        </button>
                    </div>
                </div>
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
}
