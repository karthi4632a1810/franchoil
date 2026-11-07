import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { firestore as db } from "../firebase/config";

export const useRazorpayOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch orders from both orders and payments collections (for backward compatibility)
    const fetchOrders = async () => {
        try {
            const allOrders = [];
            const orderIdMap = new Map(); // To deduplicate by razorpay_order_id

            // 1. Fetch from orders collection (new structure)
            try {
                const ordersQ = query(
                    collection(db, "orders"),
                    orderBy("createdAt", "desc"),
                    limit(500)
                );
                const ordersSnap = await getDocs(ordersQ);
                
                ordersSnap.docs.forEach((doc) => {
                    const data = doc.data();
                    // Only include Razorpay orders - exclude Cashfree orders
                    if (data.razorpay_order_id && !data.cashfree_order_id) {
                        // Transform new structure to expected format
                        const transformed = {
                            id: doc.id,
                            // Map new structure to old structure for backward compatibility
                            razorpay_order_id: data.razorpay_order_id,
                            razorpay_payment_id: data.razorpay_payment_id,
                            orderNo: data.orderNo,
                            amount: data.amount,
                            // Customer data
                            name: data.customer?.name || data.name,
                            email: data.customer?.email || data.email,
                            phone: data.customer?.phone || data.phone,
                            // Address data
                            selectedAddress: data.address || data.selectedAddress || {},
                            // Cart/Items
                            cart: data.cart || data.items || [],
                            // Status
                            isValid: data.payment_status === "captured" || data.status === "success",
                            payment_status: data.payment_status,
                            status: data.status,
                            // Source tracking
                            source: data.source || "orders_collection",
                            // Timestamps
                            createdAt: data.createdAt,
                            updatedAt: data.updatedAt,
                            // Keep all original data
                            ...data,
                        };
                        
                        // Use razorpay_order_id as key to prevent duplicates
                        if (!orderIdMap.has(data.razorpay_order_id)) {
                            orderIdMap.set(data.razorpay_order_id, transformed);
                            allOrders.push(transformed);
                        }
                    }
                });
            } catch (ordersError) {
                console.error("Error fetching from orders collection:", ordersError);
            }

            // 2. Fetch from payments collection (old structure - for backward compatibility)
            try {
                const paymentsQ = query(
                    collection(db, "payments"),
                    orderBy("createdAt", "desc"),
                    limit(500)
                );
                const paymentsSnap = await getDocs(paymentsQ);
                
                paymentsSnap.docs.forEach((doc) => {
                    const data = doc.data();
                    // Only include Razorpay orders - exclude Cashfree orders
                    if (data.razorpay_order_id && !data.cashfree_order_id) {
                        // Skip if already added from orders collection
                        if (!orderIdMap.has(data.razorpay_order_id)) {
                            const transformed = {
                                id: doc.id,
                                ...data,
                                // Ensure backward compatibility fields
                                name: data.name || data.userName,
                                email: data.email || data.userEmail,
                                phone: data.phone || data.userPhone,
                                selectedAddress: data.selectedAddress || {},
                                cart: data.cart || [],
                                isValid: data.isValid !== false, // Default to true if not set
                                payment_status: data.payment_status || (data.isValid ? "captured" : "pending"),
                                source: data.source || "payments_collection",
                            };
                            orderIdMap.set(data.razorpay_order_id, transformed);
                            allOrders.push(transformed);
                        }
                    }
                });
            } catch (paymentsError) {
                console.error("Error fetching from payments collection:", paymentsError);
            }

            // Sort by createdAt (most recent first)
            allOrders.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
                return dateB - dateA;
            });

            setOrders(allOrders);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        // Optional: Refresh every 30 seconds instead of real-time
        const interval = setInterval(fetchOrders, 30000);

        return () => clearInterval(interval);
    }, []);

    return { orders, loading, refreshOrders: fetchOrders };
};
