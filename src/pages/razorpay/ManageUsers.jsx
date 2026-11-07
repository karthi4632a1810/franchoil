import { useState, useMemo } from "react";
import { Users, Search, UserCheck, UserX, Mail, Phone, Calendar, Shield, ShoppingCart, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import useUser from "../../hooks/useUser";
import useAuth from "../../hooks/useAuth";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { firestore as db } from "../../firebase/config";

export default function ManageUsers() {
    const { userData, loading, toggleBlockUser } = useUser();
    const { user: currentUser } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [blocking, setBlocking] = useState(null);
    const [expandedUserId, setExpandedUserId] = useState(null);
    const [cart, setCart] = useState({});
    const [favs, setFavs] = useState({});

    const parseUserDate = (value) => {
        if (!value) return null;
        if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
        if (typeof value?.toDate === "function") {
            const firestoreDate = value.toDate();
            return firestoreDate instanceof Date && !Number.isNaN(firestoreDate.getTime())
                ? firestoreDate
                : null;
        }
        if (typeof value === "number" || typeof value === "string") {
            const parsed = new Date(value);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        }
        if (typeof value === "object" && typeof value.seconds === "number") {
            const parsed = new Date(value.seconds * 1000);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        }
        return null;
    };

    // Filter out anonymous users
    const actualUsers = useMemo(() => {
        return userData.filter(user => {
            const email = user.email;
            if (!email || typeof email !== 'string') return false;
            const trimmedEmail = email.trim();
            return trimmedEmail !== '' && trimmedEmail.includes('@') && trimmedEmail.includes('.');
        });
    }, [userData]);

    // Filter users based on search, date, and status
    const filteredUsers = useMemo(() => {
        return actualUsers.filter((user) => {
            // Search filter
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                !searchQuery ||
                user.name?.toLowerCase().includes(q) ||
                user.email?.toLowerCase().includes(q) ||
                user.phone?.toLowerCase().includes(q) ||
                user.uid?.toLowerCase().includes(q);

            // Status filter
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && !user.blocked) ||
                (statusFilter === "inactive" && user.blocked);

            // Date filter
            let matchesDate = true;
            const created = parseUserDate(user.createdAt);
            if (created) {
                const now = new Date();
                
                if (dateFilter === 'today') {
                    const todayStart = new Date(now);
                    todayStart.setHours(0, 0, 0, 0);
                    matchesDate = created >= todayStart;
                } else if (dateFilter === 'lastWeek') {
                    const lastWeek = new Date();
                    lastWeek.setDate(now.getDate() - 7);
                    matchesDate = created >= lastWeek;
                } else if (dateFilter === 'lastMonth') {
                    const lastMonth = new Date();
                    lastMonth.setMonth(now.getMonth() - 1);
                    matchesDate = created >= lastMonth;
                } else if (dateFilter === 'lastYear') {
                    const lastYear = new Date();
                    lastYear.setFullYear(now.getFullYear() - 1);
                    matchesDate = created >= lastYear;
                } else if (dateFilter === 'custom' && customStart && customEnd) {
                    const start = new Date(customStart);
                    const end = new Date(customEnd);
                    end.setHours(23, 59, 59, 999);
                    matchesDate = created >= start && created <= end;
                }
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [actualUsers, searchQuery, dateFilter, statusFilter, customStart, customEnd]);

    // Recalculate stats for filtered users
    const filteredStats = useMemo(() => {
        const total = filteredUsers.length;
        const active = filteredUsers.filter(u => !u.blocked).length;
        const inactive = filteredUsers.filter(u => u.blocked).length;
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const today = filteredUsers.filter(u => {
            const createdDate = parseUserDate(u.createdAt);
            return createdDate && createdDate >= todayStart;
        }).length;

        return { total, active, inactive, today };
    }, [filteredUsers]);

    // Fetch cart data for a user (use getDocs instead of onSnapshot for admin panel)
    const getCartData = async (userId) => {
        if (!userId || cart[userId]) return; // Don't refetch if already loaded
        
        try {
            const cartQ = query(
                collection(db, 'users', userId, 'cart'),
                orderBy('createdAt', 'desc')
            );

            const snap = await getDocs(cartQ);
            const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setCart((prev) => ({ ...prev, [userId]: items }));
        } catch (error) {
            console.error("Error fetching cart:", error);
        }
    };

    // Fetch favorites data for a user (use getDocs instead of onSnapshot for admin panel)
    const getFavData = async (userId) => {
        if (!userId || favs[userId]) return; // Don't refetch if already loaded
        
        try {
            const favQ = query(
                collection(db, 'users', userId, 'favorites'),
                orderBy('createdAt', 'desc')
            );

            const snap = await getDocs(favQ);
            const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setFavs((prev) => ({ ...prev, [userId]: items }));
        } catch (error) {
            console.error("Error fetching favorites:", error);
        }
    };


    const handleToggleBlock = async (id, currentStatus) => {
        setBlocking(id);
        try {
            await toggleBlockUser(id, !currentStatus);
        } catch (err) {
            console.error("Error updating block status:", err);
            alert("Error updating user status: " + err.message);
        } finally {
            setBlocking(null);
        }
    };

    const handleExpand = (userId) => {
        if (expandedUserId === userId) {
            setExpandedUserId(null);
        } else {
            setExpandedUserId(userId);
            getCartData(userId);
            getFavData(userId);
        }
    };

    const formatDate = (timestamp) => {
        const date = parseUserDate(timestamp);
        if (!date) return "—";
        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatTimestamp = (timestamp) => {
        const date = parseUserDate(timestamp);
        if (!date) return 'N/A';
        return date.toLocaleString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatAddress = (address) => {
        if (!address) return 'N/A';
        const parts = [
            address.line1,
            address.line2,
            address.street,
            address.landmark,
            address.city,
            address.state,
            address.pincode,
            address.country,
        ].filter(Boolean);
        return parts.length ? parts.join(', ') : 'N/A';
    };

    return (
        <div className="min-h-screen overflow-y-scroll bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                            User Management
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage and monitor all registered users
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-border/50 shadow-md">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">{filteredStats.total}</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-green-700/10">
                                    <Users className="h-5 w-5 text-green-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50 shadow-md">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">{filteredStats.active}</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-green-700/10">
                                    <UserCheck className="h-5 w-5 text-green-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50 shadow-md">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Inactive Users</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">{filteredStats.inactive}</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-green-700/10">
                                    <UserX className="h-5 w-5 text-green-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50 shadow-md">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Today's Users</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">{filteredStats.today}</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-green-700/10">
                                    <Calendar className="h-5 w-5 text-green-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="border-border/50 shadow-md">
                    <CardContent className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-card border-border/50 focus-visible:ring-green-700/30"
                                />
                            </div>
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:ring-green-700/30"
                            >
                                <option value="all">All Dates</option>
                                <option value="today">Today</option>
                                <option value="lastWeek">Last Week</option>
                                <option value="lastMonth">Last Month</option>
                                <option value="lastYear">Last Year</option>
                                <option value="custom">Custom Range</option>
                            </select>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:ring-green-700/30"
                            >
                                <option value="all">All Users</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            {dateFilter === 'custom' && (
                                <div className="flex gap-2">
                                    <Input
                                        type="date"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="h-9 text-sm"
                                    />
                                    <Input
                                        type="date"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="h-9 text-sm"
                                    />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Users List */}
                <div className="space-y-3">
                    {loading ? (
                        <Card className="border-border/50 shadow-md">
                            <CardContent className="p-12 text-center">
                                <p className="text-muted-foreground">Loading users...</p>
                            </CardContent>
                        </Card>
                    ) : filteredUsers.length === 0 ? (
                        <Card className="border-border/50 shadow-md">
                            <CardContent className="p-12 text-center">
                                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground text-lg font-medium">No users found</p>
                                <p className="text-muted-foreground text-sm mt-1">
                                    {searchQuery || dateFilter !== "all" || statusFilter !== "all"
                                        ? "Try adjusting your filters"
                                        : "No users have registered yet"}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredUsers.map((user) => (
                            <Card key={user.id} className="border-border/50 shadow-md">
                                <CardContent className="p-0">
                                    <div className="p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                {user.photoURL ? (
                                                    <img
                                                        src={user.photoURL}
                                                        alt={user.name || "User"}
                                                        className="h-12 w-12 rounded-full object-cover border border-border/50"
                                                    />
                                                ) : (
                                                    <div className="h-12 w-12 rounded-full bg-green-700/10 flex items-center justify-center">
                                                        <Users className="h-6 w-6 text-green-700" />
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-lg font-semibold">{user.name || "—"}</h3>
                                                        {user.blocked && (
                                                            <Badge variant="destructive">Blocked</Badge>
                                                        )}
                                                        {currentUser?.uid === user.uid && (
                                                            <Badge variant="outline">
                                                                <Shield className="h-3 w-3 mr-1" />
                                                                You
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            <span>{user.email || "—"}</span>
                                                        </div>
                                                        {user.phone && (
                                                            <div className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                <span>{user.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleExpand(user.id)}
                                                >
                                                    {expandedUserId === user.id ? (
                                                        <>
                                                            <ChevronUp className="h-4 w-4 mr-1" />
                                                            Hide
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="h-4 w-4 mr-1" />
                                                            View Profile
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant={user.blocked ? "default" : "destructive"}
                                                    size="sm"
                                                    onClick={() => handleToggleBlock(user.id, user.blocked)}
                                                    disabled={blocking === user.id || currentUser?.uid === user.uid}
                                                    className={user.blocked ? "bg-green-700 hover:bg-green-800" : ""}
                                                >
                                                    {blocking === user.id
                                                        ? "Updating..."
                                                        : user.blocked
                                                        ? "Unblock"
                                                        : "Block"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedUserId === user.id && (
                                        <div className="border-t border-border/50 bg-muted/30 p-5 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                                                        Phone
                                                    </span>
                                                    <span className="font-medium">{user.phone || "N/A"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                                                        Address
                                                    </span>
                                                    <span className="font-medium">{formatAddress(user.address)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                                                        Last Login
                                                    </span>
                                                    <span className="font-medium">{formatTimestamp(user.lastLoginAt)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                                                        Created At
                                                    </span>
                                                    <span className="font-medium">{formatTimestamp(user.createdAt)}</span>
                                                </div>
                                            </div>

                                            {/* Cart */}
                                            <div className="border-t border-border/50 pt-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <ShoppingCart className="h-4 w-4 text-green-700" />
                                                    <h4 className="text-sm font-semibold text-foreground">Cart</h4>
                                                </div>
                                                <div className="flex flex-wrap gap-3">
                                                    {cart[user.id]?.length > 0 ? (
                                                        cart[user.id].map((item) => (
                                                            <div
                                                                key={item.id}
                                                                className="flex items-center gap-3 bg-card p-3 rounded-lg border border-border/50"
                                                            >
                                                                {item.imageURL && (
                                                                    <img
                                                                        src={item.imageURL}
                                                                        alt={item.title}
                                                                        className="w-12 h-12 object-cover rounded"
                                                                    />
                                                                )}
                                                                <div>
                                                                    <p className="font-medium text-sm">{item.title}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Qty: {item.qty || 1} | ₹{item.price || 0}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">No items in cart</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Favorites */}
                                            <div className="border-t border-border/50 pt-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Heart className="h-4 w-4 text-pink-600" />
                                                    <h4 className="text-sm font-semibold text-foreground">Favorites</h4>
                                                </div>
                                                <div className="flex flex-wrap gap-3">
                                                    {favs[user.id]?.length > 0 ? (
                                                        favs[user.id].map((item) => (
                                                            <div
                                                                key={item.id}
                                                                className="flex items-center gap-3 bg-card p-3 rounded-lg border border-border/50"
                                                            >
                                                                {item.imageURL && (
                                                                    <img
                                                                        src={item.imageURL}
                                                                        alt={item.title}
                                                                        className="w-12 h-12 object-cover rounded"
                                                                    />
                                                                )}
                                                                <div>
                                                                    <p className="font-medium text-sm">{item.title}</p>
                                                                    <p className="text-xs text-muted-foreground">₹{item.price || 0}</p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">No favorites yet</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
