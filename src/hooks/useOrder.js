import useAuth from "./useAuth";
import { useState, useEffect } from "react";
import { phpApi, phpRoutes } from "../lib/phpApi";

export const useOrders = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({
        totalOrders: 0,
        todayOrders: 0,
        yesterdayOrders: 0,
        thisWeekOrders: 0,
        thisMonthOrders: 0,
        thisYearOrders: 0,
    });
    const [loading, setLoading] = useState(true);

    const getOrders = async () => {
        const { data } = await phpApi.get(phpRoutes.orders, {
            params: { pageSize: 1000 },
        });
        return Array.isArray(data?.orders) ? data.orders : [];
    };

    // ---------------- Create Order ----------------
    const createOrder = async (orderData) => {
        if (!user) throw new Error("No user logged in");
        const fullData = {
            ...orderData,
            userId: user.uid,
        };
        const { data } = await phpApi.post(phpRoutes.orders, fullData);
        return { id: data?.id, orderNo: data?.orderNo };
    };

    // ---------------- Get Orders + Stats ----------------
    const fetchOrdersAndStats = async () => {
        try {
            const { data } = await phpApi.get(phpRoutes.orders, {
                params: { pageSize: 1000 },
            });
            const ordersList = Array.isArray(data?.orders) ? data.orders : [];

            let total = 0;
            let today = 0;
            let yesterday = 0;
            let thisWeek = 0;
            let thisMonth = 0;
            let thisYear = 0;

            // Status counts
            let statusCounts = {
                success: 0,
                failed: 0,
                processing: 0,
            };

            const now = new Date();
            const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
            const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
            const yesterdayEnd = new Date(todayStart);
            const weekStart = new Date(now);
            const dayOfWeek = weekStart.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            weekStart.setDate(weekStart.getDate() - diff); weekStart.setHours(0, 0, 0, 0);
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const yearStart = new Date(now.getFullYear(), 0, 1);

            ordersList.forEach((orderItem) => {
                total++;

                // Count status
                if (orderItem.status && statusCounts[orderItem.status] !== undefined) {
                    statusCounts[orderItem.status]++;
                }

                const createdDate = orderItem.createdAt?.toDate
                    ? orderItem.createdAt.toDate()
                    : orderItem.createdAt
                        ? new Date(orderItem.createdAt)
                        : null;

                if (createdDate && !Number.isNaN(createdDate.getTime())) {
                    if (createdDate >= todayStart) today++;
                    if (createdDate >= yesterdayStart && createdDate < yesterdayEnd) yesterday++;
                    if (createdDate >= weekStart) thisWeek++;
                    if (createdDate >= monthStart) thisMonth++;
                    if (createdDate >= yearStart) thisYear++;
                }
            });

            setOrders(ordersList);
            setStats({
                totalOrders: total,
                todayOrders: today,
                yesterdayOrders: yesterday,
                thisWeekOrders: thisWeek,
                thisMonthOrders: thisMonth,
                thisYearOrders: thisYear,
                statusCounts,
            });
        } catch (error) {
            console.error("Error fetching orders:", error);
            setOrders([]);
            setStats({
                totalOrders: 0,
                todayOrders: 0,
                yesterdayOrders: 0,
                thisWeekOrders: 0,
                thisMonthOrders: 0,
                thisYearOrders: 0,
                statusCounts: { success: 0, failed: 0, processing: 0 },
            });
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchOrdersAndStats();
    }, [user]);

    // ---------------- Update Functions ----------------
    const updateOrderStatus = async (orderId, status) => {
        if (!orderId) throw new Error("Order ID is required");
        if (!["success", "failed", "processing"].includes(status)) {
            throw new Error("Invalid status. Must be 'success', 'failed', or 'processing'");
        }
        await phpApi.patch(`${phpRoutes.orders}/${orderId}`, { status });
    };

    const updateOrderId = async (orderId, newOrderId) => {
        if (!orderId) throw new Error("Order ID is required");
        if (!newOrderId) throw new Error("New Order ID is required");
        await phpApi.patch(`${phpRoutes.orders}/${orderId}`, { id: newOrderId });
    };

    const updateInvoice = async (orderId, invoice = ["No Invoice"]) => {
        if (!orderId) throw new Error("Order ID is required");
        // console.log("Updating invoice for order:", orderId, invoice.invoiceNo);
        await phpApi.patch(`${phpRoutes.orders}/${orderId}`, {
            invoice: {
                invoiceNo: invoice.invoiceNo || "No Invoice",
                invoiceDate: invoice.invoiceDate || "No Invoice",
                totalAmount: invoice.totalAmount || "No Invoice",
                amountInWords: invoice.amountInWords || "No Invoice",
                receiverDetails: {
                    name: invoice.receiver?.name || "No Invoice",
                    address: invoice.receiver?.address || "No Invoice",
                    city: invoice.receiver?.city || "No Invoice",
                    state: invoice.receiver?.state || "No Invoice",
                    pincode: invoice.receiver?.pincode || "No Invoice",
                    contact: invoice.receiver?.contact || "No Invoice",
                },
            },
        });
    };

    return { createOrder, orders, getOrders, stats, loading, updateOrderStatus, updateOrderId, updateInvoice };
};
