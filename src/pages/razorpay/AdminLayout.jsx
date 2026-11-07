import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
    LayoutDashboard,
    MessageSquare,
    Package,
    Users,
    ShoppingCart,
    FileText,
    BarChart3,
    Calendar,
    Truck,
    Menu,
    X,
    LogOut
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { phpApi, phpRoutes } from "../../lib/phpApi";

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

const defaultMenuItems = [
    { path: "/admin/panel/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/panel/orders", icon: ShoppingCart, label: "View Orders" },
    { path: "/admin/panel/order-tracking", icon: Truck, label: "Order Tracking" },
    { path: "/admin/panel/monthly-reports", icon: Calendar, label: "Monthly Reports" },
    { path: "/admin/panel/enquiry", icon: MessageSquare, label: "Enquiry" },
    { path: "/admin/panel/products", icon: Package, label: "Manage Products" },
    { path: "/admin/panel/users", icon: Users, label: "User Management" },
    { path: "/admin/panel/blogs", icon: FileText, label: "Manage Blogs" },
    { path: "/admin/panel/visit-statistics", icon: BarChart3, label: "Visit Statistics" },
];

const iconMap = {
    LayoutDashboard,
    Calendar,
    MessageSquare,
    Package,
    Users,
    FileText,
    ShoppingCart,
    BarChart3,
    Truck,
};

let cachedAdminMenus = null;

export default function AdminLayout() {
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [menuItems, setMenuItems] = useState(() => cachedAdminMenus || defaultMenuItems);
    const [loggingOut, setLoggingOut] = useState(false);
    const isAdmin = !!user && ADMIN_EMAILS.includes(user.email || '');

    const handleLogout = async () => {
        if (loggingOut) return;
        try {
            setLoggingOut(true);
            await logout();
            navigate("/auth", { replace: true });
        } finally {
            setLoggingOut(false);
        }
    };

    useEffect(() => {
        if (!isAdmin && !loading) {
            window.location.href = "/";
        }
    }, [isAdmin, loading]);

    useEffect(() => {
        if (cachedAdminMenus && cachedAdminMenus.length > 0) return;
        let active = true;
        const loadMenus = async () => {
            try {
                const { data } = await phpApi.get(phpRoutes.adminMenus);
                const remoteMenus = Array.isArray(data?.menus) ? data.menus : [];
                if (!active || remoteMenus.length === 0) return;
                const mapped = remoteMenus.map((item) => ({
                    path: item.path,
                    label: item.label,
                    icon: iconMap[item.icon] || LayoutDashboard,
                }));
                cachedAdminMenus = mapped;
                setMenuItems(mapped);
            } catch {
                // Keep default hardcoded menu if API is unavailable.
            }
        };
        loadMenus();
        return () => {
            active = false;
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside
                className={`
                    bg-gradient-to-b from-green-900 via-teal-900 to-blue-900
                    text-white
                    transition-all duration-300 ease-in-out
                    ${sidebarOpen ? "w-64" : "w-0"}
                    fixed md:sticky
                    top-0
                    h-screen
                    z-50
                    overflow-hidden
                `}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-white/10">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold">Admin Panel</h1>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="md:hidden text-white hover:text-gray-200"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={(e) => {
                                        if (location.pathname === item.path) {
                                            e.preventDefault();
                                        }
                                    }}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-lg
                                        transition-all duration-200
                                        ${isActive
                                            ? "bg-white/20 text-white shadow-lg"
                                            : "text-white/80 hover:bg-white/10 hover:text-white"
                                        }
                                    `}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="p-4 border-t border-white/10">
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-60"
                        >
                            <LogOut className="h-4 w-4" />
                            {loggingOut ? "Logging out..." : "Logout"}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {/* Mobile Header */}
                <div className="md:hidden bg-white border-b border-border/50 p-4 flex items-center justify-between sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-foreground hover:text-green-700"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <h2 className="text-lg font-semibold text-foreground">Admin Panel</h2>
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="text-sm text-red-600 hover:text-red-700 disabled:opacity-60"
                    >
                        {loggingOut ? "..." : "Logout"}
                    </button>
                </div>

                {/* Page Content */}
                <Outlet />
            </main>
        </div>
    );
}
