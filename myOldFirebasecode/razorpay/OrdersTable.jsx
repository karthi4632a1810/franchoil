import { useState, useMemo, useCallback } from "react";
import { Eye, ChevronDown, ChevronUp, FileText, Truck, Plus, User, Mail, CheckCircle2, AlertCircle, Loader2, Trash2, RefreshCcw, Edit, XCircle } from "lucide-react";
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

const CAPTURE_PAYMENT_URL = "https://us-central1-transvaal-franchglobal.cloudfunctions.net/captureRazorpayPayment";

export function OrdersTable({ orders, allOrders = [], onOrderAdded, isTrash = false }) {
    const [openId, setOpenId] = useState(null);
    const [invoiceData, setInvoiceData] = useState(null);
    const [invoiceDataEdit, setInvoiceDataEdit] = useState(false);
    const [shiprocketLoading, setShiprocketLoading] = useState({});
    const [captureLoading, setCaptureLoading] = useState({});
    const [showAddOrderModal, setShowAddOrderModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [actionLoading, setActionLoading] = useState({});

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
            .filter(order => {
                // Only include paid/successful orders
                const isPaid = order.isValid ||
                    order.payment_status === "captured" ||
                    order.status === "success";
                // Exclude missing orders and failed orders
                const notMissing = order.status !== "missing_order";
                const notFailed = order.payment_status !== "failed" && order.status !== "failed";
                return isPaid && notMissing && notFailed;
            })
            .sort((a, b) => {
                // Sort by date (oldest first for sequential invoice numbers)
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() :
                    (a.createdAt ? new Date(a.createdAt) : new Date(0));
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() :
                    (b.createdAt ? new Date(b.createdAt) : new Date(0));
                return dateA - dateB;
            });
    }, [allOrders]);

    // Get invoice number for a paid order (only paid orders get invoice numbers)
    const getInvoiceNumber = useCallback((order) => {
        // Check if order is paid
        const isPaid = order.isValid ||
            order.payment_status === "captured" ||
            order.status === "success";
        const notMissing = order.status !== "missing_order";
        const notFailed = order.payment_status !== "failed" && order.status !== "failed";

        if (!isPaid || !notMissing || !notFailed) {
            return null; // No invoice for non-paid/missing/failed orders
        }

        const paidIndex = paidOrders.findIndex(o =>
            o.razorpay_order_id === order.razorpay_order_id || o.id === order.id
        );

        if (paidIndex === -1) return null;

        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() :
            (order.createdAt ? new Date(order.createdAt) : new Date(0));

        // FY 26-27 starts April 1, 2026
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
    const formatTimestampToDDMMYYYY = (timestamp) => {
        // console.log(timestamp);
        try {
            let date;

            // Check if timestamp is a Firestore Timestamp object
            if (timestamp && typeof timestamp.toDate === "function") {
                date = timestamp.toDate();
            } else if (typeof timestamp === "number") {
                // Assume timestamp is in seconds (with optional decimal for nanoseconds)
                date = new Date(timestamp * 1000); // Convert seconds to milliseconds
            } else {
                throw new Error("Invalid timestamp format");
            }

            if (isNaN(date.getTime())) {
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

    function handlePrintPdf(order, index) {
        // console.log("Generating invoice for order:", order);
        const orderItems = order.cart;

        const itemDetails = orderItems.map(item => ({
            code: item.itemCode || item.sku,
            name: item.title,
            hsn: item.hsn || "30039011",
            unit: item.price,
            qty: item.qty,
            taxable: item.originalPrice || (item.price / 1.05).toFixed(2),
            cgstRate: "2.5",
            cgstAmount: ((item.price / 1.05) * 0.025 * item.qty).toFixed(2),
            sgstRate: "2.5",
            sgstAmount: ((item.price / 1.05) * 0.025 * item.qty).toFixed(2),
            igstRate: "0",
            igstAmount: "0",
            totalAmount: (item.price * item.qty).toFixed(2),
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
            (acc, item) => acc + item.price * item.qty,
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

    const createShiprocketOrder = async (order) => {
        const orderId = order.id;
        setShiprocketLoading(prev => ({ ...prev, [orderId]: true }));

        try {
            // Validate required fields
            // Support both new structure (customer object) and old structure
            const selectedAddress = order?.selectedAddress || order?.address || {};
            const customer = order?.customer || {};
            const requiredFields = {
                name: customer?.name || order?.name || order?.userName || selectedAddress?.name,
                address: selectedAddress?.line1 || selectedAddress?.address,
                city: selectedAddress?.city,
                state: selectedAddress?.state,
                pincode: selectedAddress?.pincode,
                phone: customer?.phone || order?.phone || order?.userPhone || selectedAddress?.phone,
                email: customer?.email || order?.email || order?.userEmail,
            };

            const missingFields = Object.entries(requiredFields)
                .filter(([key, value]) => !value)
                .map(([key]) => key);

            if (missingFields.length > 0) {
                alert(`Missing required fields for Shiprocket: ${missingFields.join(", ")}`);
                setShiprocketLoading(prev => ({ ...prev, [orderId]: false }));
                return;
            }

            if (!order?.cart || order.cart.length === 0) {
                alert("Order has no items. Cannot create Shiprocket order.");
                setShiprocketLoading(prev => ({ ...prev, [orderId]: false }));
                return;
            }

            // Clean phone number (remove spaces, dashes, etc.)
            const cleanPhone = String(customer?.phone || order?.phone || order?.userPhone || selectedAddress?.phone || "")
                .replace(/\D/g, ""); // Remove non-digits

            if (cleanPhone.length < 10) {
                alert("Invalid phone number. Phone must be at least 10 digits.");
                setShiprocketLoading(prev => ({ ...prev, [orderId]: false }));
                return;
            }

            const orderData = {
                order_id: `fm_order_${Date.now()}_${order.razorpay_order_id}`,
                pickup_location: "Primary",
                billing: {
                    name: requiredFields.name,
                    last_name: "",
                    address: selectedAddress?.line1 || "",
                    address_2: selectedAddress?.area || selectedAddress?.line2 || selectedAddress?.street || "",
                    city: selectedAddress?.city || "",
                    state: selectedAddress?.state || "",
                    country: selectedAddress?.country || "India",
                    pincode: String(selectedAddress?.pincode || "").trim(),
                    email: requiredFields.email || "",
                    phone: cleanPhone
                },
                shipping: {
                    is_billing: true,
                    name: requiredFields.name,
                    last_name: "",
                    address: selectedAddress?.line1 || "",
                    address_2: selectedAddress?.area || selectedAddress?.line2 || selectedAddress?.street || "",
                    city: selectedAddress?.city || "",
                    state: selectedAddress?.state || "",
                    country: selectedAddress?.country || "India",
                    pincode: String(selectedAddress?.pincode || "").trim(),
                    email: requiredFields.email || "",
                    phone: cleanPhone
                },
                order_items: (order.cart || order.items || []).map((item) => ({
                    name: item.title || item.name || "Product",
                    sku: item.sku || item.itemCode || `SKU_${Date.now()}`,
                    units: item.qty || 1,
                    selling_price: item.price || 0,
                    hsn: String(item.hsn || "30039011").replace(/\D/g, "") || "30039011"
                })),
                payment_method: "Prepaid",
                sub_total: (order.cart || order.items || []).reduce((sum, item) => {
                    return sum + ((item.price || 0) * (item.qty || 1));
                }, 0) || (typeof order.amount === 'number' ? (order.amount > 1000 ? order.amount / 100 : order.amount) : 0),
                length: 10,
                breadth: 10,
                height: 10,
                weight: order.cart.reduce((sum, i) => sum + (0.1 * (i.qty || 1)), 0) || 0.5
            };

            const response = await fetch(
                "https://us-central1-transvaal-franchglobal.cloudfunctions.net/createShiprocketOrder",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(orderData),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                // HTTP error (4xx, 5xx)
                const errorMsg = data.error || data.message || `HTTP ${response.status}: ${response.statusText}`;
                console.error("Shiprocket HTTP error:", { status: response.status, data });
                alert("Failed to create Shiprocket order: " + errorMsg);
                return;
            }

            if (data.success) {
                // Success - order created
                // console.log("Shiprocket order created:", data.data);
                window.open("https://app.shiprocket.in/seller/orders/new", "_blank");
            } else {
                // API returned error
                const errorMsg = data.error || data.message || "Unknown error";
                console.error("Shiprocket API error:", data);
                alert("Failed to create Shiprocket order: " + errorMsg);
            }
        } catch (error) {
            console.error("Shiprocket error:", error);
            alert("Failed to create Shiprocket order: " + error.message);
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
                <div className="p-4 border-b border-border/50 flex justify-end gap-2 print-hidden">
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
                        className="flex items-center gap-2 text-white"
                    >
                        <Plus className="h-4 w-4" />
                        Add Order
                    </Button>
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
                                                    ? (order.amount > 1000 ? (order.amount / 100).toFixed(2) : order.amount.toFixed(2))
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
                                                    ) : order.isValid || order.payment_status === "captured" || order.status === "success" ? (
                                                        <Badge
                                                            variant="default"
                                                            className="bg-green-700/15 text-green-700 hover:bg-green-700/20 border-green-700/30"
                                                        >
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            Paid
                                                        </Badge>
                                                    ) : order.payment_status === "failed" || order.status === "failed" ? (
                                                        <Badge
                                                            variant="destructive"
                                                            className="bg-destructive/15 text-destructive hover:bg-destructive/20 border-destructive/30"
                                                        >
                                                            Failed
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
                                                {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() :
                                                    order.webhookReceivedAt?.toDate ? order.webhookReceivedAt.toDate().toLocaleString() :
                                                        order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}
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
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => createShiprocketOrder(order)}
                                                        disabled={true}
                                                        className={!order.isValid ? "opacity-50 cursor-not-allowed" : "text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"}
                                                    >
                                                        <Truck className="h-4 w-4 mr-1" />
                                                        {shiprocketLoading[order.id] ? "Loading..." : "Shiprocket"}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {(order.status === "missing_order" || order.status === "failed" || order.payment_status === "failed") && !isTrash && !editMode && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => capturePayment(order)}
                                                                disabled={!!captureLoading[order.razorpay_payment_id || order.id]}
                                                                className="bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100"
                                                            >
                                                                {captureLoading[order.razorpay_payment_id || order.id] ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    "Capture"
                                                                )}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => moveToPaid(order)}
                                                                disabled={!!captureLoading[order.razorpay_payment_id || order.id]}
                                                                className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                                                            >
                                                                {captureLoading[order.razorpay_payment_id || order.id] ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                                                        Move to Paid
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </>
                                                    )}

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
                                                            {(order.status === "success" || order.payment_status === "captured") && (
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
                                                    <ExpandedPaymentDetails order={order} />
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
                <div className="fixed inset-[-5px] z-[999] bg-white invoice-print-container">
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
                    <Invoice orderData={invoiceData} edit={invoiceDataEdit} />
                    <div onClick={() => setInvoiceData(null)} className="print-hidden invoice-pdf-close text-5xl absolute right-5 top-5 cursor-pointer">
                        <MaskImage size='1em' bg="red" hBg='red' url="https://api.iconify.design/ic:round-close.svg" />
                    </div>
                    <div className="print-hidden bg-blue-700 hover:bg-blue-800 py-3 px-5 absolute right-10 bottom-10 cursor-pointer flex items-center text-white rounded-4xl w-max gap-3" onClick={() => {
                        document.head.querySelector("title").textContent = invoiceData.invoiceNo || "Invoice";
                        window.print();
                    }}>
                        PRINT
                        <MaskImage size='1em' bg="white" hBg='white' url="https://api.iconify.design/material-symbols:print.svg" />
                    </div>
                    <div className={`print-hidden ${invoiceDataEdit ? "bg-green-700 hover:bg-green-800" : " bg-red-700 hover:bg-red-800"}  py-3 px-5 absolute right-40 bottom-10 cursor-pointer flex items-center text-white rounded-4xl w-max gap-3`} onClick={() => invoiceEdit()}>
                        {invoiceDataEdit ? "SAVE" : "EDIT"}

                        <MaskImage size='1em' bg="white" hBg='white' url={invoiceDataEdit ? "https://api.iconify.design/material-symbols:save.svg" : "https://api.iconify.design/material-symbols:edit-outline.svg"} />
                    </div>
                </div>
            )}
        </>
    );
}
