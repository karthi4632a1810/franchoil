import { useState, useMemo, Fragment } from "react";
import {
    Calendar,
    IndianRupee,
    Package,
    ShoppingCart,
    Download,
    Search,
    Filter,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Grid,
    List,
    BarChart3,
    Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { getProductCoverImage } from "../../utils/productImages";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
} from "chart.js";

ChartJS.register(
    Title,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement
);

/**
 * MonthlyOrdersReport
 * Displays monthly aggregated order amounts (revenue) and detailed product sales breakdown by product name.
 * Features elevated UI aesthetics, interactive month selection, dual-axis bar charts, expandable monthly product breakdown,
 * product sales matrix grid, and CSV export.
 */
export function MonthlyOrdersReport({ orders = [] }) {
    const [selectedMonth, setSelectedMonth] = useState("all");
    const [statusFilter, setStatusFilter] = useState("paid"); // "paid" | "all"
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedMonth, setExpandedMonth] = useState(null);
    const [viewMode, setViewMode] = useState("table"); // "table" | "grid"
    const [sortBy, setSortBy] = useState("qty"); // "qty" | "value" | "name"

    // 1. Normalize and parse order dates and amounts
    const processedOrders = useMemo(() => {
        return orders.map((order) => {
            // Parse Date
            let date = null;
            if (order.createdAt?.toDate && typeof order.createdAt.toDate === "function") {
                date = order.createdAt.toDate();
            } else if (order.webhookReceivedAt?.toDate && typeof order.webhookReceivedAt.toDate === "function") {
                date = order.webhookReceivedAt.toDate();
            } else if (order.webhookReceivedAt) {
                const d = new Date(typeof order.webhookReceivedAt === 'number' ? order.webhookReceivedAt * 1000 : order.webhookReceivedAt);
                if (!isNaN(d.getTime())) date = d;
            } else if (order.createdAt) {
                const d = new Date(order.createdAt);
                if (!isNaN(d.getTime())) date = d;
            }

            // Parse Amount (handle paise vs rupees)
            let rawAmount = order.amount || 0;
            if (typeof rawAmount === 'string') rawAmount = parseFloat(rawAmount) || 0;
            const amountInRupees = typeof rawAmount === 'number' ? (rawAmount > 1000 ? rawAmount / 100 : rawAmount) : 0;

            // Is Paid/Valid
            const isPaid = !!(order.isValid || order.payment_status === "captured" || order.status === "success");

            // Extract cart/items
            const items = Array.isArray(order.cart) && order.cart.length > 0
                ? order.cart
                : (Array.isArray(order.items) ? order.items : []);

            const monthKey = date
                ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
                : "Unknown Month";

            const monthLabel = date
                ? date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                : "Unknown Month";

            return {
                ...order,
                parsedDate: date,
                monthKey,
                monthLabel,
                amountInRupees,
                isPaid,
                items,
            };
        });
    }, [orders]);

    // 2. Extract available months (sorted latest first)
    const availableMonths = useMemo(() => {
        const monthMap = new Map();
        processedOrders.forEach((order) => {
            if (order.monthKey !== "Unknown Month") {
                monthMap.set(order.monthKey, order.monthLabel);
            }
        });
        const sorted = Array.from(monthMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
        return sorted.map(([key, label]) => ({ key, label }));
    }, [processedOrders]);

    // 3. Monthly aggregated metrics (Revenue, Order Count, Product Quantities)
    const monthlySummary = useMemo(() => {
        const map = new Map();

        processedOrders.forEach((order) => {
            if (statusFilter === "paid" && !order.isPaid) return;

            const key = order.monthKey;
            const label = order.monthLabel;

            if (!map.has(key)) {
                map.set(key, {
                    monthKey: key,
                    monthLabel: label,
                    totalOrders: 0,
                    paidOrders: 0,
                    totalRevenue: 0,
                    totalProductsQty: 0,
                    productMap: new Map(), // name -> { name, qty, totalValue, orderCount, imageURL }
                });
            }

            const monthData = map.get(key);
            monthData.totalOrders += 1;
            if (order.isPaid) monthData.paidOrders += 1;
            monthData.totalRevenue += order.amountInRupees;

            // Process products in order
            order.items.forEach((item) => {
                const title = item.title || item.name || item.productName || "Unknown Product";
                const qty = Number(item.qty || item.quantity || item.count || 1);
                const price = Number(item.price || item.unitPrice || 0);
                const itemTotalValue = qty * price > 0 ? qty * price : order.amountInRupees; // fallback if item price is 0
                const sku = item.sku || item.code || item.id || "";
                const coverImage = getProductCoverImage({ ...item, name: title, sku });

                monthData.totalProductsQty += qty;

                if (!monthData.productMap.has(title)) {
                    monthData.productMap.set(title, {
                        name: title,
                        sku,
                        qty: 0,
                        totalValue: 0,
                        orderCount: 0,
                        imageURL: coverImage,
                    });
                }
                const p = monthData.productMap.get(title);
                p.qty += qty;
                p.totalValue += itemTotalValue;
                p.orderCount += 1;
                if (!p.imageURL || p.imageURL.includes("/product-images/product-images/")) {
                    p.imageURL = coverImage;
                }
            });
        });

        // Convert to sorted array (latest month first)
        return Array.from(map.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
    }, [processedOrders, statusFilter]);

    // 4. Product Sales Breakdown (across selected month or all months)
    const productBreakdown = useMemo(() => {
        const productMap = new Map();
        let totalRevenueSum = 0;
        let totalProductsQtySum = 0;

        processedOrders.forEach((order) => {
            if (statusFilter === "paid" && !order.isPaid) return;
            if (selectedMonth !== "all" && order.monthKey !== selectedMonth) return;

            order.items.forEach((item) => {
                const title = item.title || item.name || item.productName || "Unknown Product";
                const qty = Number(item.qty || item.quantity || item.count || 1);
                const price = Number(item.price || item.unitPrice || 0);
                const itemTotalValue = qty * price > 0 ? qty * price : (order.items.length === 1 ? order.amountInRupees : 0);
                const sku = item.sku || item.code || item.id || "";
                const coverImage = getProductCoverImage({ ...item, name: title, sku });

                totalRevenueSum += itemTotalValue;
                totalProductsQtySum += qty;

                if (!productMap.has(title)) {
                    productMap.set(title, {
                        name: title,
                        sku,
                        imageURL: coverImage,
                        totalQty: 0,
                        totalValue: 0,
                        orderCount: 0,
                        avgUnitPrice: price,
                        monthlyBreakdown: {}, // monthKey -> qty
                    });
                }

                const p = productMap.get(title);
                p.totalQty += qty;
                p.totalValue += itemTotalValue;
                p.orderCount += 1;
                if (!p.imageURL || p.imageURL.includes("/product-images/product-images/")) {
                    p.imageURL = coverImage;
                }
                if (!p.sku && sku) p.sku = sku;
                if (price > 0) p.avgUnitPrice = price;

                p.monthlyBreakdown[order.monthKey] = (p.monthlyBreakdown[order.monthKey] || 0) + qty;
            });
        });

        const list = Array.from(productMap.values()).map((p) => ({
            ...p,
            sharePercent: totalRevenueSum > 0 ? Math.round((p.totalValue / totalRevenueSum) * 100) : 0,
        }));

        // Search query filter
        const filtered = list.filter((p) =>
            searchQuery === "" ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        // Sorting logic
        filtered.sort((a, b) => {
            if (sortBy === "value") return b.totalValue - a.totalValue;
            if (sortBy === "name") return a.name.localeCompare(b.name);
            return b.totalQty - a.totalQty; // default: qty
        });

        return {
            products: filtered,
            totalRevenueSum,
            totalProductsQtySum,
        };
    }, [processedOrders, statusFilter, selectedMonth, searchQuery, sortBy]);

    // 5. High-level Summary Metrics for the Cards
    const overallStats = useMemo(() => {
        let totalRevenue = 0;
        let totalOrders = 0;
        let totalQtySold = 0;

        const filteredOrders = processedOrders.filter((order) => {
            if (statusFilter === "paid" && !order.isPaid) return false;
            if (selectedMonth !== "all" && order.monthKey !== selectedMonth) return false;
            return true;
        });

        filteredOrders.forEach((order) => {
            totalOrders += 1;
            totalRevenue += order.amountInRupees;
            order.items.forEach((i) => {
                totalQtySold += Number(i.qty || i.quantity || i.count || 1);
            });
        });

        const topProduct = productBreakdown.products.length > 0 ? productBreakdown.products[0] : null;

        return {
            totalRevenue,
            totalOrders,
            totalQtySold,
            topProduct,
            uniqueProductsCount: productBreakdown.products.length,
        };
    }, [processedOrders, statusFilter, selectedMonth, productBreakdown]);

    // 6. Data for Monthly Revenue & Orders Chart
    const chartData = useMemo(() => {
        const labels = monthlySummary.map((m) => m.monthLabel).reverse();
        const revenueValues = monthlySummary.map((m) => m.totalRevenue).reverse();
        const productQuantities = monthlySummary.map((m) => m.totalProductsQty).reverse();

        return {
            labels,
            datasets: [
                {
                    label: "Monthly Orders Amount (₹)",
                    data: revenueValues,
                    backgroundColor: "rgba(16, 185, 129, 0.85)", // Emerald Green
                    borderColor: "rgb(16, 185, 129)",
                    borderWidth: 2,
                    borderRadius: 8,
                    yAxisID: "y",
                },
                {
                    label: "No. of Products Sold (Units)",
                    data: productQuantities,
                    backgroundColor: "rgba(99, 102, 241, 0.85)", // Indigo Blue
                    borderColor: "rgb(99, 102, 241)",
                    borderWidth: 2,
                    borderRadius: 8,
                    yAxisID: "y1",
                },
            ],
        };
    }, [monthlySummary]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: "index",
            intersect: false,
        },
        plugins: {
            legend: {
                position: "top",
                labels: {
                    boxWidth: 14,
                    usePointStyle: true,
                    pointStyle: "circle",
                    font: { size: 12, weight: "600" },
                    padding: 16,
                },
            },
            tooltip: {
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                titleFont: { size: 13, weight: "700" },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 10,
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || "";
                        if (label) label += ": ";
                        if (context.dataset.yAxisID === "y") {
                            label += `₹${Number(context.raw).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
                        } else {
                            label += `${context.raw} units`;
                        }
                        return label;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 11 } }
            },
            y: {
                type: "linear",
                display: true,
                position: "left",
                title: { display: true, text: "Orders Amount (₹)", font: { weight: "600", size: 11 } },
                ticks: {
                    callback: (value) => `₹${Number(value).toLocaleString("en-IN")}`,
                    font: { size: 11 }
                },
            },
            y1: {
                type: "linear",
                display: true,
                position: "right",
                grid: { drawOnChartArea: false },
                title: { display: true, text: "Products Sold (Units)", font: { weight: "600", size: 11 } },
                ticks: { font: { size: 11 } }
            },
        },
    };

    // Export CSV handler
    const handleExportCSV = () => {
        if (productBreakdown.products.length === 0) {
            alert("No product data to export");
            return;
        }

        const headers = ["Month Filter", "Product Name", "Product Code / SKU", "No. of Products Sold (Units)", "Total Orders Count", "Total Orders Amount Value (INR)", "Sales Share (%)"];
        const rows = [];

        productBreakdown.products.forEach((p) => {
            const monthText = selectedMonth === "all" ? "All Months" : availableMonths.find((m) => m.key === selectedMonth)?.label || selectedMonth;
            rows.push([
                `"${monthText}"`,
                `"${p.name}"`,
                `"${p.sku || "N/A"}"`,
                p.totalQty,
                p.orderCount,
                p.totalValue.toFixed(2),
                `${p.sharePercent}%`,
            ]);
        });

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `monthly_orders_product_report_${selectedMonth}_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-teal-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-white/10">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider">
                            <TrendingUp className="h-3.5 w-3.5" /> Monthly Sales & Quantity Analytics
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                            Monthly Orders Amount & Product Sales Breakdown
                        </h2>
                        <p className="text-sm text-emerald-100/80 max-w-2xl">
                            Track total revenue value, monthly order counts, and unit quantity sold per product name with real-time aggregated insights.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={handleExportCSV}
                            className="inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all bg-emerald-500 hover:bg-emerald-400 text-slate-950 h-11 px-5 py-2.5 shadow-lg hover:shadow-emerald-500/25 active:scale-95 cursor-pointer"
                        >
                            <Download className="h-4 w-4" />
                            Export Monthly CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Interactive Filter Bar */}
            <div className="bg-card border border-border/80 p-4 sm:p-5 rounded-2xl shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Month Dropdown */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            Select Month
                        </label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                        >
                            <option value="all">📅 All Months Combined</option>
                            {availableMonths.map((m) => (
                                <option key={m.key} value={m.key}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Filter className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            Order Payment Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                        >
                            <option value="paid">✅ Paid & Confirmed Orders Only</option>
                            <option value="all">🌐 All Orders (Paid, Pending & Failed)</option>
                        </select>
                    </div>

                    {/* Search Product */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Search className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            Search Product Name
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Type product name or code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            />
                            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Sort & View Controls */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <BarChart3 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            Sort By & Display Mode
                        </label>
                        <div className="flex items-center gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                            >
                                <option value="qty">Sort by Units Sold (High-Low)</option>
                                <option value="value">Sort by Revenue Value (High-Low)</option>
                                <option value="name">Sort by Product Name (A-Z)</option>
                            </select>

                            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border shrink-0">
                                <button
                                    onClick={() => setViewMode("table")}
                                    title="Table View"
                                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                        viewMode === "table"
                                            ? "bg-background text-emerald-600 shadow-sm font-bold"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <List className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode("grid")}
                                    title="Product Cards Grid View"
                                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                        viewMode === "grid"
                                            ? "bg-background text-emerald-600 shadow-sm font-bold"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <Grid className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Metric Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Monthly Total Amount */}
                <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Monthly Orders Amount Value
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                            <IndianRupee className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                            ₹{overallStats.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                            {selectedMonth === "all" ? "Cumulative Revenue Across All Months" : availableMonths.find((m) => m.key === selectedMonth)?.label}
                        </p>
                    </div>
                </div>

                {/* 2. No. of Products Sold */}
                <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            No. of Products Sold
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
                            <Package className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
                            {overallStats.totalQtySold.toLocaleString("en-IN")} <span className="text-sm font-semibold text-muted-foreground">units</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500" />
                            Across {overallStats.uniqueProductsCount} distinct products
                        </p>
                    </div>
                </div>

                {/* 3. Total Orders Count */}
                <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Total Orders Count
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                            <ShoppingCart className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                            {overallStats.totalOrders}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {statusFilter === "paid" ? "Confirmed Paid Orders" : "All Processed Orders"}
                        </p>
                    </div>
                </div>

                {/* 4. Top Selling Product */}
                <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Top Product by Quantity
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                            <Award className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-base font-bold text-foreground truncate">
                            {overallStats.topProduct ? overallStats.topProduct.name : "N/A"}
                        </div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                            {overallStats.topProduct ? (
                                <>
                                    <span>{overallStats.topProduct.totalQty} units sold</span>
                                    <span className="text-muted-foreground">({overallStats.topProduct.sharePercent}% share)</span>
                                </>
                            ) : (
                                "No sales data"
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Dual-Axis Visual Chart: Monthly Revenue & Products Sold */}
            <Card className="border-border/80 shadow-sm overflow-hidden rounded-2xl">
                <CardHeader className="bg-muted/30 border-b border-border/60 py-4 px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                            <BarChart3 className="h-5 w-5 text-emerald-600" />
                            Monthly Orders Revenue & Product Volume Growth
                        </CardTitle>
                        <span className="text-xs font-medium text-muted-foreground">
                            Comparing Monthly Orders Amount (₹) vs No. of Products Sold (Units)
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="h-[340px] w-full">
                        {monthlySummary.length > 0 ? (
                            <Bar data={chartData} options={chartOptions} />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm space-y-2">
                                <Package className="h-10 w-10 text-muted-foreground/40" />
                                <span>No order data available for the selected filters.</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Monthly Orders Amount Summary Table */}
            <Card className="border-border/80 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 dark:bg-slate-900/60 border-b border-border/60 py-4 px-6">
                    <CardTitle className="text-base font-bold flex items-center justify-between text-foreground">
                        <span className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-emerald-600" />
                            Monthly Orders Amount Value Summary
                        </span>
                        <span className="text-xs text-muted-foreground font-normal bg-background px-3 py-1 rounded-full border border-border">
                            💡 Click "View Products" to expand monthly product list
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm table-fixed border-collapse">
                            <thead className="bg-slate-100/90 dark:bg-slate-800/80 border-b border-border text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="py-4 px-6 w-[20%] text-left">Month</th>
                                    <th className="py-4 px-6 w-[18%] text-center">Paid / Total Orders</th>
                                    <th className="py-4 px-6 w-[18%] text-center">No. of Products Sold</th>
                                    <th className="py-4 px-6 w-[20%] text-right">Total Monthly Amount (₹)</th>
                                    <th className="py-4 px-6 w-[14%] text-right">Average Order Value</th>
                                    <th className="py-4 px-6 w-[10%] text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {monthlySummary.map((m) => {
                                    const avgOrderValue = m.paidOrders > 0 ? m.totalRevenue / m.paidOrders : 0;
                                    const isExpanded = expandedMonth === m.monthKey;
                                    const isSelected = selectedMonth === m.monthKey;

                                    return (
                                        <Fragment key={m.monthKey}>
                                            <tr className={`hover:bg-accent/40 transition-colors ${isSelected ? "bg-emerald-500/10 font-semibold" : ""}`}>
                                                <td className="py-4 px-6 font-bold text-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                                                        <span>{m.monthLabel}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                                                        <span>{m.paidOrders} / {m.totalOrders} paid</span>
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                        {m.totalProductsQty.toLocaleString("en-IN")} units
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right font-extrabold text-emerald-700 dark:text-emerald-300 text-base">
                                                    ₹{m.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-4 px-6 text-right text-muted-foreground font-medium">
                                                    ₹{avgOrderValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMonth(m.monthKey);
                                                            setExpandedMonth(isExpanded ? null : m.monthKey);
                                                        }}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border whitespace-nowrap ${
                                                            isExpanded
                                                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                                                : "bg-background hover:bg-muted text-foreground border-border"
                                                        }`}
                                                    >
                                                        {isExpanded ? "Hide" : "View"}
                                                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Expanded inline drawer showing monthly product list */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={6} className="bg-slate-50/90 dark:bg-slate-900/60 p-5">
                                                        <div className="bg-background rounded-2xl border border-border p-5 space-y-4 shadow-inner">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                                    <Package className="h-4 w-4 text-emerald-600" />
                                                                    Product Breakdown for {m.monthLabel}
                                                                </h4>
                                                                <span className="text-xs text-muted-foreground font-medium">
                                                                    {m.productMap.size} unique products sold
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                {Array.from(m.productMap.values()).map((p, idx) => (
                                                                    <div key={idx} className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/80 bg-card hover:border-emerald-500/50 transition-colors shadow-sm">
                                                                        <img
                                                                            src={p.imageURL || getProductCoverImage(p)}
                                                                            alt={p.name}
                                                                            onError={(e) => {
                                                                                const fallback = getProductCoverImage(p);
                                                                                if (e.currentTarget.src !== fallback) {
                                                                                    e.currentTarget.src = fallback;
                                                                                }
                                                                            }}
                                                                            className="w-12 h-12 rounded-xl object-contain bg-slate-50 dark:bg-slate-800 p-1 border border-border shrink-0 shadow-sm"
                                                                        />
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs font-bold text-foreground truncate">{p.name}</p>
                                                                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                                                                                {p.qty} units sold <span className="text-muted-foreground font-normal">({p.orderCount} orders)</span>
                                                                            </p>
                                                                        </div>
                                                                        <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                                                                            ₹{p.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                                {monthlySummary.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                            No monthly orders found matching the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Product-Wise Sales & Quantity Section (No of products with Product Name) */}
            <Card className="border-border/80 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 dark:bg-slate-900/60 border-b border-border/60 py-4 px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                                <Package className="h-5 w-5 text-emerald-600" />
                                Product Wise Quantity & Amount Value Breakdown
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Displaying unit sales count (No. of Products) with Product Name and Total Revenue generated
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-medium bg-background px-3 py-1 rounded-full border border-border">
                                Showing {productBreakdown.products.length} products
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {viewMode === "table" ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm table-fixed border-collapse">
                                <thead className="bg-slate-100/90 dark:bg-slate-800/80 border-b border-border text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="py-4 px-6 w-[8%] text-left">#</th>
                                        <th className="py-4 px-6 w-[32%] text-left">Product Name</th>
                                        <th className="py-4 px-6 w-[20%] text-center">No. of Products Sold (Qty)</th>
                                        <th className="py-4 px-6 w-[15%] text-center">Total Orders</th>
                                        <th className="py-4 px-6 w-[15%] text-right">Total Amount Value (₹)</th>
                                        <th className="py-4 px-6 w-[10%] text-right">Sales Share</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {productBreakdown.products.map((product, index) => (
                                        <tr key={index} className="hover:bg-accent/40 transition-colors">
                                            <td className="py-4 px-6 text-xs font-mono text-muted-foreground font-bold">
                                                {index + 1}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3.5">
                                                    <img
                                                        src={product.imageURL || getProductCoverImage(product)}
                                                        alt={product.name}
                                                        onError={(e) => {
                                                            const fallback = getProductCoverImage(product);
                                                            if (e.currentTarget.src !== fallback) {
                                                                e.currentTarget.src = fallback;
                                                            }
                                                        }}
                                                        className="w-12 h-12 rounded-xl object-contain bg-slate-50 dark:bg-slate-800 p-1 border border-border shrink-0 shadow-sm"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-foreground text-sm truncate">{product.name}</p>
                                                        <p className="text-xs text-muted-foreground font-medium truncate">
                                                            {product.sku ? `SKU: ${product.sku}` : "Ayurvedic Product"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                    {product.totalQty.toLocaleString("en-IN")} units
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center text-foreground font-semibold">
                                                {product.orderCount} orders
                                            </td>
                                            <td className="py-4 px-6 text-right font-extrabold text-emerald-700 dark:text-emerald-300 text-base">
                                                ₹{product.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-16 bg-muted rounded-full h-2 overflow-hidden border border-border">
                                                        <div
                                                            className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500"
                                                            style={{ width: `${Math.min(product.sharePercent, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-muted-foreground w-8 text-right">
                                                        {product.sharePercent}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {productBreakdown.products.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-muted-foreground space-y-2">
                                                <Package className="h-10 w-10 mx-auto text-muted-foreground/30" />
                                                <p className="text-sm font-medium">No product sales data found matching your filters.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* Product Matrix Grid View Mode */
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {productBreakdown.products.map((product, index) => (
                                <div key={index} className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all space-y-4 relative group">
                                    <div className="flex items-start gap-4">
                                        <img
                                            src={product.imageURL || getProductCoverImage(product)}
                                            alt={product.name}
                                            onError={(e) => {
                                                const fallback = getProductCoverImage(product);
                                                if (e.currentTarget.src !== fallback) {
                                                    e.currentTarget.src = fallback;
                                                }
                                            }}
                                            className="w-14 h-14 rounded-2xl object-contain bg-slate-50 dark:bg-slate-800 p-1.5 border border-border shrink-0 shadow-sm"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                                Rank #{index + 1}
                                            </span>
                                            <h3 className="font-bold text-foreground text-sm mt-1 truncate">{product.name}</h3>
                                            <p className="text-xs text-muted-foreground">{product.sku ? `SKU: ${product.sku}` : "Ayurvedic Product"}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/60">
                                        <div className="bg-muted/40 p-3 rounded-xl border border-border/50">
                                            <span className="text-[11px] font-semibold text-muted-foreground uppercase block">No. of Products</span>
                                            <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                                                {product.totalQty} <span className="text-xs font-normal">units</span>
                                            </span>
                                        </div>
                                        <div className="bg-muted/40 p-3 rounded-xl border border-border/50">
                                            <span className="text-[11px] font-semibold text-muted-foreground uppercase block">Total Amount</span>
                                            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                                                ₹{product.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                                            <span>Revenue Contribution</span>
                                            <span className="text-foreground font-bold">{product.sharePercent}%</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border">
                                            <div
                                                className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full"
                                                style={{ width: `${Math.min(product.sharePercent, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {productBreakdown.products.length === 0 && (
                                <div className="col-span-full py-12 text-center text-muted-foreground">
                                    No products matching your search query.
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
