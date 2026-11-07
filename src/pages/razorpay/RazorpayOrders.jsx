import { useState, useMemo, useEffect } from "react";
import { CreditCard, IndianRupee, CheckCircle2, Calendar, AlertTriangle } from "lucide-react";
import { StatCard } from "../../components/razorpay/StatCard";
import { SearchFilters } from "../../components/razorpay/SearchFilters";
import { OrdersTable } from "../../components/razorpay/OrdersTable";
import { MonthlyOrdersReport } from "../../components/razorpay/MonthlyOrdersReport";
import { useRazorpayOrdersComplete } from "../../hooks/useRazorpayOrdersComplete";
import useAuth from "../../hooks/useAuth";
import { motion } from "framer-motion";
import { isDisplayFailed, isDisplayPaid } from "../../lib/razorpayOrderStatus";

// Mock data based on actual Firestore structure
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

export default function RazorpayOrders() {
    const { orders, trashOrders, webhooks, initiations, stats: hookStats, loading: hookLoading, refreshOrders } = useRazorpayOrdersComplete();
    const { user, logout, loading } = useAuth();
    const isAdmin = !!user && ADMIN_EMAILS.includes(user.email || '');
    useEffect(() => {
        if (!isAdmin && !loading) {
            window.location.href = "/";
        }
    }, [loading]);

    const [searchQuery, setSearchQuery] = useState("");
    const [cityFilter, setCityFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("paid");
    const [activeTab, setActiveTab] = useState("table");

    // Extract unique cities from orders
    const uniqueCities = useMemo(() => {
        const cities = orders
            .map(order => order.selectedAddress?.city)
            .filter(city => city && city.trim() !== "")
            .map(city => city.trim());
        return [...new Set(cities)].sort();
    }, [orders]);

    // Filter orders based on search and status
    const filteredOrders = useMemo(() => {
        // Use trashOrders if filter is trash, otherwise use active orders
        const sourceOrders = statusFilter === "trash" ? trashOrders : orders;

        return sourceOrders.filter((order) => {
            const query = searchQuery.toLowerCase();
            const cityQuery = cityFilter.toLowerCase();

            const matchesSearch =
                searchQuery === "" ||
                order.razorpay_order_id?.toLowerCase().includes(query) ||
                order.razorpay_payment_id?.toLowerCase().includes(query) ||
                order?.name?.toLowerCase().includes(query) ||
                order?.userName?.toLowerCase().includes(query) ||
                order?.email?.toLowerCase().includes(query) ||
                order?.userEmail?.toLowerCase().includes(query) ||
                order?.phone?.toLowerCase().includes(query) ||
                order?.orderNo?.toString().includes(query);

            const matchesCity =
                cityFilter === "all" ||
                order.selectedAddress?.city?.toLowerCase() === cityFilter.toLowerCase();

            const paidForFilter = isDisplayPaid(order);
            const failedForFilter = isDisplayFailed(order);
            const isPending =
                !paidForFilter && !failedForFilter;

            const matchesStatus =
                statusFilter === "all" ||
                statusFilter === "trash" || // trash filter already selected correct source
                (statusFilter === "paid" && paidForFilter) ||
                (statusFilter === "failed" && failedForFilter) ||
                (statusFilter === "pending" && isPending);

            return matchesSearch && matchesStatus && matchesCity;
        });
    }, [orders, trashOrders, searchQuery, statusFilter, cityFilter]);

    // Calculate stats (use hook stats + additional calculations)
    const stats = useMemo(() => {
        const successfulOrders = orders.filter((o) => isDisplayPaid(o));
        const totalRevenue = successfulOrders.reduce((sum, o) => {
            // Amount is stored in paise (divide by 100) or rupees
            const amount = typeof o.amount === 'number' ? (o.amount > 1000 ? o.amount / 100 : o.amount) : 0;
            return sum + amount;
        }, 0);
        const successRate = hookStats.totalOrders > 0
            ? Math.round((hookStats.paidOrders / hookStats.totalOrders) * 100)
            : 0;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const getOrderDate = (order) => {
            if (order.createdAt?.toDate) return order.createdAt.toDate();
            if (order.webhookReceivedAt?.toDate) return order.webhookReceivedAt.toDate();
            if (order.createdAt) return new Date(order.createdAt);
            if (order.webhookReceivedAt) return new Date(order.webhookReceivedAt);
            return null;
        };

        const isToday = (order) => {
            const orderDate = getOrderDate(order);
            return orderDate && orderDate >= todayStart;
        };

        const todayOrders = orders.filter(isToday);
        const todayPaid = todayOrders.filter((o) => isDisplayPaid(o));
        const todayFailed = todayOrders.filter((o) => isDisplayFailed(o));

        return {
            total: hookStats.totalOrders,
            revenue: totalRevenue,
            successRate,
            todayCount: todayOrders.length,
            todayPaidCount: todayPaid.length,
            todayFailedCount: todayFailed.length,
            paidOrders: hookStats.paidOrders,
            pendingOrders: hookStats.pendingOrders,
            failedOrders: hookStats.failedOrders,
            trashOrders: hookStats.trashOrders,
        };
    }, [orders, hookStats]);

    function mapOrderToInvoice(order) {
        return {
            invoiceNo: order.razorpay_order_id,
            invoiceDate: order.createdAt?.toDate().toLocaleDateString(),

            receiver: {
                name: order.selectedAddress?.name || "Customer",
                address: order.selectedAddress?.line1,
                city: order.selectedAddress?.city,
                state: order.selectedAddress?.state,
                pincode: order.selectedAddress?.pincode,
                contact: "",
                gstin: "",
            },

            consignee: {
                name: order.selectedAddress?.name || "Customer",
                address: order.selectedAddress?.line1,
                city: order.selectedAddress?.city,
                state: order.selectedAddress?.state,
                pincode: order.selectedAddress?.pincode,
                contact: "",
            },

            items: order.cart.map((item) => ({
                code: item.sku,
                name: item.title,
                hsn: "3004",
                unit: item.price,
                qty: item.qty,
                cgstRate: 2.5,
                sgstRate: 2.5,
            })),

            amountInWords: "Rupees only",
            terms: [
                "Goods once sold will not be taken back",
                "Subject to Chennai jurisdiction",
            ],
        };
    }

    return (
        <section className="w-full grid-cols-[300px_1fr]">
            <div className="min-h-screen overflow-y-scroll bg-background p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                                Razorpay Payments
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Monitor and manage all payment transactions
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                if (!orders.length) return alert("No orders to export");
                                const headers = ["Order ID", "Invoice No", "Date", "Name", "Email", "Phone", "Amount", "Status", "Source"];
                                const csvContent = [
                                    headers.join(","),
                                    ...orders.map(order => [
                                        order.razorpay_order_id || "N/A",
                                        order.razorpay_order_id || "N/A",
                                        new Date(order.createdAt?.toDate ? order.createdAt.toDate() : (order.webhookReceivedAt ? new Date(order.webhookReceivedAt * 1000) : order.createdAt)).toLocaleDateString(),
                                        `"${order.name || order.userName || "N/A"}"`,
                                        order.email || order.userEmail || "N/A",
                                        order.phone || order.userPhone || "N/A",
                                        order.amount,
                                        order.payment_status || order.status,
                                        order.source
                                    ].join(","))
                                ].join("\n");

                                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                                const link = document.createElement("a");
                                link.href = URL.createObjectURL(blob);
                                link.download = `razorpay_orders_${new Date().toISOString().split('T')[0]}.csv`;
                                link.click();
                            }}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                        >
                            Export CSV
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <StatCard
                            title="Total Orders"
                            value={stats.total}
                            icon={CreditCard}
                            subtitle="All time"
                        />
                        <StatCard
                            title="Total Revenue"
                            value={`₹${stats.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                            icon={IndianRupee}
                            subtitle="From successful payments"
                        />
                        <StatCard
                            title="Success Rate"
                            value={`${stats.successRate}%`}
                            icon={CheckCircle2}
                            subtitle="Payment completion"
                        />
                    </div>

                    {/* Today's Orders */}
                    <h2 className="text-lg font-semibold text-foreground mb-3 mt-2">Today</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <StatCard
                            title="Today's Total Orders"
                            value={stats.todayCount}
                            icon={Calendar}
                            subtitle="All orders today"
                            className="bg-blue-50 border-blue-200"
                        />
                        <StatCard
                            title="Today's Paid Orders"
                            value={stats.todayPaidCount}
                            icon={CheckCircle2}
                            subtitle="Successfully paid today"
                            className="bg-green-50 border-green-200"
                        />
                        <StatCard
                            title="Today's Failed Orders"
                            value={stats.todayFailedCount}
                            icon={AlertTriangle}
                            subtitle="Payment failed today"
                            className="bg-red-50 border-red-200"
                        />
                    </div>

                    {/* All-time Status Cards */}
                    <h2 className="text-lg font-semibold text-foreground mb-3">All time</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <StatCard
                            title="Paid Orders"
                            value={stats.paidOrders}
                            icon={CheckCircle2}
                            subtitle="Successfully paid"
                            className="bg-green-50 border-green-200"
                        />
                        <StatCard
                            title="Pending Orders"
                            value={stats.pendingOrders}
                            icon={Calendar}
                            subtitle="Awaiting payment"
                            className="bg-yellow-50 border-yellow-200"
                        />
                        <StatCard
                            title="Failed Orders"
                            value={stats.failedOrders}
                            icon={AlertTriangle}
                            subtitle="Payment failed"
                            className="bg-red-50 border-red-200"
                        />
                        <StatCard
                            title="Trash (Deleted)"
                            value={stats.trashOrders}
                            icon={AlertTriangle}
                            subtitle="Deleted orders"
                            className="bg-gray-100 border-gray-200"
                        />
                    </div>

                    {/* View Selection Tabs */}
                    <div className="flex items-center gap-2 border-b border-border pb-3 mb-6">
                        <button
                            onClick={() => setActiveTab("table")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                                activeTab === "table"
                                    ? "bg-emerald-600 text-white shadow-md"
                                    : "bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <CreditCard className="w-4 h-4" />
                            All Orders Table
                        </button>
                        <button
                            onClick={() => setActiveTab("monthly")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                                activeTab === "monthly"
                                    ? "bg-emerald-600 text-white shadow-md"
                                    : "bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <Calendar className="w-4 h-4" />
                            Monthly Product & Revenue Breakdown
                        </button>
                    </div>

                    {activeTab === "table" ? (
                        <>
                            {/* Search & Filters */}
                            <SearchFilters
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                                statusFilter={statusFilter}
                                onStatusChange={setStatusFilter}
                                cityFilter={cityFilter}
                                onCityChange={setCityFilter}
                                uniqueCities={uniqueCities}
                            />

                            {/* Orders Table */}
                            <OrdersTable
                                orders={filteredOrders}
                                allOrders={orders}
                                onOrderAdded={refreshOrders}
                                isTrash={statusFilter === 'trash'}
                            />
                        </>
                    ) : (
                        <MonthlyOrdersReport orders={orders} />
                    )}


                </div>
            </div>
        </section>
    );
}
