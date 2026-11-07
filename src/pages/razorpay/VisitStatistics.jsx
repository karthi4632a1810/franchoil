import { useMemo, useEffect } from "react";
import { Eye, Globe, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { StatCard } from "../../components/razorpay/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useVisitStatistics, useVisitTracker } from "../../hooks/useVisitTracker";
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

// Page Distribution Pie Chart
const PageDistributionChart = ({ pageCounts }) => {
    const topPages = Object.entries(pageCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const data = {
        labels: topPages.map(([page]) => {
            // Shorten long page paths
            if (page.length > 20) {
                return page.substring(0, 17) + "...";
            }
            return page || "Unknown";
        }),
        datasets: [
            {
                data: topPages.map(([, count]) => count),
                backgroundColor: [
                    "hsl(142, 76%, 36%)",
                    "hsl(221, 83%, 53%)",
                    "hsl(357, 91%, 55%)",
                    "hsl(45, 93%, 47%)",
                    "hsl(280, 67%, 47%)",
                ],
                borderColor: [
                    "hsl(142, 76%, 36%)",
                    "hsl(221, 83%, 53%)",
                    "hsl(357, 91%, 55%)",
                    "hsl(45, 93%, 47%)",
                    "hsl(280, 67%, 47%)",
                ],
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

// Hourly Visits Bar Chart
const HourlyVisitsChart = ({ hourlyVisits }) => {
    // Generate all 24 hours and fill in the data
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const visitData = hours.map((hour) => hourlyVisits[hour] || 0);

    const data = {
        labels: hours,
        datasets: [
            {
                label: "Visits",
                data: visitData,
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
                text: "Visits by Hour (Last 24 Hours)",
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
            x: {
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    font: {
                        size: 10,
                    },
                },
            },
        },
    };

    return <Bar data={data} options={options} />;
};

export default function VisitStatistics() {
    const { stats, loading, error } = useVisitStatistics();
    const { cleanupOldData } = useVisitTracker();

    // Clean up old data on component mount and periodically
    useEffect(() => {
        // Clean up immediately
        cleanupOldData();

        // Set up periodic cleanup every hour
        const cleanupInterval = setInterval(() => {
            cleanupOldData();
        }, 60 * 60 * 1000); // Every hour

        return () => clearInterval(cleanupInterval);
    }, [cleanupOldData]);

    // Calculate additional stats
    const additionalStats = useMemo(() => {
        const pageCounts = stats.pageCounts || {};
        const pages = Object.entries(pageCounts);
        const mostVisitedPage = pages.length > 0
            ? pages.sort(([, a], [, b]) => b - a)[0]
            : ["N/A", 0];

        return {
            mostVisitedPage: mostVisitedPage[0],
            mostVisitedCount: mostVisitedPage[1],
            averageVisitsPerPage: stats.uniquePages > 0
                ? Math.round((stats.totalVisits / stats.uniquePages) * 10) / 10
                : 0,
        };
    }, [stats]);

    if (loading) {
        return (
            <div className="min-h-screen overflow-y-scroll bg-background p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
                    <div className="text-muted-foreground">Loading visit statistics...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen overflow-y-scroll bg-background p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-red-600">Error loading statistics: {error.message}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen overflow-y-scroll bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                            Visit Statistics
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Real-time analytics for the last 24 hours
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-4">Visit Overview</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Visits"
                            value={stats.totalVisits || 0}
                            icon={Eye}
                            subtitle="Last 24 hours"
                        />
                        <StatCard
                            title="Unique Pages"
                            value={stats.uniquePages || 0}
                            icon={Globe}
                            subtitle="Pages visited"
                        />
                        <StatCard
                            title="Most Visited"
                            value={additionalStats.mostVisitedCount || 0}
                            icon={TrendingUp}
                            subtitle={additionalStats.mostVisitedPage && additionalStats.mostVisitedPage.length > 30
                                ? additionalStats.mostVisitedPage.substring(0, 27) + "..."
                                : additionalStats.mostVisitedPage || "N/A"}
                        />
                        <StatCard
                            title="Avg per Page"
                            value={additionalStats.averageVisitsPerPage || 0}
                            icon={BarChart3}
                            subtitle="Average visits"
                        />
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-border/50 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Page Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                {Object.keys(stats.pageCounts || {}).length > 0 ? (
                                    <PageDistributionChart pageCounts={stats.pageCounts} />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        No visit data available
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Hourly Visits</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                {Object.keys(stats.hourlyVisits || {}).length > 0 ? (
                                    <HourlyVisitsChart hourlyVisits={stats.hourlyVisits} />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        No visit data available
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Pages Table */}
                {Object.keys(stats.pageCounts || {}).length > 0 && (
                    <Card className="border-border/50 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Top Visited Pages</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border/50">
                                            <th className="text-left py-3 px-4 font-semibold text-foreground">
                                                Page
                                            </th>
                                            <th className="text-right py-3 px-4 font-semibold text-foreground">
                                                Visits
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(stats.pageCounts)
                                            .sort(([, a], [, b]) => b - a)
                                            .slice(0, 10)
                                            .map(([page, count], index) => (
                                                <tr
                                                    key={page}
                                                    className="border-b border-border/30 hover:bg-muted/50 transition-colors"
                                                >
                                                    <td className="py-3 px-4 text-foreground">
                                                        {page || "Unknown"}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-medium text-foreground">
                                                        {count}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

