import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useStorageUpload from "../hooks/useStorage.js"; // single-file uploader you already use
import { useProducts, createProduct, updateProduct, deleteProduct } from "../hooks/useProducts.js";

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

export default function Admin() {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();
    const isAdmin = !!user && (user.isAdmin || ADMIN_EMAILS.includes(user.email || ""));

    useEffect(() => {
        if (!loading) {
            if (!user || user.isAnonymous) navigate("/auth", { replace: true });
            else if (!isAdmin) navigate("/login", { replace: true });
        }
    }, [user, navigate, loading, isAdmin]);

    if (!user || user.isAnonymous) return null;
    if (!isAdmin)
        return (
            <div className="min-h-screen grid place-items-center bg-slate-900 text-slate-200 p-6">
                <div className="max-w-md bg-slate-800 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold">No access</h2>
                    <p className="text-slate-400 mt-1">This page is restricted to admin accounts.</p>
                    <button onClick={() => navigate("/dashboard")} className="mt-4 bg-sky-600 px-4 py-2 rounded-lg">
                        Go to dashboard
                    </button>
                </div>
            </div>
        );
    return <AdminInner email={user.email} onLogout={logout} />;
}

function AdminInner({ email, onLogout }) {
    const [search, setSearch] = useState("");
    const { products, loading, error } = useProducts({ onlyActive: false, search, pageSize: 500 });
    const [editing, setEditing] = useState(null); // product id or null
    const [draft, setDraft] = useState(emptyProduct());
    const { upload, progress, url, error: upErr, reset } = useStorageUpload("products");

    // Import/Export helpers
    const fileRef = useRef(null);
    const [bulk, setBulk] = useState({ running: false, count: 0, done: 0, error: "" });

    // Gallery state
    const [galleryBusy, setGalleryBusy] = useState(false);
    const [previewURL, setPreviewURL] = useState("");

    useEffect(() => {
        if (url) setDraft((d) => ({ ...d, imageURL: url }));
    }, [url]);

    const startNew = () => {
        setEditing(null);
        setDraft(emptyProduct());
        reset();
    };
    const startEdit = (p) => {
        setEditing(p.id);
        setDraft({ images: Array.isArray(p.images) ? p.images : [], ...p });
        reset();
    };

    const save = async () => {
        if (!draft.title.trim()) return alert("Title is required");
        if (editing) await updateProduct(editing, draft);
        else await createProduct(draft);
        startNew();
    };

    const remove = async (id) => {
        if (!confirm("Delete this product?")) return;
        await deleteProduct(id);
        if (editing === id) startNew();
    };

    const exportJSON = () => {
        const plain = products.map(
            ({ id, title, subTitle, price, sku, delPrize, category, description, imageURL, images = [], active }) => ({
                id,
                title,
                subTitle,
                price,
                sku,
                delPrize,
                category,
                description,
                imageURL,
                images,
                active,

            })
        );
        const blob = new Blob([JSON.stringify(plain, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `products-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
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
        } catch (e) {
            setBulk({ running: false, count: 0, done: 0, error: e?.message || String(e) });
        } finally {
            setBulk((s) => ({ ...s, running: false }));
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    // ---- Gallery handlers ----
    const onSelectGallery = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setGalleryBusy(true);
        try {
            const urls = [];
            for (const f of files) {
                // reuse your single-file uploader sequentially
                const { downloadURL } = await upload(f, `gallery/${draft.sku}/`); // upload to gallery/{sku}/ folder
                urls.push(downloadURL);
            }
            setDraft((d) => {
                const images = [...(d.images || []), ...urls];
                const imageURL = d.imageURL || images[0] || "";
                return { ...d, images, imageURL };
            });
        } finally {
            setGalleryBusy(false);
            e.target.value = ""; // allow reselecting same files
        }
    };

    const removeImage = (img) => {
        setDraft((d) => {
            const images = (d.images || []).filter((u) => u !== img);
            const imageURL = d.imageURL === img ? images[0] || "" : d.imageURL;
            return { ...d, images, imageURL };
        });
    };

    const makeCover = (img) => setDraft((d) => ({ ...d, imageURL: img }));

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-16">
            <div className="max-w-[1300px] mx-auto">
                <header className="flex items-center gap-3">
                    <Link to="/" className="text-2xl font-bold text-green-700">FranchGlobal</Link>
                    <h1 className="text-2xl font-semibold">/ Admin Panel</h1>
                    <p className="text-slate-400 text-sm ms-auto">Signed in as {email}</p>
                    <button onClick={onLogout} className="rounded-lg bg-slate-800 px-3 py-1.5 hover:bg-slate-700">
                        Logout
                    </button>
                </header>

                <section className="mt-4 grid gap-4 md:grid-cols-[1fr]">

                    {/* Editor */}
                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 grid gap-3 h-max">
                        <h3 className="text-lg font-medium">{editing ? "Edit product" : "New product"}</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm text-slate-300">Heading</label>
                                <input
                                    value={draft.title}
                                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-300">Sub Heading</label>
                                <input
                                    value={draft.subTitle}
                                    onChange={(e) => setDraft((d) => ({ ...d, subTitle: e.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-300">Price (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={draft.price}
                                    onChange={(e) => setDraft((d) => ({ ...d, price: Number(e.target.value) }))}
                                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-300 line-through">Strike Prize</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={draft.delPrize}
                                    onChange={(e) => setDraft((d) => ({ ...d, delPrize: Number(e.target.value) }))}
                                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm text-slate-300">SKU</label>
                                <input
                                    value={draft.sku}
                                    onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-300">Category</label>
                                <input
                                    value={draft.category}
                                    onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-slate-300">Description</label>
                            <textarea
                                value={draft.description}
                                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                                rows={5}
                                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
                            />
                        </div>

                        {/* Cover image uploader (single) */}
                        <div className="grid gap-2">
                            <label className="text-sm text-slate-300">Cover Image</label>
                            {draft.imageURL ? (
                                <img
                                    src={draft.imageURL}
                                    alt="preview"
                                    onClick={() => setPreviewURL(draft.imageURL)}
                                    className="h-32 w-32 object-cover rounded border border-slate-800 cursor-zoom-in"
                                />
                            ) : (
                                <div className="h-32 w-32 grid place-items-center rounded bg-slate-800">No image</div>
                            )}
                            {/* <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) upload(f, `${draft.sku}-prod/`); // upload to products/ folder
                                }}
                            /> */}
                            {progress > 0 && progress < 100 && (
                                <div className="h-2 w-full bg-slate-800 rounded">
                                    <div className="h-full bg-emerald-500 rounded" style={{ width: `${progress}%` }} />
                                </div>
                            )}
                            {upErr && <div className="text-sm text-rose-300">{String(upErr)}</div>}
                        </div>

                        {/* Gallery uploader (multiple) */}
                        <div className="grid gap-2 mt-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm text-slate-300">Image Gallery</label>
                                {galleryBusy && <span className="text-xs text-slate-400">Uploading…</span>}
                            </div>
                            <input id="gallery-upload" type="file" hidden multiple accept="image/*" onChange={onSelectGallery} />
                            <label htmlFor="gallery-upload" className="px-2 py-1 text-xs rounded bg-sky-900 w-max">
                                + Upload Gallery Images
                            </label>
                            <div className="grid md:grid-cols-8 grid-cols-4 gap-2">
                                {(draft.images || []).map((img) => (
                                    <div key={img} className="relative group">
                                        <img
                                            src={img}
                                            alt="thumb"
                                            onClick={() => setPreviewURL(img)}
                                            className="h-20 w-full object-cover rounded border border-slate-800 cursor-zoom-in"
                                        />
                                        <div className="absolute inset-0 hidden group-hover:flex items-center justify-center gap-1 bg-slate-950/60 rounded">
                                            <button onClick={() => makeCover(img)} className="px-2 py-1 text-xs rounded bg-sky-600">
                                                Cover
                                            </button>
                                            <button onClick={() => removeImage(img)} className="px-2 py-1 text-xs rounded bg-rose-700">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(draft.images || []).length === 0 && (
                                    <div className="text-slate-400 text-sm">No gallery images yet.</div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={!!draft.active}
                                    onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
                                />{" "}
                                Active
                            </label>
                            <button onClick={save} className="ml-auto rounded-lg bg-sky-600 px-4 py-2">
                                {editing ? "Update" : "Create"}
                            </button>
                            {editing && (
                                <button onClick={() => remove(editing)} className="rounded-lg bg-rose-700 px-4 py-2">
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>


                    {/* List */}
                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <input
                                placeholder="Search title / sku / description"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="min-w-[220px] flex-1 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
                            />
                            <input
                                type="file"
                                accept="application/json"
                                ref={fileRef}
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) importJSON(f);
                                }}
                            />
                            <button
                                onClick={() => fileRef.current?.click()}
                                className="rounded-lg bg-slate-800 px-3 py-2 hover:bg-slate-700"
                            >
                                Import JSON
                            </button>
                            <button onClick={exportJSON} className="rounded-lg bg-slate-800 px-3 py-2 hover:bg-slate-700">
                                Export JSON
                            </button>
                            <button onClick={startNew} className="ml-auto rounded-lg bg-sky-600 px-3 py-2">
                                New
                            </button>
                        </div>

                        {bulk.running && (
                            <div className="mb-3 rounded-lg border border-emerald-700 bg-emerald-900/40 px-3 py-2 text-emerald-100 text-sm">
                                Importing… {bulk.done}/{bulk.count}
                            </div>
                        )}
                        {bulk.error && (
                            <div className="mb-3 rounded-lg border border-rose-700 bg-rose-900/40 px-3 py-2 text-rose-100 text-sm">
                                Import error: {bulk.error}
                            </div>
                        )}

                        {loading && <div className="text-slate-400">Loading…</div>}
                        {error && <div className="text-rose-300">{String(error)}</div>}

                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-slate-400 border-b border-slate-800">
                                        <th className="py-2 pr-3">Title</th>
                                        <th className="py-2 pr-3">Price</th>
                                        <th className="py-2 pr-3">delPrize</th>
                                        <th className="py-2 pr-3">Active</th>
                                        <th className="py-2 pr-3">Category</th>
                                        <th className="py-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((p) => (
                                        <tr key={p.id} className="border-b border-slate-800 h-16">
                                            <td className="py-2 pr-3">
                                                <div className="flex items-center gap-2">
                                                    {p.imageURL ? (
                                                        <img src={p.imageURL} alt="" className="h-8 w-8 rounded object-cover" />
                                                    ) : (
                                                        <span className="h-8 w-8 grid place-items-center bg-slate-800 rounded">🛍️</span>
                                                    )}
                                                    <div className="truncate " title={p.title}>
                                                        {p.title}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2 pr-3">₹{p.price?.toLocaleString?.() || p.price}</td>
                                            <td className="py-2 pr-3">{p.delPrize ?? 0}</td>
                                            <td className="py-2 pr-3">{p.active ? "Yes" : "No"}</td>
                                            <td className="py-2 pr-3">{p.category || "-"}</td>
                                            <td className="py-2 flex justify-center items-center gap-2 pb-0 h-16">
                                                <button onClick={() => startEdit(p)} className="px-2 py-1 rounded bg-slate-800">
                                                    Edit
                                                </button>
                                                <button onClick={() => remove(p.id)} className="px-2 py-1 rounded bg-rose-700">
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {products.length === 0 && !loading && (
                                        <tr>
                                            <td className="py-6 text-slate-400" colSpan={6}>
                                                No products found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>


                </section>
            </div>

            {/* Image preview modal */}
            {previewURL && (
                <div
                    className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
                    onClick={() => setPreviewURL("")}
                >
                    <img src={previewURL} alt="preview" className="max-h-[90vh] max-w-[90vw] rounded shadow-xl" />
                </div>
            )}
        </div>
    );
}

function emptyProduct() {
    return {
        title: "",
        subTitle: "",
        price: 0,
        sku: "",
        originalPrice: 0,
        isDiscountEnabled: false,
        discountTag: "10%",
        discountPrice: 0,
        discountStrikePrice: 0,
        delPrize: 0,
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
        originalPrice: Number(p.originalPrice ?? p.delPrize) || 0,
        delPrize: Number(p.originalPrice ?? p.delPrize) || 0,
        isDiscountEnabled: isDiscount,
        discountTag: p.discountTag ?? p.discount_tag ?? "10%",
        discountPrice: Number(p.discountPrice ?? p.discount_price) || 0,
        discountStrikePrice: Number(p.discountStrikePrice ?? p.discount_strike_price) || 0,
        category: p.category ?? "",
        description: p.description ?? "",
        imageURL: p.imageURL ?? ((Array.isArray(p.images) && p.images[0]) || ""),
        images: Array.isArray(p.images) ? p.images : [],
        active: typeof p.active === "boolean" ? p.active : true,
    };
}

