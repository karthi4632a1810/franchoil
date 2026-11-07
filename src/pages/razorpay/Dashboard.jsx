import { useMemo } from "react";
import { LayoutDashboard, Users, ShoppingCart, IndianRupee, TrendingUp, Calendar, CheckCircle2, AlertTriangle } from "lucide-react";
import { StatCard } from "../../components/razorpay/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useRazorpayOrdersComplete } from "../../hooks/useRazorpayOrdersComplete";
import { MonthlyOrdersReport } from "../../components/razorpay/MonthlyOrdersReport";
import useUser from "../../hooks/useUser";
import { isDisplayFailed, isDisplayPaid } from "../../lib/razorpayOrderStatus";
import { Bar, Pie } from "react-chartjs-2";
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
} from "chart.js";

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement);

// User Pie Chart
const UserPieChart = ({ totalUsers, activeUsers, inactiveUsers, todayUsers }) => {
    const data = {
        labels: ["Active Users", "Inactive Users", "Today's New"],
        datasets: [
            {
                data: [activeUsers, inactiveUsers, todayUsers],
                backgroundColor: ["hsl(142, 76%, 36%)", "hsl(357, 91%, 55%)", "hsl(221, 83%, 53%)"],
                borderColor: ["hsl(142, 76%, 36%)", "hsl(357, 91%, 55%)", "hsl(221, 83%, 53%)"],
                borderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "right",
                labels: {
                    boxWidth: 20,
                    padding: 15,
                    font: {
                        size: 12,
                    },
                },
            },
        },
    };

    return <Pie data={data} options={options} />;
};

// Order Pie Chart
const OrderPieChart = ({ totalOrders, paidOrders, failedOrders, todayOrders }) => {
    const data = {
        labels: ["Paid Orders", "Failed Orders", "Today's Orders"],
        datasets: [
            {
                data: [paidOrders, failedOrders, todayOrders],
                backgroundColor: ["hsl(142, 76%, 36%)", "hsl(357, 91%, 55%)", "hsl(221, 83%, 53%)"],
                borderColor: ["hsl(142, 76%, 36%)", "hsl(357, 91%, 55%)", "hsl(221, 83%, 53%)"],
                borderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "right",
                labels: {
                    boxWidth: 20,
                    padding: 15,
                    font: {
                        size: 12,
                    },
                },
            },
        },
    };

    return <Pie data={data} options={options} />;
};

// User Bar Chart
const UserBarChart = ({ stats }) => {
    const data = {
        labels: ["Today", "Yesterday", "This Week", "This Month", "This Year"],
        datasets: [
            {
                label: "Users",
                data: [
                    stats.todayUsers || 0,
                    stats.yesterdayUsers || 0,
                    stats.thisWeekUsers || 0,
                    stats.thisMonthUsers || 0,
                    stats.thisYearUsers || 0,
                ],
                backgroundColor: "hsl(142, 76%, 36%)",
                borderColor: "hsl(142, 71%, 45%)",
                borderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: "User Growth Overview",
                font: {
                    size: 14,
                    weight: "bold",
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                },
            },
        },
    };

    return <Bar data={data} options={options} />;
};

// Order Bar Chart
const OrderBarChart = ({ stats }) => {
    const data = {
        labels: ["Today", "Yesterday", "This Week", "This Month", "This Year"],
        datasets: [
            {
                label: "Orders",
                data: [
                    stats.todayOrders || 0,
                    stats.yesterdayOrders || 0,
                    stats.thisWeekOrders || 0,
                    stats.thisMonthOrders || 0,
                    stats.thisYearOrders || 0,
                ],
                backgroundColor: "hsl(142, 76%, 36%)",
                borderColor: "hsl(142, 71%, 45%)",
                borderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: "Order Growth Overview",
                font: {
                    size: 14,
                    weight: "bold",
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                },
            },
        },
    };

    return <Bar data={data} options={options} />;
};

export default function Dashboard() {
    const { orders: razorpayOrders } = useRazorpayOrdersComplete();
    const { userData } = useUser();

    const parseOrderDate = (value) => {
        if (!value) return null;
        if (value?.toDate && typeof value.toDate === "function") return value.toDate();
        if (typeof value === "object" && value._seconds) return new Date(Number(value._seconds) * 1000);
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    };

    // Include all users from DB (registered + anonymous)
    const actualUsers = useMemo(() => userData, [userData]);

    // Calculate stats for actual users only (excluding anonymous users)
    const userStats = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = new Date(todayStart);
        const weekStart = new Date(now);
        const dayOfWeek = weekStart.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(weekStart.getDate() - diff);
        weekStart.setHours(0, 0, 0, 0);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const yearStart = new Date(now.getFullYear(), 0, 1);

        let totalUsers = 0;
        let activeUsers = 0;
        let inactiveUsers = 0;
        let todayUsers = 0;
        let yesterdayUsers = 0;
        let thisWeekUsers = 0;
        let thisMonthUsers = 0;
        let thisYearUsers = 0;

        actualUsers.forEach((user) => {
            totalUsers++;
            if (user.blocked) {
                inactiveUsers++;
            } else {
                activeUsers++;
            }

            if (user.createdAt?.toDate) {
                const createdDate = user.createdAt.toDate();
                if (createdDate >= todayStart) todayUsers++;
                if (createdDate >= yesterdayStart && createdDate < yesterdayEnd) yesterdayUsers++;
                if (createdDate >= weekStart) thisWeekUsers++;
                if (createdDate >= monthStart) thisMonthUsers++;
                if (createdDate >= yearStart) thisYearUsers++;
            }
        });

        return {
            totalUsers,
            activeUsers,
            inactiveUsers,
            todayUsers,
            yesterdayUsers,
            thisWeekUsers,
            thisMonthUsers,
            thisYearUsers,
        };
    }, [actualUsers]);

    // Calculate all order stats from Razorpay orders only (ignore old Cashfree orders)
    const orderStats = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = new Date(todayStart);
        const weekStart = new Date(now);
        const dayOfWeek = weekStart.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(weekStart.getDate() - diff);
        weekStart.setHours(0, 0, 0, 0);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const yearStart = new Date(now.getFullYear(), 0, 1);

        const total = razorpayOrders.length;
        const successfulOrders = razorpayOrders.filter((o) => o.isValid);
        const totalRevenue = successfulOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
        const successRate = total > 0 ? Math.round((successfulOrders.length / total) * 100) : 0;

        let todayOrders = 0;
        let todayPaidOrders = 0;
        let todayFailedOrders = 0;
        let yesterdayOrders = 0;
        let thisWeekOrders = 0;
        let thisMonthOrders = 0;
        let thisYearOrders = 0;

        razorpayOrders.forEach((order) => {
            const orderDate = parseOrderDate(order.createdAt) || parseOrderDate(order.webhookReceivedAt);
            if (orderDate) {
                if (orderDate >= todayStart) {
                    todayOrders++;
                    if (isDisplayPaid(order)) todayPaidOrders++;
                    if (isDisplayFailed(order)) todayFailedOrders++;
                }
                if (orderDate >= yesterdayStart && orderDate < yesterdayEnd) yesterdayOrders++;
                if (orderDate >= weekStart) thisWeekOrders++;
                if (orderDate >= monthStart) thisMonthOrders++;
                if (orderDate >= yearStart) thisYearOrders++;
            }
        });

        return {
            totalOrders: total,
            todayOrders,
            todayPaidOrders,
            todayFailedOrders,
            yesterdayOrders,
            thisWeekOrders,
            thisMonthOrders,
            thisYearOrders,
            revenue: totalRevenue,
            successRate,
            paidCount: successfulOrders.length,
            failedCount: total - successfulOrders.length,
        };
    }, [razorpayOrders]);

    return (
        <div className="min-h-screen overflow-y-scroll bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                            Dashboard Analytics
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Comprehensive overview of orders and users
                        </p>
                    </div>
                </div>

                {/* Stats Grid - Orders */}
                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-4">Orders Overview</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Orders"
                            value={orderStats.totalOrders || 0}
                            icon={ShoppingCart}
                            subtitle="All time (Razorpay only)"
                        />
                        <StatCard
                            title="Total Revenue"
                            value={`₹${orderStats.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                            icon={IndianRupee}
                            subtitle="From successful payments"
                        />
                        <StatCard
                            title="Success Rate"
                            value={`${orderStats.successRate}%`}
                            icon={TrendingUp}
                            subtitle="Payment completion"
                        />
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-3 mt-2">Today</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <StatCard
                            title="Today's Total Orders"
                            value={orderStats.todayOrders || 0}
                            icon={Calendar}
                            subtitle="All orders today"
                            className="bg-blue-50 border-blue-200"
                        />
                        <StatCard
                            title="Today's Paid Orders"
                            value={orderStats.todayPaidOrders || 0}
                            icon={CheckCircle2}
                            subtitle="Successfully paid today"
                            className="bg-green-50 border-green-200"
                        />
                        <StatCard
                            title="Today's Failed Orders"
                            value={orderStats.todayFailedOrders || 0}
                            icon={AlertTriangle}
                            subtitle="Payment failed today"
                            className="bg-red-50 border-red-200"
                        />
                    </div>
                </div>

                {/* Charts - Orders */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-border/50 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Order Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <OrderPieChart
                                    totalOrders={orderStats.totalOrders || 0}
                                    paidOrders={orderStats.paidCount || 0}
                                    failedOrders={orderStats.failedCount || 0}
                                    todayOrders={orderStats.todayOrders || 0}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Order Growth</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <OrderBarChart stats={orderStats} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Monthly Orders & Product Sales Breakdown */}
                <div className="pt-2">
                    <MonthlyOrdersReport orders={razorpayOrders} />
                </div>

                {/* Stats Grid - Users */}
                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-4">Users Overview</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Users"
                            value={userStats.totalUsers || 0}
                            icon={Users}
                            subtitle="All time"
                        />
                        <StatCard
                            title="Active Users"
                            value={userStats.activeUsers || 0}
                            icon={TrendingUp}
                            subtitle="Currently active"
                        />
                        <StatCard
                            title="Inactive Users"
                            value={userStats.inactiveUsers || 0}
                            icon={Users}
                            subtitle="Blocked users"
                        />
                        <StatCard
                            title="Today's Users"
                            value={userStats.todayUsers || 0}
                            icon={Calendar}
                            subtitle="New users today"
                        />
                    </div>
                </div>

                {/* Charts - Users */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-border/50 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">User Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <UserPieChart
                                    totalUsers={userStats.totalUsers || 0}
                                    activeUsers={userStats.activeUsers || 0}
                                    inactiveUsers={userStats.inactiveUsers || 0}
                                    todayUsers={userStats.todayUsers || 0}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">User Growth</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <UserBarChart stats={userStats} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
