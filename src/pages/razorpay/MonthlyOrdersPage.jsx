import { useEffect } from "react";
import { MonthlyOrdersReport } from "../../components/razorpay/MonthlyOrdersReport";
import { useRazorpayOrdersComplete } from "../../hooks/useRazorpayOrdersComplete";
import useAuth from "../../hooks/useAuth";
import { RefreshCw, ShieldAlert } from "lucide-react";

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

export default function MonthlyOrdersPage() {
    const { orders, loading, refreshOrders } = useRazorpayOrdersComplete();
    const { user, loading: authLoading } = useAuth();
    const isAdmin = !!user && ADMIN_EMAILS.includes(user.email || "");

    useEffect(() => {
        if (!isAdmin && !authLoading) {
            window.location.href = "/";
        }
    }, [isAdmin, authLoading]);

    if (authLoading || (loading && !orders.length)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-6">
                <div className="flex items-center gap-3 text-emerald-600 font-semibold text-lg">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    Loading Monthly Order Reports...
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-6">
                <div className="text-center space-y-3">
                    <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
                    <h2 className="text-xl font-bold">Access Denied</h2>
                    <p className="text-muted-foreground text-sm">
                        You do not have administrative permissions to view this report.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                            Monthly Orders & Products Analytics
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Detailed breakdown of monthly sales values, product counts, and order statistics
                        </p>
                    </div>

                    <button
                        onClick={refreshOrders}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-foreground font-semibold text-sm rounded-xl transition-all self-start sm:self-auto cursor-pointer"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh Data
                    </button>
                </div>

                {/* Main Monthly Report Component */}
                <MonthlyOrdersReport orders={orders} />
            </div>
        </div>
    );
}
