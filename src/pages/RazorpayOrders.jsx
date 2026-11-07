import { useState, useMemo, useEffect } from "react";
import { CreditCard, IndianRupee, CheckCircle2, Calendar } from "lucide-react";
import { StatCard } from "../../components/razorpay/StatCard";
import { SearchFilters } from "../../components/razorpay/SearchFilters";
import { OrdersTable } from "../../components/razorpay/OrdersTable";
import { useRazorpayOrders } from "../hooks/useRazorpayOrders";
import useAuth from "../hooks/useAuth";
import { motion } from "framer-motion";

// Mock data based on actual Firestore structure
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

export default function RazorpayOrders() {
    const { orders } = useRazorpayOrders();
    const { user, logout, loading } = useAuth();
    const isAdmin = !!user && ADMIN_EMAILS.includes(user.email || '');
    useEffect(() => {
        if (!isAdmin && !loading) {
            window.location.href = "/";
        }
    }, [loading]);

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Filter orders based on search and status
    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const matchesSearch =
                searchQuery === "" ||
                order.razorpay_order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.razorpay_payment_id.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "paid" && order.isValid) ||
                (statusFilter === "failed" && !order.isValid);

            return matchesSearch && matchesStatus;
        });
    }, [orders, searchQuery, statusFilter]);

    // Calculate stats
    const stats = useMemo(() => {
        const total = orders.length;
        const successfulOrders = orders.filter((o) => o.isValid);
        const totalRevenue = successfulOrders.reduce((sum, o) => sum + o.amount, 0);
        const successRate = total > 0 ? Math.round((successfulOrders.length / total) * 100) : 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = orders.filter((o) => {
            const orderDate = o.createdAt?.toDate();
            return orderDate && orderDate >= today;
        });

        return {
            total,
            revenue: totalRevenue,
            successRate,
            todayCount: todayOrders.length,
        };
    }, [orders]);

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
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Orders"
                            value={stats.total}
                            icon={CreditCard}
                            subtitle="All time"
                        />
                        <StatCard
                            title="Total Revenue"
                            value={`₹${(stats.revenue / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                            icon={IndianRupee}
                            subtitle="From successful payments"
                        />
                        <StatCard
                            title="Success Rate"
                            value={`${stats.successRate}%`}
                            icon={CheckCircle2}
                            subtitle="Payment completion"
                        />
                        <StatCard
                            title="Today's Orders"
                            value={stats.todayCount}
                            icon={Calendar}
                            subtitle="Orders today"
                        />
                    </div>

                    {/* Search & Filters */}
                    <SearchFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        statusFilter={statusFilter}
                        onStatusChange={setStatusFilter}
                    />

                    {/* Orders Table */}
                    <OrdersTable orders={filteredOrders} />


                </div>
            </div>
        </section>
    );
}
