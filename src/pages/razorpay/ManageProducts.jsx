import { useState, useMemo, useEffect, useRef } from "react";
import {
    Package,
    Search,
    Plus,
    Edit2,
    Trash2,
    X,
    Image as ImageIcon,
    Download,
    Upload,
    ChevronLeft,
    ChevronRight,
    Star,
    Eye,
    LayoutGrid,
    Table as TableIcon,
    Sparkles,
    Check,
    AlertCircle,
    Tag,
    Layers,
    ArrowUpDown,
    CheckCircle2,
    ExternalLink,
    RefreshCw
} from "lucide-react";
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
import { useProducts, createProduct, updateProduct, deleteProduct } from "../../hooks/useProducts";
import useStorageUpload from "../../hooks/useStorage";

function emptyProduct() {
    return {
        title: "",
        subTitle: "",
        price: 0,
        originalPrice: 0,
        isDiscountEnabled: false,
        is_discount_enabled: false,
        discountTag: "10%",
        discountBadgeLabel: "SPECIAL OFFER",
        discountPrice: 0,
        discountStrikePrice: 0,
        sku: "",
        stock: 0,
        category: "",
        description: "",
        imageURL: "",
        images: [],
        active: true,
    };
}

function normalizeProduct(p) {
    const isDiscount = Boolean(p.isDiscountEnabled ?? p.is_discount_enabled);
    return {
        title: p.title ?? "",
        subTitle: p.subTitle ?? "",
        price: Number(p.rawPrice ?? p.price) || 0,
        sku: p.sku ?? "",
        originalPrice: Number(p.originalPrice) || 0,
        isDiscountEnabled: isDiscount,
        is_discount_enabled: isDiscount,
        discountTag: p.discountTag ?? p.discount_tag ?? "10%",
        discountBadgeLabel: p.discountBadgeLabel ?? p.discount_badge_label ?? "SPECIAL OFFER",
        discountPrice: Number(p.discountPrice ?? p.discount_price) || 0,
        discountStrikePrice: Number(p.discountStrikePrice ?? p.discount_strike_price) || 0,
        category: p.category ?? "",
        description: p.description ?? "",
        imageURL: p.imageURL ?? ((Array.isArray(p.images) && p.images[0]) || ""),
        images: Array.isArray(p.images) ? p.images : [],
        active: typeof p.active === "boolean" ? p.active : true,
    };
}

export default function ManageProducts() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive' | 'discount' | 'lowstock'
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'

    const { products, setProducts, loading, refresh } = useProducts({ onlyActive: false, search: searchQuery, pageSize: 500 });
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState(emptyProduct());
    const [showForm, setShowForm] = useState(false);
    const [formTab, setFormTab] = useState("basic"); // 'basic' | 'pricing' | 'media' | 'inventory'
    const [saving, setSaving] = useState(false);

    const { upload, progress, url, error: upErr, reset } = useStorageUpload("products");
    const fileRef = useRef(null);
    const [bulk, setBulk] = useState({ running: false, count: 0, done: 0, error: "" });
    const [galleryBusy, setGalleryBusy] = useState(false);
    const [coverBusy, setCoverBusy] = useState(false);
    const [customCoverUrl, setCustomCoverUrl] = useState("");
    const [customGalleryUrl, setCustomGalleryUrl] = useState("");
    const [previewURL, setPreviewURL] = useState("");
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const categories = useMemo(() => {
        const set = new Set();
        products.forEach((p) => {
            if (p.category && p.category.trim()) set.add(p.category.trim());
        });
        return Array.from(set);
    }, [products]);

    const startNew = () => {
        setEditing(null);
        setDraft(emptyProduct());
        setFormTab("basic");
        setCustomCoverUrl("");
        setCustomGalleryUrl("");
        reset();
        setShowForm(true);
    };

    const startEdit = (p) => {
        setEditing(p.id);
        const isDiscount = Boolean(p.isDiscountEnabled ?? p.is_discount_enabled);
        const rawImages = Array.isArray(p.images) && p.images.length > 0
            ? [...p.images]
            : (p.imageURL ? [p.imageURL] : []);

        setDraft({
            ...p,
            images: rawImages,
            imageURL: p.imageURL || rawImages[0] || "",
            price: Number(p.rawPrice ?? p.price) || 0,
            originalPrice: Number(p.originalPrice) || 0,
            isDiscountEnabled: isDiscount,
            is_discount_enabled: isDiscount,
            discountTag: p.discountTag ?? p.discount_tag ?? "10%",
            discountBadgeLabel: p.discountBadgeLabel ?? p.discount_badge_label ?? "SPECIAL OFFER",
            discountPrice: Number(p.discountPrice ?? p.discount_price) || 0,
            discountStrikePrice: Number(p.discountStrikePrice ?? p.discount_strike_price) || 0,
        });
        setFormTab("basic");
        setCustomCoverUrl("");
        setCustomGalleryUrl("");
        reset();
        setShowForm(true);
    };

    const save = async () => {
        if (!draft.title?.trim()) {
            alert("Title is required");
            return;
        }
        try {
            setSaving(true);
            const finalImages = Array.isArray(draft.images) ? draft.images.filter(Boolean) : [];
            const isDiscount = Boolean(
                draft.isDiscountEnabled !== undefined
                    ? draft.isDiscountEnabled
                    : draft.is_discount_enabled
            );
            const finalDraft = {
                ...draft,
                isDiscountEnabled: isDiscount,
                is_discount_enabled: isDiscount,
                images: finalImages,
                imageURL: draft.imageURL || finalImages[0] || "",
            };

            if (editing) {
                await updateProduct(editing, finalDraft);
                setProducts((prev) =>
                    prev.map((item) =>
                        String(item.id) === String(editing)
                            ? { ...item, ...finalDraft }
                            : item
                    )
                );
            } else {
                const newId = await createProduct(finalDraft);
                if (newId) {
                    setProducts((prev) => [{ id: String(newId), ...finalDraft }, ...prev]);
                }
            }

            await refresh();
            startNew();
            setShowForm(false);
        } catch (err) {
            console.error("Save product error:", err);
            alert("Error saving product: " + (err.response?.data?.error || err.message || "Unknown error"));
        } finally {
            setSaving(false);
        }
    };

    const toggleProductStatus = async (product) => {
        try {
            const nextActive = !product.active;
            await updateProduct(product.id, {
                ...product,
                active: nextActive,
            });
            setProducts((prev) =>
                prev.map((item) =>
                    String(item.id) === String(product.id)
                        ? { ...item, active: nextActive }
                        : item
                )
            );
            await refresh();
        } catch (err) {
            alert("Error updating product status: " + err.message);
        }
    };

    const remove = async (id) => {
        try {
            await deleteProduct(id);
            setProducts((prev) => prev.filter((item) => String(item.id) !== String(id)));
            if (editing === id) {
                startNew();
                setShowForm(false);
            }
            setDeleteConfirmId(null);
            await refresh();
        } catch (err) {
            alert("Error deleting product: " + err.message);
        }
    };

    const exportJSON = () => {
        const plain = products.map(({ id, title, subTitle, price, sku, originalPrice, isDiscountEnabled, discountTag, discountBadgeLabel, discountPrice, discountStrikePrice, category, description, imageURL, images = [], active, stock }) => ({
            id,
            title,
            subTitle,
            price,
            sku,
            originalPrice,
            isDiscountEnabled: Boolean(isDiscountEnabled),
            discountTag: discountTag || "",
            discountBadgeLabel: discountBadgeLabel || "SPECIAL OFFER",
            discountPrice: Number(discountPrice) || 0,
            discountStrikePrice: Number(discountStrikePrice) || 0,
            category,
            stock: Number(stock) || 0,
            description,
            imageURL,
            images,
            active,
        }));
        const blob = new Blob([JSON.stringify(plain, null, 2)], { type: "application/json" });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `products-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(downloadUrl);
    };

    const importJSON = async (file) => {
        try {
            setBulk({ running: true, count: 0, done: 0, error: "" });
            const text = await file.text();
            const arr = JSON.parse(text);
            if (!Array.isArray(arr)) throw new Error("JSON must be an array of products");
            setBulk((s) => ({ ...s, count: arr.length }));

            for (const raw of arr) {
                const data = normalizeProduct(raw);
                if (raw.id) {
                    await updateProduct(raw.id, data);
                } else {
                    await createProduct(data);
                }
                setBulk((s) => ({ ...s, done: s.done + 1 }));
            }
            await refresh();
        } catch (e) {
            setBulk({ running: false, count: 0, done: 0, error: e?.message || String(e) });
        } finally {
            setBulk((s) => ({ ...s, running: false }));
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    // Cover image upload handler
    const onSelectCover = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCoverBusy(true);
        try {
            const folderSku = (draft.sku || "product").trim().replace(/[^a-zA-Z0-9-_]/g, "_");
            const res = await upload(file, `${folderSku}-cover/`);
            if (res && res.downloadURL) {
                setDraft((d) => {
                    const currentImgs = Array.isArray(d.images) ? [...d.images] : [];
                    const images = currentImgs.includes(res.downloadURL)
                        ? currentImgs
                        : [res.downloadURL, ...currentImgs];
                    return { ...d, imageURL: res.downloadURL, images };
                });
            }
        } catch (err) {
            console.error("Cover upload error:", err);
            alert("Cover upload error: " + (err.message || "Failed to upload cover image"));
        } finally {
            setCoverBusy(false);
            e.target.value = "";
        }
    };

    // Gallery upload handler
    const onSelectGallery = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setGalleryBusy(true);
        try {
            const urls = [];
            const folderSku = (draft.sku || "product").trim().replace(/[^a-zA-Z0-9-_]/g, "_");
            for (const f of files) {
                const res = await upload(f, `gallery/${folderSku}/`);
                if (res && res.downloadURL) {
                    urls.push(res.downloadURL);
                }
            }
            if (urls.length > 0) {
                setDraft((d) => {
                    const currentImgs = Array.isArray(d.images) ? [...d.images] : [];
                    const images = [...currentImgs, ...urls];
                    const imageURL = d.imageURL || images[0] || "";
                    return { ...d, images, imageURL };
                });
            }
        } catch (err) {
            console.error("Gallery upload error:", err);
            alert("Gallery upload error: " + (err.message || "Failed to upload gallery images"));
        } finally {
            setGalleryBusy(false);
            e.target.value = "";
        }
    };

    // Add manual cover image URL
    const addCustomCoverUrl = () => {
        const u = customCoverUrl.trim();
        if (!u) return;
        setDraft((d) => {
            const currentImgs = Array.isArray(d.images) ? [...d.images] : [];
            const images = currentImgs.includes(u) ? currentImgs : [u, ...currentImgs];
            return { ...d, imageURL: u, images };
        });
        setCustomCoverUrl("");
    };

    // Add manual gallery image URL
    const addCustomGalleryUrl = () => {
        const u = customGalleryUrl.trim();
        if (!u) return;
        setDraft((d) => {
            const currentImgs = Array.isArray(d.images) ? [...d.images] : [];
            const images = [...currentImgs, u];
            const imageURL = d.imageURL || images[0] || "";
            return { ...d, images, imageURL };
        });
        setCustomGalleryUrl("");
    };

    // Reorder Gallery Left / Right
    const moveImageLeft = (index) => {
        if (index <= 0) return;
        setDraft((d) => {
            const images = Array.isArray(d.images) ? [...d.images] : [];
            const target = images[index];
            images[index] = images[index - 1];
            images[index - 1] = target;
            const imageURL = d.imageURL || images[0] || "";
            return { ...d, images, imageURL };
        });
    };

    const moveImageRight = (index) => {
        setDraft((d) => {
            const images = Array.isArray(d.images) ? [...d.images] : [];
            if (index >= images.length - 1) return d;
            const target = images[index];
            images[index] = images[index + 1];
            images[index + 1] = target;
            const imageURL = d.imageURL || images[0] || "";
            return { ...d, images, imageURL };
        });
    };

    const removeImage = (img) => {
        setDraft((d) => {
            const images = (d.images || []).filter((u) => u !== img);
            const imageURL = d.imageURL === img ? (images[0] || "") : d.imageURL;
            return { ...d, images, imageURL };
        });
    };

    const makeCover = (img) => setDraft((d) => ({ ...d, imageURL: img }));

    // Filtered products logic
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            // Status filter
            if (statusFilter === "active" && !p.active) return false;
            if (statusFilter === "inactive" && p.active) return false;
            if (statusFilter === "discount" && !p.isDiscountEnabled && !p.is_discount_enabled) return false;
            if (statusFilter === "lowstock" && (Number(p.stock) > 5)) return false;

            // Category filter
            if (categoryFilter !== "all" && p.category !== categoryFilter) return false;

            return true;
        });
    }, [products, statusFilter, categoryFilter]);

    // Stats calculations
    const stats = useMemo(() => {
        const total = products.length;
        const active = products.filter((p) => p.active).length;
        const inactive = total - active;
        const discounted = products.filter((p) => p.isDiscountEnabled || p.is_discount_enabled).length;
        const lowStock = products.filter((p) => Number(p.stock) <= 5).length;
        return { total, active, inactive, discounted, lowStock };
    }, [products]);

    return (
        <div className="min-h-screen overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header with Title and Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white">
                                <Package className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
                                    Manage Products
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                                    Catalog inventory, special discount offers &amp; gallery management
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <Button
                            onClick={exportJSON}
                            variant="outline"
                            size="sm"
                            className="border-slate-200 hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
                        >
                            <Download className="h-4 w-4 mr-1.5 text-slate-500" />
                            Export JSON
                        </Button>
                        <Button
                            onClick={() => fileRef.current?.click()}
                            variant="outline"
                            size="sm"
                            className="border-slate-200 hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
                        >
                            <Upload className="h-4 w-4 mr-1.5 text-slate-500" />
                            Import JSON
                        </Button>
                        <Button
                            onClick={startNew}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-700/20 font-semibold px-4 cursor-pointer"
                        >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Add Product
                        </Button>
                    </div>
                </div>

                {/* Top Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs transition-all hover:shadow-md hover:border-emerald-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Products</p>
                                <p className="text-3xl font-black text-slate-900 mt-1 tabular-nums">{stats.total}</p>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-1">
                                    <Layers className="h-3 w-3" /> Full Catalog
                                </span>
                            </div>
                            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-xs">
                                <Package className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs transition-all hover:shadow-md hover:border-emerald-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Live</p>
                                <p className="text-3xl font-black text-emerald-700 mt-1 tabular-nums">{stats.active}</p>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                                    <CheckCircle2 className="h-3 w-3" /> Visible to Customers
                                </span>
                            </div>
                            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-xs">
                                <Check className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs transition-all hover:shadow-md hover:border-amber-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Special Offers</p>
                                <p className="text-3xl font-black text-amber-600 mt-1 tabular-nums">{stats.discounted}</p>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 mt-1">
                                    <Sparkles className="h-3 w-3" /> Discount Active
                                </span>
                            </div>
                            <div className="p-3 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 shadow-xs">
                                <Sparkles className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Inactive Drafts</p>
                                <p className="text-3xl font-black text-slate-600 mt-1 tabular-nums">{stats.inactive}</p>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 mt-1">
                                    <AlertCircle className="h-3 w-3" /> Hidden from store
                                </span>
                            </div>
                            <div className="p-3 rounded-2xl bg-slate-100 text-slate-600 border border-slate-200 shadow-xs">
                                <Tag className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by product name, SKU, or keyword..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-9 bg-slate-50/70 border-slate-200 rounded-xl focus-visible:ring-emerald-600 focus-visible:border-emerald-600 text-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Category Dropdown */}
                        <div className="flex items-center gap-2">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="h-10 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 focus:ring-emerald-600 focus:border-emerald-600 cursor-pointer"
                            >
                                <option value="all">All Categories ({categories.length})</option>
                                {categories.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>

                            {/* View Switch: Table / Grid */}
                            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/70">
                                <button
                                    onClick={() => setViewMode("table")}
                                    className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${viewMode === "table" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                                    title="Table View"
                                >
                                    <TableIcon className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${viewMode === "grid" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                                    title="Grid Cards View"
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100 text-xs">
                        <span className="text-slate-400 font-medium mr-1">Status:</span>
                        {[
                            { id: "all", label: "All", count: stats.total },
                            { id: "active", label: "Active", count: stats.active },
                            { id: "inactive", label: "Inactive", count: stats.inactive },
                            { id: "discount", label: "Special Offers", count: stats.discounted },
                            { id: "lowstock", label: "Low Stock (≤5)", count: stats.lowStock },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id)}
                                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                                    statusFilter === tab.id
                                        ? "bg-emerald-700 text-white shadow-xs"
                                        : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                    statusFilter === tab.id ? "bg-emerald-900/40 text-white" : "bg-slate-200 text-slate-700"
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Import Status Alert */}
                    {bulk.running && (
                        <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-sm flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin text-emerald-700" />
                            <span>Importing products… ({bulk.done} / {bulk.count})</span>
                        </div>
                    )}
                    {bulk.error && (
                        <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-800 text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span>Import error: {bulk.error}</span>
                        </div>
                    )}
                </div>

                {/* Products Table View */}
                {viewMode === "table" ? (
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-slate-900">Product Catalog</h2>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-semibold text-xs">
                                    {filteredProducts.length} items
                                </Badge>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <div className="h-8 w-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                                <p className="text-sm font-medium text-slate-500">Loading catalog items...</p>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                                <div className="p-4 rounded-full bg-slate-100 text-slate-400 mb-3">
                                    <Package className="h-10 w-10" />
                                </div>
                                <h3 className="text-base font-bold text-slate-800">No products found</h3>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm">
                                    {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                                        ? "No matching products found. Try adjusting or resetting your search & filters."
                                        : "Your catalog is empty. Click '+ Add Product' to create your first product."}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/80">
                                        <TableRow className="border-slate-200/80">
                                            <TableHead className="w-[80px] font-bold text-slate-700 text-xs">Image</TableHead>
                                            <TableHead className="font-bold text-slate-700 text-xs min-w-[220px]">Product Info</TableHead>
                                            <TableHead className="font-bold text-slate-700 text-xs">SKU</TableHead>
                                            <TableHead className="font-bold text-slate-700 text-xs">Selling Price</TableHead>
                                            <TableHead className="font-bold text-slate-700 text-xs">Strike MRP</TableHead>
                                            <TableHead className="font-bold text-slate-700 text-xs">Stock</TableHead>
                                            <TableHead className="font-bold text-slate-700 text-xs">Category</TableHead>
                                            <TableHead className="font-bold text-slate-700 text-xs">Status</TableHead>
                                            <TableHead className="text-right font-bold text-slate-700 text-xs w-[140px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredProducts.map((product) => {
                                            const isOffer = Boolean(product.isDiscountEnabled ?? product.is_discount_enabled);
                                            const finalPrice = isOffer ? (product.discountPrice || product.price || 0) : (product.price || 0);
                                            const strikeVal = isOffer ? (product.discountStrikePrice || product.originalPrice || 0) : (product.originalPrice || 0);
                                            const stockNum = Number(product.stock) || 0;
                                            const galleryCount = Array.isArray(product.images) ? product.images.length : (product.imageURL ? 1 : 0);

                                            return (
                                                <TableRow key={product.id} className="hover:bg-slate-50/60 transition-colors border-slate-100">
                                                    {/* Thumbnail */}
                                                    <TableCell>
                                                        <div className="relative group cursor-pointer" onClick={() => setPreviewURL(product.imageURL || (product.images && product.images[0]))}>
                                                            {product.imageURL ? (
                                                                <img
                                                                    src={product.imageURL}
                                                                    alt={product.title}
                                                                    className="h-14 w-14 object-cover rounded-xl border border-slate-200 shadow-xs group-hover:scale-105 transition-transform"
                                                                />
                                                            ) : (
                                                                <div className="h-14 w-14 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400">
                                                                    <ImageIcon className="h-5 w-5" />
                                                                </div>
                                                            )}
                                                            {galleryCount > 1 && (
                                                                <span className="absolute -bottom-1 -right-1 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full backdrop-blur-xs">
                                                                    +{galleryCount - 1}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    {/* Title & Info */}
                                                    <TableCell>
                                                        <div className="space-y-0.5">
                                                            <div className="font-bold text-slate-900 text-sm hover:text-emerald-700 transition">
                                                                {product.title || "Untitled Product"}
                                                            </div>
                                                            {product.subTitle && (
                                                                <div className="text-xs text-slate-500 line-clamp-1">
                                                                    {product.subTitle}
                                                                </div>
                                                            )}
                                                            {product.description && (
                                                                <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                                                    {product.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    {/* SKU */}
                                                    <TableCell>
                                                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-semibold border border-slate-200/60">
                                                            {product.sku || "—"}
                                                        </span>
                                                    </TableCell>

                                                    {/* Selling Price */}
                                                    <TableCell>
                                                        {isOffer ? (
                                                            <div className="space-y-1">
                                                                <div className="font-black text-emerald-700 text-sm">
                                                                    ₹{finalPrice}
                                                                </div>
                                                                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-xs">
                                                                    <span>✨ {product.discountTag || "10%"}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="font-bold text-slate-900 text-sm">₹{finalPrice}</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Strike MRP */}
                                                    <TableCell>
                                                        {strikeVal > 0 ? (
                                                            <div>
                                                                <span className="text-xs text-slate-400 line-through font-semibold">
                                                                    ₹{strikeVal}
                                                                </span>
                                                                {isOffer && (
                                                                    <span className="text-[10px] text-amber-700 font-semibold block">Strike MRP</span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-300">—</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Stock */}
                                                    <TableCell>
                                                        {stockNum > 10 ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                                                {stockNum} in stock
                                                            </span>
                                                        ) : stockNum > 0 ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                                                                {stockNum} low stock
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200/60">
                                                                Out of stock
                                                            </span>
                                                        )}
                                                    </TableCell>

                                                    {/* Category */}
                                                    <TableCell>
                                                        {product.category ? (
                                                            <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                                                                {product.category}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-slate-300">—</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Status with quick toggle */}
                                                    <TableCell>
                                                        <button
                                                            onClick={() => toggleProductStatus(product)}
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                                                                product.active
                                                                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                                                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                                            }`}
                                                            title="Click to toggle active status"
                                                        >
                                                            <span className={`h-1.5 w-1.5 rounded-full ${product.active ? "bg-emerald-600" : "bg-slate-500"}`} />
                                                            {product.active ? "Active" : "Inactive"}
                                                        </button>
                                                    </TableCell>

                                                    {/* Actions */}
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                                                                onClick={() => setQuickViewProduct(product)}
                                                                title="Preview Product"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                                                                onClick={() => startEdit(product)}
                                                                title="Edit Product"
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                                                onClick={() => setDeleteConfirmId(product.id)}
                                                                title="Delete Product"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Products Grid Cards View */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {loading ? (
                            <div className="col-span-full py-16 flex flex-col items-center justify-center gap-2">
                                <div className="h-8 w-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                                <p className="text-sm text-slate-500 font-medium">Loading catalog cards...</p>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200/80 p-8">
                                <Package className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                                <p className="text-base font-bold text-slate-800">No products found</p>
                            </div>
                        ) : (
                            filteredProducts.map((product) => {
                                const isOffer = Boolean(product.isDiscountEnabled ?? product.is_discount_enabled);
                                const finalPrice = isOffer ? (product.discountPrice || product.price || 0) : (product.price || 0);
                                const strikeVal = isOffer ? (product.discountStrikePrice || product.originalPrice || 0) : (product.originalPrice || 0);

                                return (
                                    <div
                                        key={product.id}
                                        className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between"
                                    >
                                        <div className="relative aspect-4/3 bg-slate-100 overflow-hidden cursor-pointer" onClick={() => setQuickViewProduct(product)}>
                                            {product.imageURL ? (
                                                <img
                                                    src={product.imageURL}
                                                    alt={product.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <ImageIcon className="h-10 w-10" />
                                                </div>
                                            )}
                                            {/* Status Badge */}
                                            <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${product.active ? "bg-emerald-600 text-white" : "bg-slate-700 text-white"}`}>
                                                    {product.active ? "Active" : "Inactive"}
                                                </span>
                                                {isOffer && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-xs">
                                                        ✨ {product.discountTag || "10%"}
                                                    </span>
                                                )}
                                            </div>
                                            {product.category && (
                                                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-[10px] font-bold text-slate-700 shadow-xs">
                                                    {product.category}
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between gap-1 text-[11px] font-mono text-slate-400">
                                                    <span>SKU: {product.sku || "—"}</span>
                                                    <span>Stock: {product.stock || 0}</span>
                                                </div>
                                                <h3 className="font-bold text-slate-900 text-sm line-clamp-1 mt-1 group-hover:text-emerald-700 transition">
                                                    {product.title}
                                                </h3>
                                                {product.subTitle && (
                                                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                                        {product.subTitle}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-base font-black text-emerald-700">₹{finalPrice}</span>
                                                    {strikeVal > 0 && (
                                                        <span className="text-xs text-slate-400 line-through">₹{strikeVal}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-slate-600 hover:text-emerald-700 rounded-md cursor-pointer"
                                                        onClick={() => startEdit(product)}
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-slate-400 hover:text-red-600 rounded-md cursor-pointer"
                                                        onClick={() => setDeleteConfirmId(product.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* Product Add / Edit Modal Sheet */}
                {showForm && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">
                                        {editing ? "Edit Product" : "Create New Product"}
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Fill in the product details, set promotional discount pricing, and organize gallery images.
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setShowForm(false); startNew(); }}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Section Navigation Tabs */}
                            <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-100 bg-white text-xs font-semibold">
                                {[
                                    { id: "basic", label: "1. Basic Details" },
                                    { id: "pricing", label: "2. Pricing & Offers" },
                                    { id: "media", label: "3. Media Gallery (Reorder)" },
                                    { id: "inventory", label: "4. Inventory & Info" },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setFormTab(tab.id)}
                                        className={`pb-2.5 px-3 border-b-2 transition font-bold cursor-pointer ${
                                            formTab === tab.id
                                                ? "border-emerald-600 text-emerald-800"
                                                : "border-transparent text-slate-500 hover:text-slate-800"
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
                                {/* TAB 1: BASIC DETAILS */}
                                {formTab === "basic" && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="text-xs font-bold text-slate-700 uppercase mb-1.5 block">
                                                    Product Title *
                                                </label>
                                                <Input
                                                    value={draft.title}
                                                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                                                    placeholder="e.g. Franch Oil NH* Plus (100ml)"
                                                    className="rounded-xl border-slate-200 focus-visible:ring-emerald-600 font-semibold"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-xs font-bold text-slate-700 uppercase mb-1.5 block">
                                                    Product Subtitle
                                                </label>
                                                <Input
                                                    value={draft.subTitle || ""}
                                                    onChange={(e) => setDraft((d) => ({ ...d, subTitle: e.target.value }))}
                                                    placeholder="e.g. Ayurvedic Multipurpose Pain Relief & Skin Care Oil"
                                                    className="rounded-xl border-slate-200 focus-visible:ring-emerald-600 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 uppercase mb-1.5 block">
                                                    SKU / Unique Identifier *
                                                </label>
                                                <Input
                                                    value={draft.sku}
                                                    onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value }))}
                                                    placeholder="e.g. franch-oil-nh-plus"
                                                    className="rounded-xl border-slate-200 focus-visible:ring-emerald-600 font-mono text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 uppercase mb-1.5 block">
                                                    Category
                                                </label>
                                                <Input
                                                    value={draft.category}
                                                    onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                                                    placeholder="e.g. Wellness, Soaps, Oils"
                                                    className="rounded-xl border-slate-200 focus-visible:ring-emerald-600 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 uppercase mb-1.5 block">
                                                    Catalog Status
                                                </label>
                                                <select
                                                    value={draft.active ? "active" : "inactive"}
                                                    onChange={(e) => setDraft((d) => ({ ...d, active: e.target.value === "active" }))}
                                                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium focus:ring-emerald-600 cursor-pointer"
                                                >
                                                    <option value="active">Active (Visible in Store)</option>
                                                    <option value="inactive">Inactive (Hidden)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 uppercase mb-1.5 block">
                                                    Available Stock Units
                                                </label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={draft.stock}
                                                    onChange={(e) => setDraft((d) => ({ ...d, stock: Number(e.target.value) }))}
                                                    placeholder="100"
                                                    className="rounded-xl border-slate-200 focus-visible:ring-emerald-600"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: PRICING & SPECIAL DISCOUNT */}
                                {formTab === "pricing" && (
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 uppercase mb-1.5 block">
                                                    Standard Price (₹) *
                                                </label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={draft.price}
                                                    onChange={(e) => setDraft((d) => ({ ...d, price: Number(e.target.value) }))}
                                                    placeholder="220"
                                                    className="rounded-xl border-slate-200 font-bold text-slate-900"
                                                />
                                                <span className="text-[11px] text-slate-400 mt-1 block">
                                                    Base price when no special offer is active
                                                </span>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-700 uppercase mb-1.5 block">
                                                    Original Strike MRP (₹)
                                                </label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={draft.originalPrice || 0}
                                                    onChange={(e) => setDraft((d) => ({ ...d, originalPrice: Number(e.target.value) }))}
                                                    placeholder="220"
                                                    className="rounded-xl border-slate-200 text-slate-600"
                                                />
                                                <span className="text-[11px] text-slate-400 mt-1 block">
                                                    Standard crossed-out MRP value
                                                </span>
                                            </div>
                                        </div>

                                        {/* Promotional Discount Offer Box */}
                                        <div className="p-5 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-yellow-50/30 space-y-4 shadow-xs">
                                            <div className="flex items-start gap-3">
                                                <input
                                                    id="enable-discount-offer"
                                                    type="checkbox"
                                                    checked={Boolean(draft.isDiscountEnabled ?? draft.is_discount_enabled)}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setDraft((d) => ({
                                                            ...d,
                                                            isDiscountEnabled: checked,
                                                            is_discount_enabled: checked,
                                                            discountTag: d.discountTag || "10%",
                                                            discountBadgeLabel: d.discountBadgeLabel || "SPECIAL OFFER",
                                                            discountPrice: d.discountPrice || d.price || 0,
                                                            discountStrikePrice: d.discountStrikePrice || d.originalPrice || d.price || 0,
                                                        }));
                                                    }}
                                                    className="mt-1 h-5 w-5 rounded-lg border-amber-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                                                />
                                                <div className="flex-1">
                                                    <label
                                                        htmlFor="enable-discount-offer"
                                                        className="text-sm font-black text-slate-900 cursor-pointer flex items-center gap-2 flex-wrap"
                                                    >
                                                        <span>Enable Special Discount Offer Badge &amp; Pricing</span>
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-xs">
                                                            <span>✨ {draft.discountTag || "10%"}</span>
                                                            <span className="bg-white text-red-600 px-1.5 rounded-full text-[10px] font-extrabold uppercase">
                                                                {draft.discountBadgeLabel || "SPECIAL OFFER"}
                                                            </span>
                                                        </span>
                                                    </label>
                                                    <p className="text-xs text-slate-600 mt-0.5">
                                                        When active, the Discount Price applies automatically across storefront, cart, checkout, invoices, and payment gateways.
                                                    </p>
                                                </div>
                                            </div>

                                            {draft.isDiscountEnabled && (
                                                <div className="space-y-4 pt-3 border-t border-amber-200/80">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                                        <div>
                                                            <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                                                                Offer Tagline (e.g. 10%)
                                                            </label>
                                                            <Input
                                                                value={draft.discountTag || ""}
                                                                onChange={(e) => setDraft((d) => ({ ...d, discountTag: e.target.value }))}
                                                                placeholder="10%"
                                                                className="bg-white border-amber-300 rounded-xl font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                                                                Badge Pill Label
                                                            </label>
                                                            <Input
                                                                value={draft.discountBadgeLabel ?? "SPECIAL OFFER"}
                                                                onChange={(e) => setDraft((d) => ({ ...d, discountBadgeLabel: e.target.value }))}
                                                                placeholder="SPECIAL OFFER"
                                                                className="bg-white border-amber-300 rounded-xl font-bold uppercase text-xs"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-emerald-800 mb-1.5 block">
                                                                Discount Price (₹) *
                                                            </label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                value={draft.discountPrice || 0}
                                                                onChange={(e) => setDraft((d) => ({ ...d, discountPrice: Number(e.target.value) }))}
                                                                placeholder="198"
                                                                className="bg-white border-emerald-400 rounded-xl font-black text-emerald-700 text-base"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-slate-800 mb-1.5 block">
                                                                Discount Strike MRP (₹)
                                                            </label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                value={draft.discountStrikePrice || 0}
                                                                onChange={(e) => setDraft((d) => ({ ...d, discountStrikePrice: Number(e.target.value) }))}
                                                                placeholder="220"
                                                                className="bg-white border-amber-300 rounded-xl"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Live Preview Card */}
                                                    <div className="p-3.5 rounded-xl bg-white border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div>
                                                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block mb-1">
                                                                Live Storefront Preview
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg font-black text-emerald-700">₹{draft.discountPrice || draft.price || 0}</span>
                                                                {(Number(draft.discountStrikePrice) > 0 || Number(draft.originalPrice) > 0) && (
                                                                    <span className="text-xs text-slate-400 line-through">
                                                                        ₹{draft.discountStrikePrice || draft.originalPrice}
                                                                    </span>
                                                                )}
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-xs">
                                                                    {draft.discountTag || "10%"} Offer
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-slate-600 sm:text-right font-medium">
                                                            Customer saves: <strong className="text-emerald-700 font-bold">
                                                                ₹{Math.max(0, Math.round((Number(draft.discountStrikePrice || draft.originalPrice || 0)) - Number(draft.discountPrice || draft.price || 0)))}
                                                            </strong>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* TAB 3: MEDIA & GALLERY REORDERING */}
                                {formTab === "media" && (
                                    <div className="space-y-6">
                                        {/* Cover Image Section */}
                                        <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label className="text-xs font-black text-slate-800 uppercase block">
                                                        Main Cover Image
                                                    </label>
                                                    <p className="text-xs text-slate-500">
                                                        Primary hero image displayed on catalog cards and product detail page.
                                                    </p>
                                                </div>
                                            </div>

                                            {draft.imageURL ? (
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                                                    <div className="relative group shrink-0">
                                                        <img
                                                            src={draft.imageURL}
                                                            alt="Cover"
                                                            className="h-24 w-24 object-cover rounded-xl border border-slate-200 cursor-zoom-in"
                                                            onClick={() => setPreviewURL(draft.imageURL)}
                                                        />
                                                        <div className="absolute top-1 left-1 bg-emerald-700 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow-xs">
                                                            ★ Primary Cover
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2 flex-1 w-full">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-xs font-semibold text-slate-800">Current Cover Image Active</p>
                                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                                Ready
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 font-mono break-all line-clamp-1 max-w-lg">{draft.imageURL}</p>
                                                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={onSelectCover}
                                                                className="hidden"
                                                                id="cover-change-upload"
                                                            />
                                                            <label
                                                                htmlFor="cover-change-upload"
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold cursor-pointer transition border border-slate-200 shadow-xs"
                                                            >
                                                                <Upload className="h-3.5 w-3.5" />
                                                                <span>Change / Upload New</span>
                                                            </label>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setDraft((d) => ({ ...d, imageURL: "" }))}
                                                                className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 cursor-pointer"
                                                            >
                                                                Remove Cover
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-white hover:border-emerald-300 transition space-y-3">
                                                    <ImageIcon className="h-8 w-8 mx-auto text-slate-400" />
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700">No cover image selected</p>
                                                        <p className="text-[11px] text-slate-500">Upload a cover image from your computer or pick one from the gallery below.</p>
                                                    </div>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={onSelectCover}
                                                            className="hidden"
                                                            id="cover-upload"
                                                        />
                                                        <label
                                                            htmlFor="cover-upload"
                                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 cursor-pointer shadow-xs transition"
                                                        >
                                                            <Upload className="h-3.5 w-3.5" />
                                                            <span>Upload Cover Image</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Optional manual cover URL paste */}
                                            <div className="flex items-center gap-2 pt-1">
                                                <Input
                                                    value={customCoverUrl}
                                                    onChange={(e) => setCustomCoverUrl(e.target.value)}
                                                    placeholder="Or paste cover image URL (e.g. /product-images/... or https://...)"
                                                    className="text-xs h-9 bg-white border-slate-200"
                                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomCoverUrl(); } }}
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={addCustomCoverUrl}
                                                    disabled={!customCoverUrl.trim()}
                                                    className="h-9 text-xs font-bold cursor-pointer shrink-0"
                                                >
                                                    Set URL
                                                </Button>
                                            </div>

                                            {coverBusy && (
                                                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                                                    <RefreshCw className="h-4 w-4 animate-spin text-emerald-700" />
                                                    <span>Uploading and saving cover image…</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Gallery Section with Left & Right Arrows Reordering */}
                                        <div className="space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <div>
                                                    <label className="text-xs font-black text-slate-800 uppercase block">
                                                        Product Image Gallery ({(draft.images || []).length} images)
                                                    </label>
                                                    <p className="text-xs text-slate-500">
                                                        Upload images and use the <strong>Left (&lt;)</strong> and <strong>Right (&gt;)</strong> arrow buttons on each card to change sequence.
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        id="gallery-upload"
                                                        type="file"
                                                        hidden
                                                        multiple
                                                        accept="image/*"
                                                        onChange={onSelectGallery}
                                                    />
                                                    <label
                                                        htmlFor="gallery-upload"
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer transition shadow-xs"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                        <span>+ Upload Gallery Images</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Manual gallery URL paste input */}
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    value={customGalleryUrl}
                                                    onChange={(e) => setCustomGalleryUrl(e.target.value)}
                                                    placeholder="Or paste image URL to add to gallery (e.g. /product-images/... or https://...)"
                                                    className="text-xs h-9 bg-white border-slate-200"
                                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomGalleryUrl(); } }}
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={addCustomGalleryUrl}
                                                    disabled={!customGalleryUrl.trim()}
                                                    className="h-9 text-xs font-bold cursor-pointer shrink-0"
                                                >
                                                    Add to Gallery
                                                </Button>
                                            </div>

                                            {galleryBusy && (
                                                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                                                    <RefreshCw className="h-4 w-4 animate-spin text-emerald-700" />
                                                    <span>Uploading and optimizing gallery images…</span>
                                                </div>
                                            )}

                                            {/* Gallery Cards Grid with Left / Right Arrows */}
                                            {(!draft.images || draft.images.length === 0) ? (
                                                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50">
                                                    <ImageIcon className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                                                    <p className="text-xs font-bold text-slate-600">Gallery is empty</p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Upload Gallery Images" or paste an image URL above.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                                                    {(draft.images || []).map((img, index) => {
                                                        const isFirst = index === 0;
                                                        const isLast = index === (draft.images || []).length - 1;
                                                        const isCover = draft.imageURL === img;

                                                        return (
                                                            <div
                                                                key={`${img}-${index}`}
                                                                className={`relative rounded-2xl border bg-white p-2.5 flex flex-col justify-between shadow-xs transition-all ${
                                                                    isCover
                                                                        ? "border-emerald-500 ring-2 ring-emerald-500/25 shadow-md"
                                                                        : "border-slate-200 hover:border-slate-300"
                                                                }`}
                                                            >
                                                                {/* Image with Index Badge & Cover Tag */}
                                                                <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group">
                                                                    <img
                                                                        src={img}
                                                                        alt={`Gallery ${index + 1}`}
                                                                        onClick={() => setPreviewURL(img)}
                                                                        className="w-full h-full object-cover cursor-zoom-in transition-transform duration-200 group-hover:scale-105"
                                                                    />

                                                                    {/* Order Number Badge */}
                                                                    <div className="absolute top-1.5 left-1.5 bg-slate-900/85 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                                                                        #{index + 1}
                                                                    </div>

                                                                    {/* Cover Badge */}
                                                                    {isCover && (
                                                                        <div className="absolute top-1.5 right-1.5 bg-emerald-700 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                                                                            ★ Cover
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Control Toolbar: Left Arrow, Set Cover, Right Arrow, Delete */}
                                                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                                                                    {/* Move Left Button */}
                                                                    <button
                                                                        type="button"
                                                                        disabled={isFirst}
                                                                        onClick={() => moveImageLeft(index)}
                                                                        className={`h-8 w-8 rounded-lg border text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                                                                            isFirst
                                                                                ? "border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50"
                                                                                : "border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800"
                                                                        }`}
                                                                        title={isFirst ? "First image" : "Move left in order"}
                                                                    >
                                                                        <ChevronLeft className="h-4 w-4" />
                                                                    </button>

                                                                    {/* Set as Cover Button */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => makeCover(img)}
                                                                        className={`flex-1 h-8 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                                                            isCover
                                                                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                                                                : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200"
                                                                        }`}
                                                                        title="Set as product cover"
                                                                    >
                                                                        <Star className={`h-3 w-3 ${isCover ? "fill-emerald-700 text-emerald-700" : ""}`} />
                                                                        <span>{isCover ? "Cover" : "Set Cover"}</span>
                                                                    </button>

                                                                    {/* Move Right Button */}
                                                                    <button
                                                                        type="button"
                                                                        disabled={isLast}
                                                                        onClick={() => moveImageRight(index)}
                                                                        className={`h-8 w-8 rounded-lg border text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                                                                            isLast
                                                                                ? "border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50"
                                                                                : "border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800"
                                                                        }`}
                                                                        title={isLast ? "Last image" : "Move right in order"}
                                                                    >
                                                                        <ChevronRight className="h-4 w-4" />
                                                                    </button>

                                                                    {/* Delete Image */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeImage(img)}
                                                                        className="h-8 w-8 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition flex items-center justify-center cursor-pointer"
                                                                        title="Remove from gallery"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* TAB 4: INVENTORY & DESCRIPTION */}
                                {formTab === "inventory" && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 uppercase mb-1.5 block">
                                                Detailed Product Description
                                            </label>
                                            <textarea
                                                value={draft.description}
                                                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                                                rows={6}
                                                className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm focus:ring-emerald-600 focus:border-emerald-600"
                                                placeholder="Write detailed product benefits, formulation details, usage instructions..."
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                                <div className="text-xs text-slate-500">
                                    {(draft.images || []).length} gallery images · Cover: {draft.imageURL ? "Set" : "None"}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => { setShowForm(false); startNew(); }}
                                        className="border-slate-200 font-medium cursor-pointer"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={save}
                                        disabled={saving}
                                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 shadow-md shadow-emerald-700/20 cursor-pointer"
                                    >
                                        {saving ? "Saving..." : editing ? "Update Product" : "Create Product"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick View / Preview Modal */}
                {quickViewProduct && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                        {quickViewProduct.category || "Ayurvedic"}
                                    </span>
                                    <h3 className="text-lg font-black text-slate-900 mt-1">
                                        {quickViewProduct.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-mono">SKU: {quickViewProduct.sku}</p>
                                </div>
                                <button
                                    onClick={() => setQuickViewProduct(null)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                                <img
                                    src={quickViewProduct.imageURL || (quickViewProduct.images && quickViewProduct.images[0])}
                                    alt={quickViewProduct.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                <div>
                                    <span className="text-xl font-black text-emerald-700">
                                        ₹{(quickViewProduct.isDiscountEnabled ? quickViewProduct.discountPrice : quickViewProduct.price) || quickViewProduct.price}
                                    </span>
                                    {quickViewProduct.originalPrice > 0 && (
                                        <span className="text-xs text-slate-400 line-through ml-2">
                                            ₹{quickViewProduct.originalPrice}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const p = quickViewProduct;
                                            setQuickViewProduct(null);
                                            startEdit(p);
                                        }}
                                        className="text-xs font-semibold cursor-pointer"
                                    >
                                        <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                                    </Button>
                                    <a
                                        href={`/product/${quickViewProduct.sku || quickViewProduct.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800"
                                    >
                                        <span>View Storefront</span>
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Lightbox / Fullscreen Image Preview Modal */}
                {previewURL && (
                    <div
                        className="fixed inset-0 bg-black/85 backdrop-blur-xs z-50 flex items-center justify-center p-4"
                        onClick={() => setPreviewURL("")}
                    >
                        <img src={previewURL} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
                        <button
                            onClick={() => setPreviewURL("")}
                            className="absolute top-5 right-5 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition cursor-pointer"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirmId && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 text-center animate-in fade-in zoom-in-95">
                            <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                                <Trash2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900">Delete this product?</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    This action cannot be undone. This product will be permanently removed from your catalog.
                                </p>
                            </div>
                            <div className="flex gap-2 justify-center pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="border-slate-200 font-semibold cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => remove(deleteConfirmId)}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
                                >
                                    Yes, Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
