import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { doc, onSnapshot, orderBy, updateDoc } from "firebase/firestore";
import { firestore as db } from "../firebase/config";
import useStorageUpload from '../hooks/useStorage';
import { useProducts, createProduct, updateProduct, deleteProduct } from '../hooks/useProducts';
import { resolveProductPricing } from '../utils/productDiscount.js';
import { useBlogs, createBlog, updateBlog, deleteBlog } from '../hooks/useBlogs';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
// import { useJsPDF } from "../hooks/useJsPDF";
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import '../css/adminDashboard.css';
import { query } from 'firebase/database';
import useUser from '../hooks/useUser';
import { collection, /*getDocs*/ } from "firebase/firestore";
import { phpApi } from "../lib/phpApi";
import { SHIPROCKET_PACKAGE } from "../utils/shiprocketPackageDefaults";
import { useOrders } from '../hooks/useOrder';
import { toWords } from "number-to-words";
import MaskImage from '../tools/MaskImage';
import { Pie } from "react-chartjs-2";
import {
    Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale,
    LinearScale,
    BarElement,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import Invoice from './Invoice';
import { circOut } from 'framer-motion';
import { X, Printer, Edit, Save } from 'lucide-react';

// Register required Chart.js components
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// User pi chart
const PieChart = ({ totalUsers, activeUsers, inactiveUsers, todayUsers }) => {
    const data = {
        labels: ["Total", "Active", "Inactive", "Today's"],
        datasets: [
            {
                data: [totalUsers, activeUsers, inactiveUsers, todayUsers],
                backgroundColor: [
                    "hsl(221, 97%, 60%)",
                    "hsl(142, 100%, 60%)",
                    "hsl(357, 100%, 60%)",
                    "hsl(39, 100%, 60%)",
                ],
                borderColor: [
                    "hsl(221, 97%, 60%)",
                    "hsl(142, 100%, 60%)",
                    "hsl(357, 100%, 60%)",
                    "hsl(39, 100%, 60%)",
                ],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: "right",
                labels: {
                    boxWidth: 20,
                    padding: 15,
                },
            },
            title: {
                display: false,
                text: "User Overview",
            },
        },
    };


    return <Pie data={data} options={options} />;
};
// user bar chart
const UserBarChart = ({ stats, name }) => {
    const data = {
        labels: ["Today", "Yesterday", "This Week", "This Month", "This Year"],
        datasets: [
            {
                label: name,
                data: [
                    stats.today,
                    stats.yesterday,
                    stats.thisWeek,
                    stats.thisMonth,
                    stats.thisYear,
                ],
                backgroundColor: [
                    "rgba(54, 162, 235, 0.7)", // blue
                    "rgba(255, 99, 132, 0.7)", // red
                    "rgba(255, 206, 86, 0.7)", // yellow
                    "rgba(75, 192, 192, 0.7)", // green
                    "rgba(153, 102, 255, 0.7)", // purple
                ],
                borderColor: [
                    "rgba(54, 162, 235, 1)",
                    "rgba(255, 99, 132, 1)",
                    "rgba(255, 206, 86, 1)",
                    "rgba(75, 192, 192, 1)",
                    "rgba(153, 102, 255, 1)",
                ],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: "User Growth Overview",
            },
        },
    };

    return <Bar data={data} options={options} />;
};

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

// SortableItem for Blog Blocks (from AdminBlog.jsx)
function SortableItem({ block, index, updateBlock, removeBlock, setPreviewURL }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 1,
    };

    return (
        <div ref={setNodeRef} className="border border-indigo-700 rounded-lg p-3 mt-2 relative" style={style}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="cursor-grab px-2 py-1  rounded-md touch-none" {...attributes} {...listeners}>
                        ↕️
                    </div>
                    <select
                        value={block.type}
                        onChange={(e) => updateBlock(index, 'type', e.target.value)}
                        className="text-sm bg-gray-100 border border-green-700 rounded px-2 py-1 text-blacks focus:ring-2 focus:outline-none"
                    >
                        {['h1', 'h2', 'h3', 'p', "list", 'image'].map((t) => (
                            <option key={t} value={t}>{t.toUpperCase()}</option>
                        ))}
                    </select>
                </div>
                <button onClick={() => removeBlock(index)} className="px-2 py-1 text-xs rounded bg-rose-600 text-white hover:bg-rose-700 transition-all duration-200">
                    Remove
                </button>
            </div>
            {block.type === 'image' ? (
                <>
                    {block.content ? (
                        <img
                            src={block.content}
                            alt="block"
                            onClick={() => setPreviewURL(block.content)}
                            className="h-20 w-20 object-cover rounded border border-indigo-700 cursor-zoom-in"
                        />
                    ) : (
                        <div className="h-20 w-20 grid place-items-center rounded bg-indigo-800">{block.tempId ? 'Uploading...' : 'No image'}</div>
                    )}
                </>
            ) : (
                <textarea
                    value={block.content}
                    onChange={(e) => updateBlock(index, 'content', e.target.value)}
                    rows={block.type.startsWith('h') ? 2 : 5}
                    // spellCheck="false"
                    className="w-full rounded-lg border border-green-700 bg-green-900/5 px-3 py-2 outline-none focus:ring-2 focus:ring-green-500 text-black"
                />
            )}
        </div>
    );
}
// AdminInner (from Admin.jsx)
function AdminInner({ email, onLogout, modes }) {
    const [search, setSearch] = useState('');
    const { products, loading, error } = useProducts({ onlyActive: false, search, pageSize: 500 });
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState(emptyProduct());
    const { upload, progress, url, error: upErr, reset } = useStorageUpload('products');
    const fileRef = useRef(null);
    const [bulk, setBulk] = useState({ running: false, count: 0, done: 0, error: '' });
    const [galleryBusy, setGalleryBusy] = useState(false);
    const [previewURL, setPreviewURL] = useState('');
    const { tab } = useParams();
    const [mode, setMode] = useState(modes || 'products-create');

    useEffect(() => {
        if (url) setDraft((d) => ({ ...d, imageURL: url }));
    }, [url]);

    useEffect(() => {
        // console.log("Mode changed to", mode, tab);
        if (tab === "products-create") startNew();
        setMode(tab);
    }, [mode, tab]);

    const startNew = () => {
        setEditing(null);
        setDraft(emptyProduct());
        reset();
    };

    const startEdit = (p) => {
        setEditing(p.id);
        const base = { images: Array.isArray(p.images) ? p.images : [], ...p };
        const resolved = resolveProductPricing(base);
        setDraft({ ...base, ...resolved });
        reset();
    };

    const patchPricing = (patch) => {
        setDraft((d) => {
            const next = { ...d, ...patch };
            const resolved = resolveProductPricing(next);
            return { ...next, ...resolved };
        });
    };

    const patchDiscountPercent = (discountPercent) => {
        setDraft((d) => {
            const next = { ...d, discountPercent: Number(discountPercent) || 0 };
            const resolved = resolveProductPricing(next);
            return { ...next, ...resolved };
        });
    };

    const save = async () => {
        if (!draft.title.trim()) return alert('Title is required');
        const payload = normalizeProduct(draft);
        if (editing) await updateProduct(editing, payload);
        else await createProduct(payload);
        startNew();
    };

    const remove = async (id) => {
        if (!confirm('Delete this product?')) return;
        await deleteProduct(id);
        if (editing === id) startNew();
    };

    const exportJSON = () => {
        const plain = products.map(({ id, title, subTitle, price, sku, originalPrice, discountPercent, category, description, imageURL, images = [], active }) => ({
            id,
            title,
            subTitle,
            price,
            sku,
            originalPrice,
            discountPercent,
            category,
            description,
            imageURL,
            images,
            active,
        }));
        const blob = new Blob([JSON.stringify(plain, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const importJSON = async (file) => {
        try {
            setBulk({ running: true, count: 0, done: 0, error: '' });
            const text = await file.text();
            const arr = JSON.parse(text);
            if (!Array.isArray(arr)) throw new Error('JSON must be an array of products');
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
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const onSelectGallery = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setGalleryBusy(true);
        try {
            const urls = [];
            for (const f of files) {
                const { downloadURL } = await upload(f, `gallery/${draft.sku}/`);
                urls.push(downloadURL);
            }
            setDraft((d) => {
                const images = [...(d.images || []), ...urls];
                const imageURL = d.imageURL || images[0] || '';
                return { ...d, images, imageURL };
            });
        } finally {
            setGalleryBusy(false);
            e.target.value = '';
        }
    };

    const removeImage = (img) => {
        setDraft((d) => {
            const images = (d.images || []).filter((u) => u !== img);
            const imageURL = d.imageURL === img ? images[0] || '' : d.imageURL;
            return { ...d, images, imageURL };
        });
    };

    const makeCover = (img) => setDraft((d) => ({ ...d, imageURL: img }));

    return (
        <div className="p-6">
            <header className="flex items-center gap-3 mb-6">
                <Link to="/" className="text-2xl font-bold text-indigo-600">FranchGlobal</Link>
                <h1 className="text-2xl font-semibold text-gray-800">/ {tab === "products-list" ? "Product List" : "Product Create"}</h1>
                <p className="text-gray-500 text-sm ms-auto">Signed in as {email}</p>
                <button onClick={onLogout} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700 transition-all duration-200">
                    Logout
                </button>
            </header>
            <section className="grid gap-4 md:grid-cols-[1fr]">
                {(mode === 'products-create' || mode === 'products-edit') && (
                    <div className="bg-white rounded-xl p-6 border border-indigo-200 shadow-md">
                        <h3 className="text-lg font-medium text-indigo-800">{editing ? 'Edit Product' : 'New Product'}</h3>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="text-sm text-gray-600">Heading</label>
                                <input
                                    value={draft.title}
                                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Sub Heading</label>
                                <input
                                    value={draft.subTitle}
                                    onChange={(e) => setDraft((d) => ({ ...d, subTitle: e.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Sale price (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={draft.price}
                                    onChange={(e) => patchPricing({ price: Number(e.target.value) })}
                                    className="mt-1 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                                />
                                <p className="text-xs text-gray-500 mt-0.5">Price customers pay</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">MRP / original price (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={draft.originalPrice}
                                    onChange={(e) => patchPricing({ originalPrice: Number(e.target.value) })}
                                    className="mt-1 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                                />
                                <p className="text-xs text-gray-500 mt-0.5">Shown struck-through when higher than sale price</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Discount %</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="99"
                                    value={draft.discountPercent ?? 0}
                                    onChange={(e) => patchDiscountPercent(e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                                />
                                <p className="text-xs text-gray-500 mt-0.5">Or enter MRP above — both update the storefront discount tag</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">SKU</label>
                                <input
                                    value={draft.sku}
                                    onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Category</label>
                                <input
                                    value={draft.category}
                                    onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="text-sm text-gray-600">Description</label>
                            <textarea
                                value={draft.description}
                                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                                rows={5}
                                className="mt-1 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                            />
                        </div>
                        <div className="grid gap-2 mt-4">
                            <label className="text-sm text-gray-600">Cover Image</label>
                            {draft.imageURL ? (
                                <img
                                    src={draft.imageURL}
                                    alt="preview"
                                    onClick={() => setPreviewURL(draft.imageURL)}
                                    className="h-32 w-32 object-cover rounded border border-indigo-300 cursor-zoom-in hover:shadow-md transition-all duration-200"
                                />
                            ) : (
                                <div className="h-32 w-32 grid place-items-center rounded bg-indigo-100 text-gray-600">No image</div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) upload(f, `${draft.sku}-prod/`);
                                }}
                                className="text-sm text-gray-600"
                            />
                            {progress > 0 && progress < 100 && (
                                <div className="h-2 w-full bg-indigo-200 rounded">
                                    <div className="h-full bg-indigo-600 rounded" style={{ width: `${progress}%` }} />
                                </div>
                            )}
                            {upErr && <div className="text-sm text-rose-500">{String(upErr)}</div>}
                        </div>
                        <div className="grid gap-2 mt-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm text-gray-600">Image Gallery</label>
                                {galleryBusy && <span className="text-xs text-gray-500">Uploading…</span>}
                            </div>
                            <input id="gallery-upload" type="file" hidden multiple accept="image/*" onChange={onSelectGallery} />
                            <label htmlFor="gallery-upload" className="px-2 py-1 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700 w-max transition-all duration-200">
                                + Upload Gallery Images
                            </label>
                            <div className="grid md:grid-cols-8 grid-cols-4 gap-2">
                                {(draft.images || []).map((img) => (
                                    <div key={img} className="relative group">
                                        <img
                                            src={img}
                                            alt="thumb"
                                            onClick={() => setPreviewURL(img)}
                                            className="h-20 w-full object-cover rounded border border-indigo-300 cursor-zoom-in hover:shadow-md transition-all duration-200"
                                        />
                                        <div className="absolute inset-0 hidden group-hover:flex items-center justify-center gap-1 bg-indigo-900/60 rounded">
                                            <button onClick={() => makeCover(img)} className="px-2 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-700 transition-all duration-200">
                                                Cover
                                            </button>
                                            <button onClick={() => removeImage(img)} className="px-2 py-1 text-xs rounded bg-rose-600 hover:bg-rose-700 transition-all duration-200">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(draft.images || []).length === 0 && (
                                    <div className="text-gray-500 text-sm">No gallery images yet.</div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={!!draft.active}
                                    onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
                                />
                                Active
                            </label>
                            <button onClick={save} className="ml-auto rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition-all duration-200">
                                {editing ? 'Update' : 'Create'}
                            </button>
                            {editing && (
                                <button onClick={() => remove(editing)} className="rounded-lg bg-rose-600 px-4 py-2 text-white hover:bg-rose-700 transition-all duration-200">
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>)}
                {mode === 'products-list' && (
                    <div className="bg-white rounded-xl p-6 border border-indigo-200 shadow-md mt-4">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <input
                                placeholder="Search title / sku / description"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="min-w-[220px] flex-1 rounded-lg border border-indigo-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
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
                                className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 transition-all duration-200"
                            >
                                Import JSON
                            </button>
                            <button onClick={exportJSON} className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 transition-all duration-200">
                                Export JSON
                            </button>
                            <button onClick={startNew} className="ml-auto rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 transition-all duration-200">
                                New
                            </button>
                        </div>
                        {bulk.running && (
                            <div className="mb-4 rounded-lg border border-indigo-600 bg-indigo-100/40 px-3 py-2 text-indigo-800 text-sm">
                                Importing… {bulk.done}/{bulk.count}
                            </div>
                        )}
                        {bulk.error && (
                            <div className="mb-4 rounded-lg border border-rose-600 bg-rose-100/40 px-3 py-2 text-rose-800 text-sm">
                                Import error: {bulk.error}
                            </div>
                        )}
                        {loading && <div className="text-gray-500">Loading…</div>}
                        {error && <div className="text-rose-500">{String(error)}</div>}
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-600 border-b border-indigo-200">
                                        <th className="py-3 pr-3">Title</th>
                                        <th className="py-3 pr-3">Sale</th>
                                        <th className="py-3 pr-3">MRP</th>
                                        <th className="py-3 pr-3">Off %</th>
                                        <th className="py-3 pr-3">Active</th>
                                        <th className="py-3 pr-3">Category</th>
                                        <th className="py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((p) => (
                                        <tr key={p.id} className="border-b border-indigo-200 h-16 hover:bg-indigo-50 transition-all duration-200">
                                            <td className="py-3 pr-3">
                                                <div className="flex items-center gap-2">
                                                    {p.imageURL ? (
                                                        <img src={p.imageURL} alt="" className="h-8 w-8 rounded object-cover" />
                                                    ) : (
                                                        <span className="h-8 w-8 grid place-items-center bg-indigo-100 rounded">🛍️</span>
                                                    )}
                                                    <div className="truncate" title={p.title}>
                                                        {p.title}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 pr-3">₹{p.price?.toLocaleString?.() || p.price}</td>
                                            <td className="py-3 pr-3">₹{p.originalPrice ?? 0}</td>
                                            <td className="py-3 pr-3">{p.discountPercent ? `${p.discountPercent}%` : '—'}</td>
                                            <td className="py-3 pr-3">{p.active ? 'Yes' : 'No'}</td>
                                            <td className="py-3 pr-3">{p.category || '-'}</td>
                                            <td className="py-3 flex justify-center items-center gap-2">
                                                <Link to="/admin/dashboard/products-edit" >
                                                    <button onClick={() => { startEdit(p); setMode("edit") }} className="px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-200">
                                                        Edit
                                                    </button>
                                                </Link>
                                                <button onClick={() => remove(p.id)} className="px-2 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 transition-all duration-200">
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {products.length === 0 && !loading && (
                                        <tr>
                                            <td className="py-6 text-gray-500" colSpan={6}>
                                                No products found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>)}
            </section>
            {previewURL && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setPreviewURL('')}>
                    <img src={previewURL} alt="preview" className="max-h-[90vh] max-w-[90vw] rounded shadow-xl" />
                </div>
            )}
        </div>
    );
}

// AdminBlogInner (from AdminBlog.jsx)
function AdminBlogInner({ email, onLogout, modes }) {
    const [search, setSearch] = useState('');
    const { blogs, loading, error } = useBlogs({ onlyActive: false, search, pageSize: 500 });
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState(emptyBlog());
    const { upload, progress, url, error: upErr, reset } = useStorageUpload('blogs');
    const fileRef = useRef(null);
    const [bulk, setBulk] = useState({ running: false, count: 0, done: 0, error: '' });
    const [previewURL, setPreviewURL] = useState('');
    const [activeId, setActiveId] = useState(null);
    const { tab } = useParams();
    const [mode, setMode] = useState(modes || 'blogs-create');

    useEffect(() => {
        // console.log("Mode changed to", mode, tab);
        if (tab === "blogs-create") startNew();
        setMode(tab);
    }, [mode, tab]);

    useEffect(() => {
        if (url) {
            const pendingBlock = draft.body.find((b) => b.tempId && b.type === 'image');
            if (pendingBlock) {
                setDraft((d) => ({
                    ...d,
                    body: d.body.map((b) => (b.tempId === pendingBlock.tempId ? { ...b, content: url, tempId: null } : b)),
                }));
            } else {
                setDraft((d) => ({ ...d, mainImage: url }));
            }
        }
    }, [url]);

    const startNew = () => {
        setEditing(null);
        setDraft(emptyBlog());
        reset();
    };

    const startEdit = (b) => {
        setEditing(b.id);
        const bodyWithIds = Array.isArray(b.body)
            ? b.body.map((block) => ({
                ...block,
                id: block.id || crypto.randomUUID(),
            }))
            : [];
        setDraft({ ...b, body: bodyWithIds });
        reset();
    };

    const save = async () => {
        if (!draft.title.trim()) return alert('Title is required');
        if (!draft.slug.trim()) return alert('Slug is required');
        const cleanedDraft = {
            ...draft,
            body: draft.body.map(({ tempId, ...rest }) => rest),
        };
        if (editing) await updateBlog(editing, cleanedDraft);
        else await createBlog(cleanedDraft);
        startNew();
    };

    const remove = async (id) => {
        if (!confirm('Delete this blog?')) return;
        await deleteBlog(id);
        if (editing === id) startNew();
    };

    const exportJSON = () => {
        const plain = blogs.map(({ id, title, slug, mainImage, body, category, description, active }) => ({
            id,
            title,
            slug,
            mainImage,
            body,
            category,
            description,
            active,
        }));
        const blob = new Blob([JSON.stringify(plain, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `blogs-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const importJSON = async (file) => {
        try {
            setBulk({ running: true, count: 0, done: 0, error: '' });
            const text = await file.text();
            const arr = JSON.parse(text);
            if (!Array.isArray(arr)) throw new Error('JSON must be an array of blogs');
            setBulk((s) => ({ ...s, count: arr.length }));

            for (const raw of arr) {
                const data = normalizeBlog(raw);
                if (raw.id) {
                    await updateBlog(raw.id, data);
                } else {
                    await createBlog(data);
                }
                setBulk((s) => ({ ...s, done: s.done + 1 }));
            }
        } catch (e) {
            setBulk({ running: false, count: 0, done: 0, error: e?.message || String(e) });
        } finally {
            setBulk((s) => ({ ...s, running: false }));
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const addBlock = (type) => {
        setDraft((d) => ({
            ...d,
            body: [...d.body, { id: crypto.randomUUID(), type, content: '', tempId: null }],
        }));
    };

    const updateBlock = (index, field, value) => {
        setDraft((d) => ({
            ...d,
            body: d.body.map((b, i) => (i === index ? { ...b, [field]: value } : b)),
        }));
    };

    const removeBlock = (index) => {
        setDraft((d) => ({
            ...d,
            body: d.body.filter((_, i) => i !== index),
        }));
    };

    const addImageBlock = (file) => {
        if (!file) return;
        const tempId = Math.random().toString(36).slice(2);
        setDraft((d) => ({
            ...d,
            body: [...d.body, { id: crypto.randomUUID(), type: 'image', content: '', tempId }],
        }));
        upload(file, `blogs/${draft.slug}/`, { isMainImage: false });
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
        // console.log(activeId);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;
        if (active.id !== over.id) {
            setDraft((d) => {
                const oldIndex = d.body.findIndex((b) => b.id === active.id);
                const newIndex = d.body.findIndex((b) => b.id === over.id);
                return { ...d, body: arrayMove(d.body, oldIndex, newIndex) };
            });
        }
    };

    return (
        <div className="p-6">
            <header className="flex items-center gap-3 mb-6">
                <Link to="/" className="text-2xl font-bold text-indigo-600">FranchGlobal</Link>
                <h1 className="text-2xl font-semibold text-gray-800">/ Blog Panel</h1>
                <p className="text-gray-500 text-sm ms-auto">Signed in as {email}</p>
                <button onClick={onLogout} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700 transition-all duration-200">
                    Logout
                </button>
            </header>
            <section className="grid gap-4 md:grid-cols-[1fr]">
                {(mode === 'blogs-create' || mode === 'blogs-edit') && (
                    <div className="bg-white rounded-xl p-6 border border-indigo-200 shadow-md">
                        <h3 className="text-lg font-medium text-indigo-800">{editing ? 'Edit Blog' : 'New Blog'}</h3>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="text-sm text-gray-600">Title</label>
                                <input
                                    value={draft.title}
                                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Slug</label>
                                <input
                                    value={draft.slug}
                                    onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="text-sm text-gray-600">Description</label>
                            <input
                                value={draft.description}
                                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                            />
                        </div>
                        <div className="mt-4">
                            <label className="text-sm text-gray-600">Category</label>
                            <input
                                value={draft.category}
                                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                            />
                        </div>
                        <div className="grid gap-2 mt-4">
                            <label className="text-sm text-gray-600">Main Image</label>
                            {draft.mainImage ? (
                                <img
                                    src={draft.mainImage}
                                    alt="preview"
                                    onClick={() => setPreviewURL(draft.mainImage)}
                                    className="h-32 w-32 object-cover rounded border border-indigo-300 cursor-zoom-in hover:shadow-md transition-all duration-200"
                                />
                            ) : (
                                <div className="h-32 w-32 grid place-items-center rounded bg-indigo-100 text-gray-600">No image</div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) upload(f, `blogs/${draft.slug}/`, { isMainImage: true });
                                }}
                                className="text-sm text-gray-600"
                            />
                            {progress > 0 && progress < 100 && (
                                <div className="h-2 w-full bg-green-200 rounded">
                                    <div className="h-full bg-green-600 rounded" style={{ width: `${progress}%` }} />
                                </div>
                            )}
                            {upErr && <div className="text-sm text-rose-500">{String(upErr)}</div>}
                        </div>
                        <div className="grid gap-2 mt-4">
                            <label className="text-sm text-gray-600">Content Blocks</label>
                            <div className="flex flex-wrap gap-2">
                                {[{ h1: 'TITLE BIG' }, { h2: 'TITLE MEDIUM' }, { h3: 'TITLE SMALL' }, { p: 'PARAGRAPH' }, { list: 'LIST' }].map((type) => (
                                    <button
                                        key={Object.keys(type)[0]}
                                        data-type={Object.keys(type)[0]}
                                        onClick={() => addBlock(Object.keys(type)[0])}
                                        className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-green-500 cursor-pointer transition-all duration-200"
                                    >
                                        Add {Object.values(type)[0]}
                                    </button>
                                ))}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => addImageBlock(e.target.files?.[0])}
                                    className="hidden"
                                    id="block-image-upload"
                                />
                                <label htmlFor="block-image-upload" className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 transition-all duration-200">
                                    Add Image
                                </label>
                            </div>
                            <section className="max-h-120 overflow-y-auto border rounded p-2">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                    modifiers={[restrictToVerticalAxis]}
                                >
                                    <SortableContext items={draft.body.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                                        {draft.body.map((block, index) => (
                                            <SortableItem
                                                key={block.id}
                                                block={block}
                                                index={index}
                                                updateBlock={updateBlock}
                                                removeBlock={removeBlock}
                                                setPreviewURL={setPreviewURL}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            </section>
                            {draft.body.length === 0 && <div className="text-gray-500 text-sm">No content blocks yet.</div>}
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={!!draft.active}
                                    onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
                                />
                                Active
                            </label>
                            <button onClick={save} className="ml-auto rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition-all duration-200">
                                {editing ? 'Update' : 'Create'}
                            </button>
                            {editing && (
                                <button onClick={() => remove(editing)} className="rounded-lg bg-rose-600 px-4 py-2 text-white hover:bg-rose-700 transition-all duration-200">
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>)}
                {mode === 'blogs-list' && (
                    <div className="bg-white rounded-xl p-6 border border-indigo-200 shadow-md mt-4">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <input
                                placeholder="Search title / slug / content"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="min-w-[220px] flex-1 rounded-lg border border-indigo-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
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
                                className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 transition-all duration-200"
                            >
                                Import JSON
                            </button>
                            <button onClick={exportJSON} className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 transition-all duration-200">
                                Export JSON
                            </button>
                            <button onClick={startNew} className="ml-auto rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 transition-all duration-200">
                                New
                            </button>
                        </div>
                        {bulk.running && (
                            <div className="mb-4 rounded-lg border border-indigo-600 bg-indigo-100/40 px-3 py-2 text-indigo-800 text-sm">
                                Importing… {bulk.done}/{bulk.count}
                            </div>
                        )}
                        {bulk.error && (
                            <div className="mb-4 rounded-lg border border-rose-600 bg-rose-100/40 px-3 py-2 text-rose-800 text-sm">
                                Import error: {bulk.error}
                            </div>
                        )}
                        {loading && <div className="text-gray-500">Loading...</div>}
                        {error && <div className="text-rose-500">{String(error)}</div>}
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-600 border-b border-indigo-200">
                                        <th className="py-3 pr-3">Title</th>
                                        <th className="py-3 pr-3">Slug</th>
                                        <th className="py-3 pr-3">Active</th>
                                        <th className="py-3 pr-3">Category</th>
                                        <th className="py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {blogs.map((b) => (
                                        <tr key={b.id} className="border-b border-indigo-200 h-16 hover:bg-indigo-50 transition-all duration-200">
                                            <td className="py-3 pr-3">
                                                <div className="flex items-center gap-2">
                                                    {b.mainImage ? (
                                                        <img src={b.mainImage} alt="" className="h-8 w-8 rounded object-cover" />
                                                    ) : (
                                                        <span className="h-8 w-8 grid place-items-center bg-indigo-100 rounded">📝</span>
                                                    )}
                                                    <div className="truncate" title={b.title}>
                                                        {b.title}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 pr-3">{b.slug}</td>
                                            <td className="py-3 pr-3">{b.active ? 'Yes' : 'No'}</td>
                                            <td className="py-3 pr-3">{b.category || '-'}</td>
                                            <td className="py-3 flex justify-center items-center gap-2">
                                                <Link to="/admin/dashboard/blogs-edit">
                                                    <button onClick={() => { startEdit(b); setMode('blogs-edit') }} className="px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-200">
                                                        Edit
                                                    </button>
                                                </Link>
                                                <button onClick={() => remove(b.id)} className="px-2 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 transition-all duration-200">
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {blogs.length === 0 && !loading && (
                                        <tr>
                                            <td className="py-6 text-gray-500" colSpan={5}>
                                                No blogs found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>)}
            </section>
            {previewURL && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setPreviewURL('')}>
                    <img src={previewURL} alt="preview" className="max-h-[90vh] max-w-[90vw] rounded shadow-xl" />
                </div>
            )}
        </div>
    );
}
// User Dashboard
function UserDashboard({ filter, activeState }) {
    const { userData, loading } = useUser();
    const [expandedUserId, setExpandedUserId] = useState(null);
    const [blocking, setBlocking] = useState(null);
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState({});
    const [favs, setFavs] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    // 🔹 New date filter states
    const [dateFilter, setDateFilter] = useState(filter || 'all');
    const [dateState, setDateState] = useState(activeState || 'all');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    useEffect(() => {
        // console.log('users:', filteredUsers);
    }, [filteredUsers]);
    useEffect(() => {
        // console.log("Date filter from params:", filter);
        setDateFilter(filter || 'all');
        setDateState(activeState || 'all');
    }, [filter, activeState]);

    // Listen to Cart data
    function getCartData(user) {
        if (!user) return () => { };
        const cartQ = query(
            collection(db, 'users', user.uid, 'cart'),
            orderBy('createdAt', 'desc')
        );
        // console.log('Cart Query:', cartQ);

        const unsub = onSnapshot(cartQ, (snap) => {
            const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setCart((prev) => ({ ...prev, [user.uid]: items }));
        });

        return unsub;
    }

    // Listen to Favorites data
    function getFavData(user) {
        if (!user) return () => { };
        const favQ = query(
            collection(db, 'users', user.uid, 'favorites'),
            orderBy('createdAt', 'desc')
        );
        // console.log('Favorites Query:', favQ);

        const unsub = onSnapshot(favQ, (snap) => {
            const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setFavs((prev) => ({ ...prev, [user.uid]: items }));
        });

        return unsub;
    }

    // 🔹 Modified filter logic to include date filtering
    useEffect(() => {
        setFilteredUsers(
            userData.filter((user) => {
                const q = search.toLowerCase();
                const matchesSearch =
                    user.name?.toLowerCase().includes(q) ||
                    user.email?.toLowerCase().includes(q) ||
                    user.phone?.toLowerCase().includes(q);

                let matchesDate = true;
                if (user.createdAt && typeof user.createdAt.toDate === 'function') {
                    const created = user.createdAt.toDate();
                    const now = new Date();
                    if (dateFilter === 'today') {
                        matchesDate = created.toDateString() === now.toDateString();
                    }
                    if (dateFilter === 'lastWeek') {
                        const lastWeek = new Date();
                        lastWeek.setDate(now.getDate() - 7);
                        matchesDate = created >= lastWeek;
                    }
                    if (dateFilter === 'lastMonth') {
                        const lastMonth = new Date();
                        lastMonth.setMonth(now.getMonth() - 1);
                        matchesDate = created >= lastMonth;
                    }
                    if (dateFilter === 'lastYear') {
                        const lastYear = new Date();
                        lastYear.setFullYear(now.getFullYear() - 1);
                        matchesDate = created >= lastYear;
                    }
                    if (dateFilter === 'custom' && customStart && customEnd) {
                        const start = new Date(customStart);
                        const end = new Date(customEnd);
                        matchesDate = created >= start && created <= end;
                    }
                    if (dateState === 'active') {
                        matchesDate = matchesDate && !user.blocked;
                    }
                    if (dateState === 'inactive') {
                        matchesDate = matchesDate && user.blocked;
                    }
                }

                return matchesSearch && matchesDate;
            })
        );
    }, [userData, search, dateFilter, dateState, customStart, customEnd]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen text-gray-700 text-lg">
                Loading...
            </div>
        );
    }

    const formatTimestamp = (timestamp) => {
        if (timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate().toLocaleString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Kolkata',
            });
        }
        return 'N/A';
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

    const handleToggleBlock = async (id, currentStatus) => {
        setBlocking(id);
        try {
            const userRef = doc(db, 'users', id);
            await updateDoc(userRef, { blocked: !currentStatus });
            setFilteredUsers((prev) =>
                prev.map((u) =>
                    u.id === id ? { ...u, blocked: !currentStatus } : u
                )
            );
        } catch (err) {
            console.error('Error updating block status:', err);
        } finally {
            setBlocking(null);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-2">
                User Dashboard
            </h1>
            <div className="mb-4 flex flex-wrap gap-4 justify-start items-center">
                <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:w-1/3 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {/* 🔹 Date filter dropdown */}
                <select
                    onChange={(e) => setDateFilter(e.target.value)}
                    value={dateFilter}
                    className="w-48 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="lastWeek">Last Week</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="lastYear">Last Year</option>
                    <option value="custom">Custom Range</option>
                </select>
                <select
                    onChange={(e) => setDateState(e.target.value)}
                    value={dateState}
                    className="w-48 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="all">All Users</option>
                    <option value="active">Active Users</option>
                    <option value="inactive">Inactive Users</option>
                </select>
                {/* 🔹 Custom date range inputs */}
                {dateFilter === 'custom' && (
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            className="px-2 py-1 border rounded-md"
                        />
                        <input
                            type="date"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            className="px-2 py-1 border rounded-md"
                        />
                    </div>
                )}
            </div>
            {filteredUsers.length > 0 ? (
                <div className="space-y-3">
                    {filteredUsers.map((user) => (
                        <div
                            key={user.id}
                            className="bg-white rounded-lg shadow hover:shadow-md transition"
                        >
                            {/* Row Header */}
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center space-x-4">
                                    {user.photoURL && (
                                        <img
                                            src={user.photoURL ? user.photoURL : 'https://via.placeholder.com/150'}
                                            alt={user.name == "" ? user.email.split("@")[0] : user.name}
                                            className="w-12 h-12 rounded-full object-cover border"
                                        />
                                    )}
                                    <div>
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            {user.name || 'N/A'}
                                            {user.blocked && (
                                                <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                                                    Blocked
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {user.email || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                                        onClick={() => {
                                            setExpandedUserId(
                                                expandedUserId === user.id ? null : user.id
                                            );
                                            getCartData(user);
                                            getFavData(user);
                                        }}
                                    >
                                        {expandedUserId === user.id ? 'Hide' : 'View Profile'}
                                    </button>
                                    <button
                                        className={`px-3 py-1 text-white text-sm rounded ${user.blocked
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-red-600 hover:bg-red-700'
                                            } disabled:opacity-50`}
                                        onClick={() => handleToggleBlock(user.id, user.blocked)}
                                        disabled={blocking === user.id}
                                    >
                                        {blocking === user.id
                                            ? 'Updating...'
                                            : user.blocked
                                                ? 'Unblock'
                                                : 'Block'}
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedUserId === user.id && (
                                <div className="bg-gray-50 border-t border-gray-200">
                                    <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-700">
                                        <div>
                                            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Phone
                                            </span>
                                            <span className="mt-1 block font-medium text-gray-900">
                                                {user.phone || 'N/A'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Address
                                            </span>
                                            <span className="mt-1 block font-medium text-gray-900">
                                                {formatAddress(user.address)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Last Login
                                            </span>
                                            <span className="mt-1 block font-medium text-gray-900">
                                                {formatTimestamp(user.lastLoginAt)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Created At
                                            </span>
                                            <span className="mt-1 block font-medium text-gray-900">
                                                {formatTimestamp(user.createdAt)}
                                            </span>
                                        </div>
                                        <div className="md:col-span-2">
                                            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Updated At
                                            </span>
                                            <span className="mt-1 block font-medium text-gray-900">
                                                {formatTimestamp(user.updatedAt)}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Cart */}
                                    <div className="md:col-span-2 px-6 py-4 border-t border-gray-200">
                                        <h4 className="text-sm font-semibold text-indigo-700 mb-2">Cart</h4>
                                        <div className="flex gap-5 flex-wrap">
                                            {cart[user.id]?.length > 0 ? (
                                                cart[user.id].map((item) => (
                                                    <div key={item.id} className="flex items-center gap-3 bg-white p-3 rounded border border-green-100 shadow-sm">
                                                        {item.imageURL && (
                                                            <img src={item.imageURL} alt={item.title} className="w-12 h-12 object-cover rounded" />
                                                        )}
                                                        <div>
                                                            <p className="font-medium">{item.title}</p>
                                                            <p className="text-xs text-gray-500">Qty: {item.qty} | ₹{item.price}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-gray-500 text-sm">No items in cart</p>
                                            )}
                                        </div>
                                    </div>
                                    {/* Favorites */}
                                    <div className="md:col-span-2 mt-4 px-6 py-4 border-t border-gray-200">
                                        <h4 className="text-sm font-semibold text-pink-700 mb-2">Favorites</h4>
                                        <div className="flex gap-5 flex-wrap">
                                            {favs[user.id]?.length > 0 ? (
                                                favs[user.id].map((item) => (
                                                    <div key={item.id} className="flex items-center gap-3 bg-white p-3 rounded border border-green-100 shadow-sm">
                                                        {item.imageURL && (
                                                            <img src={item.imageURL} alt={item.title} className="w-12 h-12 object-cover rounded" />
                                                        )}
                                                        <div>
                                                            <p className="font-medium">{item.title}</p>
                                                            <p className="text-xs text-gray-500">₹{item.price}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-gray-500 text-sm">No favorites yet</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-600 text-center text-lg">No users available.</p>
            )}
        </div>
    );
}
// New OrdersDashboard Component
function OrdersDashboard({ filter, activeState }) {
    const { getOrders } = useOrders();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [search, setSearch] = useState('');
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [selectedCarrier, setSelectedCarrier] = useState({});
    const [orderSuccessCount, setOrderSuccessCount] = useState([]);
    const [orderInvoice, setOrderInvoice] = useState([]);
    const [invoiceDataPdf, setInvoiceDataPdf] = useState(null);
    const [invoiceDataEdit, setInvoiceDataEdit] = useState(false);

    const [statusFilter, setStatusFilter] = useState(activeState == "all" ? "success" : activeState || 'success');

    // 🔹 new date filters
    const [dateFilter, setDateFilter] = useState(filter || "all");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    let successInvoice = 29;

    useEffect(() => {
        if (invoiceDataPdf == null) {
            document.head.querySelector("title").textContent = "franch Global";
            return;
        }
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setInvoiceDataPdf(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [invoiceDataPdf]);

    function handlePrintPdf(name) {
        document.head.querySelector("title").textContent = name;
        window.print();
    }

    useEffect(() => {
        setStatusFilter(activeState == "all" ? "success" : activeState || 'success')
        setDateFilter(filter || "all")
    }, [orders]);

    useEffect(() => {
        if (webhooks && webhooks.length > 0) {
            // console.log("WEBHOOK : ", webhooks)
            setWh_Status(webhooks);
        }
        // webhooks.forEach(wh => {
        //     if (wh.type == "PAYMENT_SUCCESS_WEBHOOK") {
        //         let successfil = ""
        //         filteredOrders.forEach(f => {
        //             if (f.status == "success") {
        //                 if (f.userEmail == wh.data.customer_details.customer_email) {
        //                     successfil += wh.data.customer_details.customer_email + ","
        //                 }
        //             }
        //         })
        //     }
        // });
        // console.log("Webhooks:", webhooks, orederSuccessCount, webhooks.filter(order => order.type === "PAYMENT_SUCCESS_WEBHOOK").length);
    }, [webhooks]);
    // useEffect(() => {
    //     let ids = []
    //     orders.forEach(f => {
    //         const webhookStatus = String(wh_Status.map(item => (item.id == f.id ? item.type : null))).replace(",", "");
    //         if (webhookStatus.includes("PAYMENT_SUCCESS_WEBHOOK") || f.status === "success") {
    //             ids.push(f.id)
    //             console.log("FILTERED STATUS", f.id, wh_Status, webhookStatus, webhookStatus.includes("PAYMENT_SUCCESS_WEBHOOK") || f.status === "success");
    //         }
    //         setOrderSuccessCount(ids)
    //         return webhookStatus.includes("PAYMENT_SUCCESS_WEBHOOK") || f.status === "success"
    //     })
    // }, [orders, wh_Status])

    function invoiceEdit() {
        setInvoiceDataEdit(prev => prev ? false : true)
    }

    function toTitleCase(str) {
        return str
            .toLowerCase()
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }
    const formatTimestampToDDMMYYYY = (timestamp) => {
        // console.log(timestamp);
        try {
            let date;

            // Check if timestamp is a Firestore Timestamp object
            if (timestamp && typeof timestamp.toDate === "function") {
                date = timestamp.toDate();
            } else if (typeof timestamp === "number") {
                // Assume timestamp is in seconds (with optional decimal for nanoseconds)
                date = new Date(timestamp * 1000); // Convert seconds to milliseconds
            } else {
                throw new Error("Invalid timestamp format");
            }

            if (isNaN(date.getTime())) {
                throw new Error("Invalid date");
            }

            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
            const year = date.getFullYear();

            return `${day}.${month}.${year}`;
        } catch (error) {
            console.error("Error formatting timestamp:", error.message);
            return null;
        }
    };

    const createOrder = async (orders, triggerBtn, carrier = "shiprocket") => {
        const addr = orders?.selectedAddress || orders?.address || {};
        const items = (orders?.cart?.length ? orders.cart : orders?.items) || [];
        const cleanPhone = String(orders?.userPhone || orders?.phone || addr?.phone || "").replace(/\D/g, "");

        if (cleanPhone.length < 10) {
            triggerBtn.classList.remove("pointer-events-none", "opacity-50");
            alert("Missing or invalid customer phone for shipment.");
            return;
        }
        if (!items.length) {
            triggerBtn.classList.remove("pointer-events-none", "opacity-50");
            alert("Order has no items. Cannot create shipment.");
            return;
        }

        const line1 = addr?.line1 || addr?.address || orders?.invoice?.receiverDetails?.address || "";
        const orderData = {
            order_id: orders?.razorpay_order_id || `fm_order_${Date.now()}`,
            order_date: new Date().toISOString().slice(0, 10),
            pickup_location: "Primary",
            billing: {
                name: orders?.userName || addr?.name,
                last_name: "",
                address: line1,
                address_2: addr?.area || addr?.line2 || addr?.street || orders?.invoice?.receiverDetails?.address_2 || "",
                city: addr?.city || orders?.invoice?.receiverDetails?.city || "",
                state: addr?.state || orders?.invoice?.receiverDetails?.state || "",
                country: addr?.country || "India",
                pincode: String(addr?.pincode || orders?.invoice?.receiverDetails?.pincode || "").trim(),
                email: orders?.userEmail || "",
                phone: cleanPhone,
            },
            shipping: {
                is_billing: true,
                name: orders?.userName || addr?.name,
                last_name: "",
                address: line1,
                address_2: addr?.area || addr?.line2 || addr?.street || "",
                city: addr?.city || "",
                state: addr?.state || "",
                country: addr?.country || "India",
                pincode: String(addr?.pincode || "").trim(),
                email: orders?.userEmail || "",
                phone: cleanPhone,
            },
            order_items: items.map((item, idx) => {
                const rawPrice = Number(item?.price ?? item?.offer_price ?? 0);
                const price = rawPrice > 1000 ? rawPrice / 100 : rawPrice;
                return {
                    name: item?.title || item?.name || "Product",
                    sku: item?.sku || item?.itemCode || `SKU_${idx + 1}`,
                    units: Math.max(1, Number(item?.qty ?? item?.quantity ?? 1)),
                    selling_price: price,
                    hsn: String(item?.hsn || "30039011").replace(/\D/g, "") || "30039011",
                };
            }),
            payment_method: "Prepaid",
            sub_total: items.reduce((sum, item) => {
                const rawPrice = Number(item?.price ?? item?.offer_price ?? 0);
                const price = rawPrice > 1000 ? rawPrice / 100 : rawPrice;
                return sum + price * Math.max(1, Number(item?.qty ?? item?.quantity ?? 1));
            }, 0),
            length: SHIPROCKET_PACKAGE.length,
            breadth: SHIPROCKET_PACKAGE.breadth,
            height: SHIPROCKET_PACKAGE.height,
            weight: SHIPROCKET_PACKAGE.weight,
        };

        try {
            const endpoint = carrier === "delhivery"
                ? "/api/shipping/delhivery/create-order"
                : "/api/shipping/shiprocket/create-order";
            const { data } = await phpApi.post(endpoint, orderData);
            triggerBtn.classList.remove("pointer-events-none", "opacity-50");
            if (data.success) {
                if (carrier === "delhivery") {
                    const info = data.waybill ? ` Waybill: ${data.waybill}` : "";
                    alert(`Order created in Delhivery.${info}`);
                } else {
                    const srId = data.shiprocket_order_id;
                    const shiprocketUrl = srId
                        ? `https://app.shiprocket.in/seller/orders/details/${srId}`
                        : "https://app.shiprocket.in/seller/orders/processing";
                    alert("Order created in Shiprocket with details filled automatically.");
                    window.open(shiprocketUrl, "_blank");
                }
            } else {
                const err = data.error || data.message || "Unknown error";
                if (String(err).toLowerCase().includes("credentials")) {
                    alert("Add SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in backend-php/.env, then restart the backend.");
                } else if (String(err).toLowerCase().includes("delhivery")) {
                    alert("Add DELHIVERY_API_TOKEN, DELHIVERY_BASE_URL, DELHIVERY_PICKUP_LOCATION, DELHIVERY_CLIENT_CODE in backend-php/.env, then restart the backend.");
                } else {
                    alert("Failed to create shipment: " + err);
                }
            }
        } catch (error) {
            triggerBtn.classList.remove("pointer-events-none", "opacity-50");
            const apiMsg = error?.response?.data?.error || error?.message || "Unknown error";
            alert("Failed to create shipment: " + apiMsg);
        }
    };

    function formatNumber(num, length = 4) {
        return String(num).padStart(length, "0");
    }

    const INVOICE_RESET_START = new Date("2026-06-02T00:00:00+05:30");
    const parseOrderCreatedAt = (createdAt) => {
        if (!createdAt) return null;
        if (typeof createdAt?.toDate === "function") return createdAt.toDate();
        const parsed = new Date(createdAt);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    };
    const formatInvoiceCode = (order, invoiceNumber) => {
        const createdAt = parseOrderCreatedAt(order?.createdAt);
        const isResetSeries = !!createdAt && createdAt >= INVOICE_RESET_START;
        const prefix = isResetSeries ? "FM2627" : "FM2526";
        return `${prefix}${formatNumber(invoiceNumber)}`;
    };

    async function invoiceData(order, invoiceCount) {
        const latestOrder = order;
        // console.log("Latest Order for Invoice:", latestOrder);
        const orderItems = latestOrder?.items || [];

        const itemDetails = orderItems.map(item => ({
            code: item.itemCode,
            name: item.title,
            hsn: item.hsn || "30039011",
            unit: item.price,
            qty: item.qty,
            taxable: item.originalPrice || (item.price / 1.05).toFixed(2),
            cgstRate: "2.5",
            cgstAmount: "5",
            sgstRate: "2.5",
            sgstAmount: "5",
            igstRate: "0",
            igstAmount: "0",
            totalAmount: item.price * item.qty
        }));

        const totalAmount = orderItems.reduce((acc, item) => (acc + (item.price * item.qty)), 0);
        // console.log("===========TOTAL===============", totalAmount)
        const amountInWords = toWords(totalAmount) + " Rupees Only";
        // console.log("===========amountInWords===============", amountInWords)

        // console.log("========== " + latestOrder.createdAt)

        const invoiceDatas = {
            invoiceNo: formatInvoiceCode(latestOrder, invoiceCount),
            invoiceDate: formatTimestampToDDMMYYYY(latestOrder.createdAt), // 23 September 2025 at 12:28:59 UTC+5:30 to 23.09.2025
            receiver: {
                name: latestOrder?.userName || "Unknown",
                address: latestOrder?.address?.line1 + " " + (latestOrder?.address?.street || "") || "Unknown",
                city: latestOrder?.address?.city || "Unknown",
                state: latestOrder?.address?.state || "Unknown",
                pincode: latestOrder?.address?.pincode || "Unknown",
                contact: latestOrder?.userPhone || "Unknown",
            },
            consignee: {
                name: latestOrder?.userName || "Unknown",
                address: latestOrder?.address?.line1 + " " + (latestOrder?.address?.street8 || "") || "Unknown",
                city: latestOrder?.address?.city || "Unknown",
                state: latestOrder?.address?.state || "Unknown",
                pincode: latestOrder?.address?.pincode || "Unknown",
                contact: latestOrder?.userPhone || "Unknown",
            },
            items: itemDetails.length > 0 ? itemDetails : [
                {
                    code: "test-sku",
                    name: "Test Product\nSample Description",
                    hsn: "30039011",
                    unit: "000.00",
                    qty: "1",
                    taxable: "00.00",
                    cgstRate: "2.5",
                    cgstAmount: "5",
                    sgstRate: "2.5",
                    sgstAmount: "5",
                    igstRate: "0",
                    igstAmount: "0",
                    totalAmount: "000.00"
                }
            ],
            totalAmount: totalAmount,
            amountInWords: toTitleCase(amountInWords),
            terms: [
                "Seller is not responsible for any loss or damage of goods in transit",
                "Dispute if any will be Subject to Chennai, Tamil Nadu Court Jurisdiction Only",
                "Any inaccuracy in this bill must be notified immediately on its receipt",
                "This is a Computer Generated Invoice"
            ]
        }

        return invoiceDatas;
    }

    const handleDownloadPDF = async (order, invoiceNumber) => {
        // console.log("Generating invoice data for order:", order);
        const invoiceDataResolved = await invoiceData(order, invoiceNumber);
        setInvoiceDataEdit(false)
        setInvoiceDataPdf(invoiceDataResolved);
    };

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const orderData = await getOrders();
                setOrders(orderData);
            } catch (err) {
                setError(err.message || 'Failed to fetch orders');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const formatTimestamp = (timestamp) => {
        if (timestamp && typeof timestamp.toDate === "function") {
            return timestamp.toDate().toLocaleString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Kolkata",
            });
        }
        return "N/A";
    };

    const formatAddress = (address) => {
        if (!address) return "N/A";
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
        return parts.length ? parts.join(", ") : "N/A";
    };

    useEffect(() => {
        // 🔹 Pre-calc invoice numbers for SUCCESS orders only
        const successOrders = orders
            .filter(order => {
                const id = order.id;
                const isSuccess = webhooks.some(
                    w => w.id === id && w.type === "PAYMENT_SUCCESS_WEBHOOK"
                );
                return isSuccess;
            })
            .sort((a, b) => {
                const aDate = typeof a.createdAt.toDate === "function"
                    ? a.createdAt.toDate()
                    : new Date(a.createdAt);

                const bDate = typeof b.createdAt.toDate === "function"
                    ? b.createdAt.toDate()
                    : new Date(b.createdAt);

                return aDate - bDate; // oldest to latest, change if you want reverse
            });

        const legacySuccessOrders = successOrders.filter((order) => {
            const createdAt = parseOrderCreatedAt(order?.createdAt);
            return !createdAt || createdAt < INVOICE_RESET_START;
        });
        const resetSuccessOrders = successOrders.filter((order) => {
            const createdAt = parseOrderCreatedAt(order?.createdAt);
            return !!createdAt && createdAt >= INVOICE_RESET_START;
        });

        // assign invoice numbers
        const ordersWithInvoice = orders.map(order => {
            const legacyIndex = legacySuccessOrders.findIndex(o => o.id === order.id);
            const resetIndex = resetSuccessOrders.findIndex(o => o.id === order.id);
            let invoiceNumber = 0;
            if (resetIndex !== -1) {
                invoiceNumber = 105 + resetIndex;
            } else if (legacyIndex !== -1) {
                invoiceNumber = 29 + (legacyIndex + 1);
            }
            return {
                ...order,
                invoiceNumber,
            };
        });

        setOrderInvoice(ordersWithInvoice);

        // console.log("Orders with Invoice Numbers:", ordersWithInvoice);

    }, [orders, webhooks]);


    // 🔹 filter by search, status, and date
    useEffect(() => {
        const q = search.toLowerCase();
        const now = new Date();

        const filtered = orders.filter(order => {
            const email = order.userEmail || order.data?.customer_details?.customer_email || "";
            const name = order.userName || order.data?.customer_details?.customer_name || "";
            const id = order.id || "";

            const matchesSearch =
                id.toLowerCase().includes(q) ||
                email.toLowerCase().includes(q) ||
                name.toLowerCase().includes(q);

            const hasSuccessWebhook = webhooks.some(
                w => w.id === id && w.type === "PAYMENT_SUCCESS_WEBHOOK"
            );
            const hasAnyWebhook = webhooks.some(w => w.id === id);

            const matchesStatus =
                (statusFilter === "success" && hasSuccessWebhook) ||
                (statusFilter === "failed" && !hasAnyWebhook);

            let matchesDate = true;
            if (order.createdAt) {
                const created = typeof order.createdAt.toDate === "function"
                    ? order.createdAt.toDate()
                    : new Date(order.createdAt);

                if (dateFilter === "today") {
                    matchesDate = created.toDateString() === now.toDateString();
                } else if (dateFilter === "lastWeek") {
                    const lastWeek = new Date();
                    lastWeek.setDate(now.getDate() - 7);
                    matchesDate = created >= lastWeek;
                } else if (dateFilter === "lastMonth") {
                    const lastMonth = new Date();
                    lastMonth.setMonth(now.getMonth() - 1);
                    matchesDate = created >= lastMonth;
                } else if (dateFilter === "lastYear") {
                    const lastYear = new Date();
                    lastYear.setFullYear(now.getFullYear() - 1);
                    matchesDate = created >= lastYear;
                } else if (dateFilter === "custom" && customStart && customEnd) {
                    const start = new Date(customStart);
                    const end = new Date(customEnd);
                    matchesDate = created >= start && created <= end;
                }
            }

            return matchesSearch && matchesStatus && matchesDate;
        });

        setFilteredOrders(filtered);
    }, [orders, search, statusFilter, dateFilter, customStart, customEnd, webhooks]);


    const toggleExpand = (id) => {
        setExpandedOrderId(expandedOrderId === id ? null : id);
    };

    if (loading) {
        return <div className="text-gray-500 text-center p-6">Loading orders...</div>;
    }

    if (error) {
        return <div className="text-rose-500 text-center p-6">{error}</div>;
    }

    return (
        <>
            <div className="p-6 bg-gray-50 min-h-screen">
                <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-2">
                    Orders Dashboard
                </h1>
                <div className="mb-4 flex flex-wrap gap-4 justify-start items-center">
                    <input
                        type="text"
                        placeholder="Search by order ID, user email, or name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full md:w-1/3 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <select
                        onChange={(e) => setStatusFilter(e.target.value)}
                        value={statusFilter}
                        className="w-48 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="success">Success</option>
                        <option value="failed">Failed</option>
                    </select>
                    <select
                        onChange={(e) => setDateFilter(e.target.value)}
                        value={dateFilter}
                        className="w-48 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="all">All Dates</option>
                        <option value="today">Today</option>
                        <option value="lastWeek">Last Week</option>
                        <option value="lastMonth">Last Month</option>
                        <option value="lastYear">Last Year</option>
                        <option value="custom">Custom Range</option>
                    </select>
                    {dateFilter === "custom" && (
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="px-2 py-1 border rounded-md"
                            />
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="px-2 py-1 border rounded-md"
                            />
                        </div>
                    )}
                </div>
                <div className="bg-white grid grid-cols-5 rounded-xl p-6 border border-indigo-200 shadow-md">
                    <div className={`overflow-x-auto ${expandedOrderId ? 'col-span-3' : 'col-span-5'}`}>
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-600 border-b border-indigo-200">
                                    <th className="py-3 pr-3">#</th>
                                    <th className="py-3 pr-3">User Email</th>
                                    <th className="py-3 pr-3">Total (₹)</th>
                                    <th className="py-3 pr-3">Status</th>
                                    {expandedOrderId == null && (<th className="py-3 pr-3">Created At</th>)}
                                    <th className="py-3 pr-3">Invoice No</th>
                                    <th className="py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!wh_load && wh_Status.length > 0 && filteredOrders.map((order, i) => {
                                    // console.log(order.userEmail, order.id, "OrderCount : ")
                                    // console.log("TEST : ", filteredOrders, wh_Status)
                                    const id = order.id || "";
                                    const hasSuccessWebhook = webhooks.some(
                                        w => w.id === id && w.type === "PAYMENT_SUCCESS_WEBHOOK"
                                    );
                                    const webhookStatus = String(wh_Status.filter(wh => wh.status != "success").map(item => (item.id == order.id ? item.type : null))).replace(",", "");
                                    // console.log(i, order.id, order.userEmail, order.status, webhookStatus)
                                    const invoiceNumber = orderInvoice.filter(o => o.id == order.id).length > 0 ? orderInvoice.filter(o => o.id == order.id)[0].invoiceNumber : successInvoice + i + 1;
                                    return <tr key={order.id} className="border-b border-indigo-200 h-16 hover:bg-indigo-50 transition-all duration-200">
                                        <td className="py-3 pr-3">{i + 1}</td>
                                        <td className="py-3 pr-3">{order.userEmail}</td>
                                        <td className="py-3 pr-3">₹{order.total?.toLocaleString() || 0}</td>
                                        <td className="py-3 pr-3">
                                            <span className={`${hasSuccessWebhook ? 'bg-green-100 text-green-700' : `${hasSuccessWebhook ? 'bg-green-100 text-green-700' : `${(order.status == "processing") ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}`} px-2 py-1 text-xs rounded`}>
                                                {hasSuccessWebhook ? "PAID" : (order.status == "processing") ? "CHECKOUT INITIATED" : "CANCELED BY USER"}
                                            </span>
                                        </td>
                                        {expandedOrderId == null && (<td className="py-3 pr-3">{formatTimestamp(order.createdAt)}</td>)}
                                        <td className={`${hasSuccessWebhook ? `` : "text-red-400"} py-3 pr-3`}>{hasSuccessWebhook ? formatInvoiceCode(order, invoiceNumber) : "---"}</td>
                                        <td className="py-3 flex items-center gap-2">
                                            <button
                                                title='Expand'
                                                onClick={() => toggleExpand(order.id)}
                                                className={`${expandedOrderId === order.id ? 'bg-indigo-700' : 'text-indigo-900'} px-2 py-2 cursor-pointer rounded  bg-indigo-100 hover:bg-indigo-700 hover:text-white transition-all duration-200`}
                                            >
                                                <MaskImage hBg='white' bg={expandedOrderId === order.id ? 'white' : 'blue'} url={expandedOrderId === order.id ? 'https://api.iconify.design/material-symbols:visibility-off-outline-rounded.svg' : 'https://api.iconify.design/material-symbols:visibility-outline.svg'} />
                                            </button>
                                            <button
                                                title='Invoice PDF'
                                                onClick={() => handleDownloadPDF(order, invoiceNumber)}
                                                className={`${hasSuccessWebhook ? "" : "pointer-events-none opacity-25"} px-2 py-2 cursor-pointer rounded text-green-900 bg-green-100 hover:bg-green-700 hover:text-white transition-all duration-200`}
                                            >
                                                <MaskImage hBg='white' bg="green" url='https://api.iconify.design/mdi:printer.svg' />
                                            </button>
                                            <select
                                                value={selectedCarrier[order.id] || "shiprocket"}
                                                onChange={(e) => setSelectedCarrier((prev) => ({ ...prev, [order.id]: e.target.value }))}
                                                className={`${hasSuccessWebhook ? "" : "pointer-events-none opacity-25"} px-2 py-2 cursor-pointer rounded text-xs border border-gray-300 bg-white`}
                                                title="Select courier"
                                            >
                                                <option value="shiprocket">Shiprocket</option>
                                                <option value="delhivery">Delhivery</option>
                                            </select>
                                            <button
                                                title='Shiprocket'
                                                onClick={(e) => {
                                                    e.currentTarget.classList.add('pointer-events-none', 'opacity-25');
                                                    createOrder(order, e.currentTarget, selectedCarrier[order.id] || "shiprocket");
                                                }}
                                                className={`${hasSuccessWebhook ? "" : "pointer-events-none opacity-25"} px-2 py-2 cursor-pointer rounded text-red-100 bg-red-100 hover:bg-red-700 hover:text-white transition-all duration-200`}
                                            >
                                                <MaskImage hBg='white' bg="red" url='https://api.iconify.design/material-symbols:delivery-truck-speed-rounded.svg' />
                                            </button>
                                        </td>
                                    </tr>
                                })}
                                {filteredOrders.length === 0 && (
                                    <tr>
                                        <td className="py-6 text-gray-500" colSpan={6}>
                                            No orders found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {filteredOrders.map((order) => (
                        expandedOrderId === order.id && (
                            <div key={order.id} className="col-span-2 mt-4 bg-gray-50 rounded-lg p-6 border border-indigo-200 sticky top-0 h-max max-h-[80vh] overflow-y-auto">
                                <h3 className="text-lg font-semibold text-indigo-800 mb-4">Order Details: {order.id}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-700">
                                    <div>
                                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">User Name</span>
                                        <span className="mt-1 block font-medium text-gray-900">{order.userName || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">User Email</span>
                                        <span className="mt-1 block font-medium text-gray-900">{order.userEmail || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">User Phone</span>
                                        <span className="mt-1 block font-medium text-gray-900">{order.userPhone || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</span>
                                        <span className="mt-1 block font-medium text-gray-900">₹{order.total?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</span>
                                        <span className="mt-1 block font-medium text-gray-900">{formatAddress(order.address)}</span>


                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</span>
                                        <span className="mt-1 block font-medium text-gray-900">{order.status || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</span>
                                        <span className="mt-1 block font-medium text-gray-900">{formatTimestamp(order.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h4 className="text-sm font-semibold text-indigo-700 mb-2">Products</h4>
                                    <div className="flex gap-5 flex-wrap">
                                        {order.items?.length > 0 ? (
                                            order.items.map((item) => (
                                                <div key={item.productId} className="flex items-center gap-3 bg-white p-3 rounded border border-indigo-100 shadow-sm">
                                                    {item.imageURL && (
                                                        <img src={item?.imageURL} alt={item.title} className="w-12 h-12 object-cover rounded" />
                                                    )}
                                                    <div>
                                                        <p className="font-medium">{item.title}</p>
                                                        <p className="text-xs text-gray-500">Qty: {item.qty} | ₹{item.price?.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-sm">No products in this order.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    ))}
                </div>
            </div >
            {invoiceDataPdf !== null && (
                <div className="fixed inset-0 z-999 bg-white overflow-y-auto">
                    {/* Fixed Top-Right Close Button */}
                    <div className="print-hidden fixed top-5 right-6 z-[1000] flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setInvoiceDataPdf(null)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900/90 hover:bg-red-600 text-white font-semibold text-xs shadow-xl backdrop-blur-md transition-all cursor-pointer border border-white/20"
                            title="Close Invoice (Press Esc)"
                        >
                            <X className="w-4 h-4" />
                            <span>Close (Esc)</span>
                        </button>
                    </div>

                    <Invoice orderData={invoiceDataPdf} edit={invoiceDataEdit} />

                    {/* Floating Bottom Toolbar (Edit, Print, Close) */}
                    <div className="print-hidden fixed right-6 bottom-6 z-[1000] flex items-center gap-2.5 bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-slate-700/80">
                        <button
                            type="button"
                            onClick={() => invoiceEdit()}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition cursor-pointer shadow-sm ${
                                invoiceDataEdit
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-slate-800 hover:bg-slate-700 border border-slate-600"
                            }`}
                        >
                            {invoiceDataEdit ? <Save className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
                            <span>{invoiceDataEdit ? "Save" : "Edit"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handlePrintPdf(invoiceDataPdf.invoiceNo)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer shadow-sm"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setInvoiceDataPdf(null)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition cursor-pointer shadow-sm"
                            title="Close Invoice (Esc)"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span>Close</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
// Customer enquiry
function EnquiryDashboard() {
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const q = query(collection(db, "enquiries"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(
            q,
            (snap) => {
                const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                setEnquiries(data);
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching enquiries:", err);
                setLoading(false);
            }
        );

        return () => unsub();
    }, []);

    const formatTimestamp = (timestamp) => {
        if (timestamp && typeof timestamp.toDate === "function") {
            return timestamp.toDate().toLocaleString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        }
        return "N/A";
    };

    const filtered = enquiries.filter((e) => {
        const q = search.toLowerCase();
        return (
            e.name?.toLowerCase().includes(q) ||
            e.email?.toLowerCase().includes(q) ||
            e.phone?.toLowerCase().includes(q) ||
            e.message?.toLowerCase().includes(q)
        );
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen text-gray-700 text-lg">
                Loading enquiries...
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-2">
                Website Enquiry
            </h1>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by name, email, phone, or message..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:w-1/3 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
            </div>

            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                    {filtered.map((enquiry) => (
                        <div
                            key={enquiry.id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition transform hover:-translate-y-1 duration-200 p-5 space-y-3"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <div className='flex flex-col gap-1'>
                                    <h3 className="text-lg font-semibold text-gray-900">Name : {enquiry.name}</h3>
                                    <div className="flex gap-3">
                                        <a href={`mailto:${enquiry.email.toLowerCase()}`} className="bg-gray-100 px-2 rounded-3xl py-1 text-sm text-gray-700 flex items-center gap-1"><MaskImage hBg='blue' bg="blue" url="https://api.iconify.design/ic:outline-mail.svg" />{enquiry.email}</a>
                                        <a href={`tel:+91${enquiry.phone.toLowerCase()}`} className="bg-gray-100 px-2 rounded-3xl py-1 text-sm text-gray-700 flex items-center gap-1"><MaskImage hBg='green' bg="green" url="https://api.iconify.design/material-symbols:call.svg" />{enquiry.phone}</a>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {formatTimestamp(enquiry.createdAt)}
                                </span>
                            </div>

                            {/* Message */}
                            <div className="bg-gray-100 p-3 rounded-lg border border-gray-100">
                                <p className="text-gray-700 text-sm leading-relaxed">{enquiry.message}</p>
                            </div>
                        </div>
                    ))}

                </div>
            ) : (
                <p className="text-gray-600 text-center text-lg">
                    No enquiries available.
                </p>
            )}
        </div>
    );
}
// Admin Dashboard
function AdminDashboard() {
    const { user, logout, loading } = useAuth();
    const { search } = useLocation();
    const params = new URLSearchParams(search);
    const filter = params.get("filter") || "all";
    const activeState = params.get("state") || "all";
    const navigate = useNavigate();
    const isAdmin = !!user && ADMIN_EMAILS.includes(user.email || '');
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
    const [isBlogDropdownOpen, setIsBlogDropdownOpen] = useState(false);
    const { tab } = useParams();
    const [activeTab, setActiveTab] = useState(tab || 'overview');
    const { stats: userStats } = useUser();
    const [dashboardData, setDashboardData] = useState({});
    const { stats: orderStats, orders } = useOrders();
    const [o_dashboardData, setO_DashboardData] = useState({});

    useEffect(() => {
        setActiveTab(tab || 'overview');
        // console.log(userStats);

        setDashboardData(prev => ({
            ...prev,  // keep old values
            totalUsers: userStats.totalUsers || 0,
            activeUsers: userStats.activeUsers || 0,
            inactiveUsers: userStats.inactiveUsers || 0,
            today: userStats.todayUsers || 0,
            yesterday: userStats.yesterdayUsers || 0,
            thisWeek: userStats.thisWeekUsers || 0,
            thisMonth: userStats.thisMonthUsers || 0,
            thisYear: userStats.thisYearUsers || 0,
        }));
        setO_DashboardData(prev => ({
            ...prev,
            totalOrders: orderStats.totalOrders || 0,
            activeOrders: orderStats.activeOrders || 0,
            completedOrders: orderStats.completedOrders || 0,
            pendingOrders: orderStats.pendingOrders || 0,
            cancelledOrders: orderStats.cancelledOrders || 0,
            statusCounts: orderStats.statusCounts || {},
            todayOrders: orderStats.todayOrders || 0,
            today: orderStats.todayOrders || 0,
            yesterday: orderStats.yesterdayOrders || 0,
            thisWeek: orderStats.thisWeekOrders || 0,
            thisMonth: orderStats.thisMonthOrders || 0,
            thisYear: orderStats.thisYearOrders || 0,
        }));
        let notSuccess = "";
        orders.forEach(o => {
            if (o.status == "success") notSuccess += o.userEmail + "," + o.id + ",";
        })
        // console.log("my Orders : ", notSuccess)
        webhooks.forEach(wh => {
            if (wh.type == "PAYMENT_SUCCESS_WEBHOOK") {
                // console.log(notSuccess, wh)
                if (!notSuccess.includes(wh.data.customer_details.customer_email) && !notSuccess.includes(wh.id)) {
                    setO_DashboardData(prev => ({ ...prev, statusCounts: { ...prev.statusCounts, success: (prev.statusCounts.success || 0) + 1, failed: (prev.statusCounts.failed || 0) - 1 } }));
                }
                if (notSuccess.includes(wh.data.customer_details.customer_email) && notSuccess.includes(wh.id)) {
                    // console.log("yes Matched", wh.data.customer_details.customer_email)
                }
            }
            // console.log("KKKKKKKKKKKKKKKKKK ", wh, wh?.data?.customer_details?.customer_email, wh.id, notSuccess)
        });
        // console.log("Webhooks:", webhooks);
    }, [tab, userStats, orderStats, wh_load, webhooks, orders]);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/auth', { replace: true });
        }
    }, [user, navigate, loading]);

    if (!user) return null;
    if (!isAdmin) {
        return (
            <div className="min-h-screen grid place-items-center bg-gray-100 p-6">
                <div className="max-w-md bg-white rounded-2xl p-6 shadow-md">
                    <h2 className="text-xl font-semibold text-gray-800">No access</h2>
                    <p className="text-gray-500 mt-1">This page is restricted to admin accounts.</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mt-4 bg-indigo-600 px-4 py-2 rounded-lg text-white hover:bg-indigo-700 transition-all duration-200"
                    >
                        Go to Homepage
                    </button>
                    <span className="mx-2">or</span>
                    <button
                        onClick={() => navigate('/auth')}
                        className="mt-4 bg-indigo-600 px-4 py-2 rounded-lg text-white hover:bg-indigo-700 transition-all duration-200"
                    >
                        Login as Admin
                    </button>
                </div>
            </div>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':

                return (
                    <section className='p-10'>
                        <h1 className='text-2xl font-bold my-10'>Orders Overview</h1>
                        <div className='w-full'>
                            <div className="grid grid-cols-4 gap-6 w-full">
                                {/* Total Users */}
                                <a href="/admin/dashboard/orders" className="flex max-w-100 border border-blue-400 hover:bg-blue-50 items-center gap-4 bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
                                    <div className="p-3 rounded-2xl bg-blue-100 text-blue-600 text-3xl">
                                        <MaskImage size="1em" hBg='hsl(221, 97%, 24%)' bg='hsl(221, 97%, 54%)' url="https://api.iconify.design/material-symbols:garden-cart-outline.svg" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700">Total Orders</h3>
                                        <p className="text-4xl font-medium text-blue-600">{o_dashboardData.totalOrders}</p>
                                    </div>
                                </a>

                                {/* Active Orders */}
                                <a href="/admin/dashboard/orders?state=success" className="flex max-w-100 border border-green-400 hover:bg-green-50 items-center gap-4 bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
                                    <div className="p-3 rounded-2xl bg-green-100 text-green-600 text-3xl ">
                                        <MaskImage size="1em" hBg='hsl(142, 100%, 20%)' bg='hsl(142, 100%, 33%)' url="https://api.iconify.design/material-symbols:shopping-cart-checkout-outline-rounded.svg" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-700">Success Orders</h3>
                                        <p className="text-4xl font-medium text-green-600">{webhooks.length}</p>
                                    </div>
                                </a>

                                {/* Inactive Orders */}
                                <a href="/admin/dashboard/orders?state=failed" className="flex max-w-100 border border-red-400 hover:bg-red-50 items-center gap-4 bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
                                    <div className="p-3 rounded-2xl bg-red-100 text-red-600 text-3xl ">
                                        <MaskImage size="1em" hBg='hsl(357, 100%, 35%)' bg='hsl(357, 100%, 45%)' url="https://api.iconify.design/material-symbols:shopping-cart-off-outline-sharp.svg" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-700">Failed Orders</h3>
                                        <p className="text-4xl font-medium text-red-600">{(o_dashboardData?.statusCounts?.processing ? o_dashboardData.statusCounts?.processing : 0) + (o_dashboardData?.statusCounts?.failed ? o_dashboardData.statusCounts?.failed : 0)}</p>
                                    </div>
                                </a>
                                {/* Today's Orders */}
                                <a href="/admin/dashboard/orders?filter=today" className="flex max-w-100 border border-yellow-400 hover:bg-yellow-50 items-center gap-4 bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
                                    <div className="p-3 rounded-2xl bg-yellow-100 text-yellow-600 text-3xl ">
                                        <MaskImage size="1em" hBg='hsl(39, 100%, 31%)' bg='hsl(39, 100%, 41%)' url="https://api.iconify.design/material-symbols:remove-shopping-cart.svg" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-700">Today's Orders</h3>
                                        <p className="text-4xl font-medium text-yellow-600">{o_dashboardData.todayOrders ? o_dashboardData.todayOrders : 0}</p>
                                    </div>
                                </a>
                            </div>
                            <div className="flex items-center justify-between w-full">
                                <div className='max-w-[500px] w-[50%] flex justify-center'>
                                    <PieChart
                                        className="w-full"
                                        totalUsers={o_dashboardData.totalOrders}
                                        activeUsers={webhooks.length}
                                        inactiveUsers={(o_dashboardData?.statusCounts?.processing ? o_dashboardData.statusCounts?.processing : 0) + (o_dashboardData?.statusCounts?.failed ? o_dashboardData.statusCounts?.failed : 0)}
                                        todayUsers={o_dashboardData.todayOrders}
                                    />
                                </div>
                                <div className='w-[50%]'>
                                    <UserBarChart stats={o_dashboardData} name="Orders" />
                                </div>
                            </div>
                        </div>
                        <h1 className='text-2xl font-bold mb-10'>Users Overview</h1>
                        <div className='w-full'>
                            <div className="grid grid-cols-4 gap-6 w-full">
                                {/* Total Users */}
                                <a href="/admin/dashboard/users?filter=all" className="flex max-w-100 border border-blue-400 hover:bg-blue-50 items-center gap-4 bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
                                    <div className="p-3 rounded-2xl bg-blue-100 text-blue-600 text-3xl">
                                        <MaskImage size="1em" hBg='hsl(221, 97%, 24%)' bg='hsl(221, 97%, 54%)' url="https://api.iconify.design/material-symbols:groups-2.svg" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700">Total Users</h3>
                                        <p className="text-4xl font-medium text-blue-600">{dashboardData.totalUsers}</p>
                                    </div>
                                </a>

                                {/* Active Users */}
                                <a href="/admin/dashboard/users?state=active" className="flex max-w-100 border border-green-400 hover:bg-green-50 items-center gap-4 bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
                                    <div className="p-3 rounded-2xl bg-green-100 text-green-600 text-3xl ">
                                        <MaskImage size="1em" hBg='hsl(142, 100%, 20%)' bg='hsl(142, 100%, 33%)' url="https://api.iconify.design/material-symbols:person-check-rounded.svg" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-700">Active Users</h3>
                                        <p className="text-4xl font-medium text-green-600">{dashboardData.activeUsers}</p>
                                    </div>
                                </a>
                                {/* Inactive Users */}
                                <a href="/admin/dashboard/users?state=inactive" className="flex max-w-100 border border-red-400 hover:bg-red-50 items-center gap-4 bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
                                    <div className="p-3 rounded-2xl bg-red-100 text-red-600 text-3xl ">
                                        <MaskImage size="1em" hBg='hsl(357, 100%, 35%)' bg='hsl(357, 100%, 45%)' url="https://api.iconify.design/material-symbols:person-cancel-rounded.svg" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-700">InActive Users</h3>
                                        <p className="text-4xl font-medium text-red-600">{dashboardData.inactiveUsers}</p>
                                    </div>
                                </a>
                                {/* Tody's Users */}
                                <a href="/admin/dashboard/users?filter=today" className="flex max-w-100 border border-yellow-400 hover:bg-yellow-50 items-center gap-4 bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
                                    <div className="p-3 rounded-2xl bg-yellow-100 text-yellow-600 text-3xl ">
                                        <MaskImage size="1em" hBg='hsl(39, 100%, 31%)' bg='hsl(39, 100%, 41%)' url="https://api.iconify.design/material-symbols:person-add-rounded.svg" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-700">Today's Users</h3>
                                        <p className="text-4xl font-medium text-yellow-600">{dashboardData.today}</p>
                                    </div>
                                </a>
                            </div>
                            <div className="flex items-center justify-between w-full">
                                <div className='max-w-[500px] w-[50%] flex justify-center'>
                                    <PieChart
                                        className="w-full"
                                        totalUsers={dashboardData.totalUsers}
                                        activeUsers={dashboardData.activeUsers}
                                        inactiveUsers={dashboardData.inactiveUsers}
                                        todayUsers={dashboardData.today}
                                    />
                                </div>
                                <div className='w-[50%]'>
                                    <UserBarChart stats={dashboardData} name="Users" />
                                </div>
                            </div>
                        </div>
                    </section>
                );
            case 'products-create':
                return <AdminInner email={user.email} onLogout={logout} modes="create" />;
            case 'products-edit':
                return <AdminInner email={user.email} onLogout={logout} modes="edit" />;
            case 'products-list':
                return <AdminInner email={user.email} onLogout={logout} modes="list" />;
            case 'blogs-create':
                return <AdminBlogInner email={user.email} onLogout={logout} modes="create" />;
            case 'blogs-edit':
                return <AdminBlogInner email={user.email} onLogout={logout} modes="edit" />;
            case 'blogs-list':
                return <AdminBlogInner email={user.email} onLogout={logout} modes="list" />;
            case 'users':
                return <UserDashboard filter={filter} activeState={activeState} />;
            case 'orders':
                return <OrdersDashboard filter={filter} activeState={activeState} />;
            case 'enquiry':
                return <EnquiryDashboard />;
            default:
                return null;
        }
    };

    return (
        <div className="admin-dashboard grid grid-cols-[280px_1fr] h-screen bg-gray-100">
            <aside className="bg-gradient-to-b from-green-800 to-blue-700 text-white p-6 flex flex-col shadow-lg h-screen">
                <Link
                    to="/"
                >
                    <h2 className="text-2xl font-bold mb-8 tracking-wide">Admin Panel</h2>
                </Link>
                <nav className="flex flex-col space-y-2">
                    <Link
                        to="/admin/dashboard/overview"
                        className={`${tab == "overview" ? "bg-white/30" : ""} flex items-center p-3 rounded-lg text-gray-100 hover:bg-green-700 hover:text-white transition-all duration-300 ease-in-out transform hover:scale-105`}
                    >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                    </Link>
                    <Link
                        to="/admin/dashboard/enquiry"
                        className={`${tab == "enquiry" ? "bg-white/30" : ""} flex items-center p-3 rounded-lg text-gray-100 hover:bg-green-700 hover:text-white transition-all duration-300 ease-in-out transform hover:scale-105`}
                    >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Enquiry
                    </Link>
                    <div className="relative">
                        <button
                            onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                            className="flex items-center w-full p-3 rounded-lg text-gray-100 hover:bg-green-700 hover:text-white transition-all duration-300 ease-in-out transform hover:scale-105"
                        >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0v6l-2 2m-2-2l-2 2m-2-2l-2 2m-2-2l-2 2m-2-2V7m16 0l-8 4-8-4" />
                            </svg>
                            Manage Products
                            <svg
                                className={`w-4 h-4 ml-auto transform transition-transform duration-200 ${isProductDropdownOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {(isProductDropdownOpen || tab == "products-create" || tab == "products-list") && (
                            <div className="mt-1 ml-6 flex flex-col space-y-1  rounded-lg p-2">
                                <Link
                                    to="/admin/dashboard/products-create"
                                    className={`${tab == "products-create" ? "bg-white/30" : ""} p-2 text-sm text-gray-200 hover:bg-green-600 hover:text-white rounded-md transition-all duration-200 ease-in-out`}
                                >
                                    Create Product
                                </Link>
                                <Link
                                    to="/admin/dashboard/products-list"
                                    className={`${tab == "products-list" ? "bg-white/30" : ""} p-2 text-sm text-gray-200 hover:bg-green-600 hover:text-white rounded-md transition-all duration-200 ease-in-out`}
                                >
                                    List Products
                                </Link>
                            </div>
                        )}
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setIsBlogDropdownOpen(!isBlogDropdownOpen)}
                            className="flex items-center w-full p-3 rounded-lg text-gray-100 hover:bg-green-700 hover:text-white transition-all duration-300 ease-in-out transform hover:scale-105"
                        >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m6 12a2 2 0 01-2-2v-1m2 13H5" />
                            </svg>
                            Manage Blogs
                            <svg
                                className={`w-4 h-4 ml-auto transform transition-transform duration-200 ${isBlogDropdownOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {isBlogDropdownOpen && (
                            <div className="mt-1 ml-6 flex flex-col space-y-1 rounded-lg p-2">
                                <Link
                                    to="/admin/dashboard/blogs-create"
                                    className={`${tab == "blogs-create" ? "bg-white/30" : ""} p-2 text-sm text-gray-200 hover:bg-green-600 hover:text-white rounded-md transition-all duration-200 ease-in-out`}
                                >
                                    Create Blog
                                </Link>
                                <Link
                                    to="/admin/dashboard/blogs-list"
                                    className={`${tab == "blogs-list" ? "bg-white/30" : ""} p-2 text-sm text-gray-200 hover:bg-green-600 hover:text-white rounded-md transition-all duration-200 ease-in-out`}
                                >
                                    List Blogs
                                </Link>
                            </div>
                        )}
                    </div>
                    <Link
                        to="/admin/dashboard/orders"
                        className="flex items-center p-3 rounded-lg text-gray-100 hover:bg-green-700 hover:text-white transition-all duration-300 ease-in-out transform hover:scale-105"
                    >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        View Orders
                    </Link>
                    <Link
                        to="/admin/dashboard/users"
                        className="flex items-center p-3 rounded-lg text-gray-100 hover:bg-green-700 hover:text-white transition-all duration-300 ease-in-out transform hover:scale-105"
                    >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        User Management
                    </Link>
                </nav>
            </aside>
            <main className="flex-1 flex flex-col bg-white h-screen overflow-y-auto">
                {/* <div className="p-6 border-b border-green-200 bg-green-50">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 font-medium rounded-t-lg transition-all duration-300 ease-in-out ${activeTab === 'overview'
                                ? 'bg-green-600 text-white'
                                : 'bg-green-200 text-gray-700 hover:bg-green-300 hover:text-green-800'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`px-4 py-2 font-medium rounded-t-lg transition-all duration-300 ease-in-out ${activeTab === 'products'
                                ? 'bg-green-600 text-white'
                                : 'bg-green-200 text-gray-700 hover:bg-green-300 hover:text-green-800'
                                }`}
                        >
                            Products
                        </button>
                        <button
                            onClick={() => setActiveTab('blogs')}
                            className={`px-4 py-2 font-medium rounded-t-lg transition-all duration-300 ease-in-out ${activeTab === 'blogs'
                                ? 'bg-green-600 text-white'
                                : 'bg-green-200 text-gray-700 hover:bg-green-300 hover:text-green-800'
                                }`}
                        >
                            Blogs
                        </button>
                    </div>
                </div> */}
                <div className="p-8 flex-1">
                    <div className="flex gap-4 mb-6">
                        <a href="orders" >
                            <button className="bg-green-100 hover:bg-green-600  px-4 py-2 rounded-lg border border-green-600 text-black hover:text-white cursor-pointer">View Orders</button>
                        </a>
                    </div>
                    {/* <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1> */}
                    {renderTabContent()}
                </div>
            </main>
        </div>
    );
}
function emptyProduct() {
    return {
        title: '',
        subTitle: '',
        price: 0,
        sku: '',
        originalPrice: 0,
        discountPercent: 0,
        isDiscountEnabled: false,
        discountTag: '10%',
        discountPrice: 0,
        discountStrikePrice: 0,
        category: '',
        imageURL: '',
        images: [],
        active: true,
    };
}
function normalizeProduct(p) {
    const { price, originalPrice, discountPercent, isDiscountEnabled, discountTag, discountPrice, discountStrikePrice } = resolveProductPricing({
        price: p.rawPrice ?? p.price,
        originalPrice: p.originalPrice,
        discountPercent: p.discountPercent,
        isDiscountEnabled: p.isDiscountEnabled ?? p.is_discount_enabled,
        discountTag: p.discountTag ?? p.discount_tag ?? '10%',
        discountPrice: p.discountPrice ?? p.discount_price,
        discountStrikePrice: p.discountStrikePrice ?? p.discount_strike_price,
    });

    return {
        title: p.title ?? '',
        subTitle: p.subTitle ?? '',
        price,
        sku: p.sku ?? '',
        originalPrice,
        discountPercent,
        isDiscountEnabled,
        discountTag,
        discountPrice,
        discountStrikePrice,
        category: p.category ?? '',
        description: p.description ?? '',
        imageURL: p.imageURL ?? ((Array.isArray(p.images) && p.images[0]) || ''),
        images: Array.isArray(p.images) ? p.images : [],
        active: typeof p.active === 'boolean' ? p.active : true,
    };
}
function emptyBlog() {
    return {
        title: '',
        slug: '',
        mainImage: '',
        body: [],
        category: '',
        active: true,
    };
}
function normalizeBlog(b) {
    return {
        title: b.title ?? '',
        slug: b.slug ?? generateSlug(b.title),
        mainImage: b.mainImage ?? '',
        body: Array.isArray(b.body)
            ? b.body.map((b) => ({
                type: b.type || 'p',
                content: b.content || '',
                id: b.id || crypto.randomUUID(),
            }))
            : [],
        category: b.category ?? '',
        active: typeof b.active === 'boolean' ? b.active : true,
    };
}
function generateSlug(title) {
    if (!title) return '';
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
export default AdminDashboard;