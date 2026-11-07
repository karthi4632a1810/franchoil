import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, Truck, ExternalLink, ArrowRight, Phone, Mail, MapPin } from 'lucide-react';
import { trackPurchase, generateEventId } from '../utils/metaPixel';
import { useOrders } from '../hooks/useOrder';
import { sendPurchaseToPhpCapi } from '../services/metaCapiClient';
import { fulfillmentLabel } from '../utils/fulfillmentStatus';

import { getProductCoverImage } from "../utils/productImages";

const ThankYou = () => {
    const [searchParams] = useSearchParams();
    const { getOrders } = useOrders();
    const hasFired = useRef(false);
    const [orderData, setOrderData] = useState(null);
    const [fallbackItems, setFallbackItems] = useState([]);
    const [fallbackTotalAmount, setFallbackTotalAmount] = useState(0);

    const paramOrderId = searchParams.get("orderId");
    const localLatestId = typeof window !== "undefined" ? window.localStorage.getItem("latestOrderId") : null;
    const localRazorpayOrderId = typeof window !== "undefined" ? window.localStorage.getItem("order_id") : null;
    const activeOrderId = paramOrderId || localLatestId || localRazorpayOrderId;

    useEffect(() => {
        // Read localStorage cart snapshot as instant fallback
        let fallbackCart = null;
        let fallbackTotal = 0;
        try {
            const snapshot = window.localStorage.getItem("meta_cart_snapshot");
            if (snapshot) {
                const parsed = JSON.parse(snapshot);
                fallbackCart = parsed.cart || [];
                fallbackTotal = Number(parsed.total) || 0;
                setFallbackItems(fallbackCart);
                setFallbackTotalAmount(fallbackTotal);
            }
        } catch (_) {}

        // Fetch detailed order receipt from public order endpoint
        const fetchPublicOrder = async (queryId) => {
            if (!queryId) return;
            try {
                const res = await fetch(`/api/orders/public/${queryId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data?.order) {
                        setOrderData(data.order);
                    }
                }
            } catch (err) {
                console.warn("[ThankYou] Could not fetch public order details:", err);
            }
        };

        if (activeOrderId) {
            fetchPublicOrder(activeOrderId);
            // Polling attempt after 2s in case Delhivery auto-dispatch just finalized AWB
            const timer = setTimeout(() => {
                fetchPublicOrder(activeOrderId);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [activeOrderId]);

    useEffect(() => {
        if (hasFired.current) return;

        const orderId = searchParams.get("orderId") || window.localStorage.getItem("latestOrderId");
        const razorpayOrderId = window.localStorage.getItem("order_id");
        const eventId = generateEventId();

        let fallbackCart = null;
        let fallbackTotal = 0;
        try {
            const snapshot = window.localStorage.getItem("meta_cart_snapshot");
            if (snapshot) {
                const parsed = JSON.parse(snapshot);
                fallbackCart = parsed.cart || null;
                fallbackTotal = parsed.total || 0;
            }
        } catch (_) {}

        if (!orderId && !fallbackCart) {
            return;
        }

        const firePixelFromCart = async (cart, total, eid) => {
            if (hasFired.current) return;
            hasFired.current = true;

            const purchasedItems = cart.map(i => ({
                sku: i.sku || i.itemCode || i.code || "",
                price: Number(i.price) || 0,
                qty: Number(i.qty) || 1,
            })).filter(i => i.sku);

            if (purchasedItems.length === 0) return;

            const orderKey = razorpayOrderId || orderId;
            trackPurchase(purchasedItems, Number(total) || 0, orderKey, eid);
            try {
                await sendPurchaseToPhpCapi({
                    cartItems: purchasedItems,
                    totalValue: Number(total) || 0,
                    orderId: orderKey,
                    eventId: eid,
                });
            } catch (capiError) {
                console.warn("[ThankYou] PHP CAPI purchase send failed:", capiError?.message || capiError);
            }

            try { window.localStorage.removeItem("meta_cart_snapshot"); } catch (_) {}
        };

        const firePixel = async () => {
            if (orderId) {
                for (let attempt = 1; attempt <= 2; attempt++) {
                    try {
                        const allOrders = await getOrders();
                        const order = allOrders.find(o => o.id === orderId);
                        if (order) {
                            const items = order.items || order.cart || [];
                            const rawAmount = order.amount || 0;
                            const totalAmount = rawAmount > 1000 ? rawAmount / 100 : rawAmount
                                || items.reduce((sum, i) => sum + (Number(i.price || 0) * Number(i.qty || 1)), 0);

                            if (items.length > 0) {
                                await firePixelFromCart(items, totalAmount, eventId);
                                return;
                            }
                        }
                    } catch (_) {}
                    if (attempt < 2) {
                        await new Promise(r => setTimeout(r, 1500));
                    }
                }
            }

            if (fallbackCart && fallbackCart.length > 0) {
                await firePixelFromCart(fallbackCart, fallbackTotal, eventId);
            }
        };

        firePixel();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Render items list
    const items = (orderData?.items && orderData.items.length > 0)
        ? orderData.items
        : (orderData?.cart && orderData.cart.length > 0)
            ? orderData.cart
            : fallbackItems;

    const totalAmount = Number(orderData?.totalAmount || orderData?.amount || fallbackTotalAmount || 0);
    const awb = (orderData?.awbNumber || "").trim();
    const trackingUrl = orderData?.trackingUrl || (awb ? `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}` : "");
    const address = orderData?.selectedAddress || orderData?.address || {};
    const addressLine = [
        address.line1 || address.address,
        address.line2 || address.area,
        address.city,
        address.state,
        address.pincode || address.zipcode,
    ].filter(Boolean).join(", ");

    const displayId = orderData?.id || activeOrderId || "Confirmed";
    const trackOrderPath = orderData?.id ? `/my-orders/${orderData.id}` : activeOrderId ? `/my-orders/${activeOrderId}` : "/my-orders";

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center"
                >
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
                        Order Placed Successfully!
                    </h1>
                    <p className="text-slate-600 text-base max-w-lg mx-auto">
                        Thank you for ordering with Franch Global. We have received your order and payment. A confirmation email has been sent to your inbox.
                    </p>

                    <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-full text-sm">
                        <span className="text-slate-500 font-medium">Order Number:</span>
                        <strong className="text-slate-900 font-mono">#{displayId}</strong>
                        <span className="text-slate-300">|</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            {fulfillmentLabel(orderData?.fulfillmentStatus || "placed")}
                        </span>
                    </div>
                </motion.div>

                {/* Delhivery Tracking Banner (if AWB already assigned) */}
                {awb ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-2xl p-6 shadow-md"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Truck className="w-5 h-5 text-emerald-300" />
                                    <span className="text-xs uppercase tracking-wider font-bold text-emerald-200">
                                        Delhivery Express Shipment
                                    </span>
                                </div>
                                <p className="text-lg font-bold m-0">
                                    AWB Tracking: <span className="font-mono text-yellow-300">{awb}</span>
                                </p>
                                <p className="text-xs text-emerald-100 mt-1 m-0">
                                    Your package is booked with Delhivery and ready for pickup & transit.
                                </p>
                            </div>
                            {trackingUrl && (
                                <a
                                    href={trackingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-emerald-800 font-bold rounded-xl text-sm shadow hover:bg-emerald-50 transition"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Track on Delhivery
                                </a>
                            )}
                        </div>
                    </motion.div>
                ) : null}

                {/* Order Details & Summary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                >
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide m-0">
                            Order Receipt
                        </h2>
                    </div>

                    {/* Items List */}
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                            Items Ordered ({items.length})
                        </h3>
                        {items.length > 0 ? (
                            <ul className="divide-y divide-slate-100">
                                {items.map((item, idx) => {
                                    const qty = Number(item.qty || item.quantity || 1);
                                    const price = Number(item.price || 0);
                                    const lineTotal = Number(item.total || (price * qty) || 0);
                                    const sku = String(item.sku || "").toLowerCase();
                                    const img = getProductCoverImage(item);

                                    return (
                                        <li key={idx} className="py-3 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <img
                                                    src={img}
                                                    alt={item.title || "Product"}
                                                    className="w-14 h-14 rounded-lg object-contain bg-slate-50 p-1 border border-slate-200 shrink-0"
                                                    onError={(e) => {
                                                        const fallback = getProductCoverImage(item);
                                                        if (e.currentTarget.src !== fallback) {
                                                            e.currentTarget.src = fallback;
                                                        }
                                                    }}
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 truncate m-0">
                                                        {item.title || item.name || "Ayurvedic Product"}
                                                    </p>
                                                    <p className="text-xs text-slate-500 m-0 mt-0.5">
                                                        Qty: {qty} × ₹{price.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-bold text-slate-900 whitespace-nowrap m-0">
                                                ₹{lineTotal.toFixed(2)}
                                            </p>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500 italic">Order details loaded successfully.</p>
                        )}
                    </div>

                    {/* Price Breakdown */}
                    <div className="p-6 bg-slate-50/50 border-b border-slate-100 space-y-2">
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Subtotal</span>
                            <span>₹{totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Shipping</span>
                            <span className="font-semibold text-green-700">FREE</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                            <span>Total Paid</span>
                            <span className="text-emerald-700">₹{totalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Shipping Address (if available) */}
                    {addressLine && (
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                Delivery Address
                            </h3>
                            {orderData?.customerName && (
                                <p className="text-sm font-bold text-slate-800 m-0">
                                    {orderData.customerName}
                                </p>
                            )}
                            <p className="text-sm text-slate-600 m-0 mt-0.5">
                                {addressLine}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="p-6 flex flex-col sm:flex-row gap-3 justify-end bg-white">
                        <Link
                            to={trackOrderPath}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm transition shadow-sm"
                        >
                            Track Order Details
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            to="/products"
                            className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50 transition"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </motion.div>

                {/* Customer Support Notice */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-sm text-slate-600">
                    <div>
                        <p className="font-bold text-slate-800 m-0">Have questions about your order?</p>
                        <p className="text-xs text-slate-500 m-0 mt-0.5">Franch Global support team is here to assist you.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-emerald-800">
                        <a href="tel:+919841854321" className="inline-flex items-center gap-1.5 hover:underline">
                            <Phone className="w-3.5 h-3.5" />
                            +91 984 185 4321
                        </a>
                        <a href="mailto:contact@franchglobal.com" className="inline-flex items-center gap-1.5 hover:underline">
                            <Mail className="w-3.5 h-3.5" />
                            contact@franchglobal.com
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThankYou;