import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useStorageUpload from "../hooks/useStorage.js";
import { useBlogs, createBlog, updateBlog, deleteBlog } from "../hooks/useBlogs.js";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

export default function AdminBlog() {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();
    const isAdmin = !!user && ADMIN_EMAILS.includes(user.email || "");

    useEffect(() => {
        if (!loading) {
            if (!user) navigate("/auth", { replace: true });
        }
    }, [user, navigate, loading]);

    if (!user) return null;
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
    return <AdminBlogInner email={user.email} onLogout={logout} />;
}

function SortableItem({ block, index, updateBlock, removeBlock, setPreviewURL }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            className="border border-slate-800 rounded-lg p-3 mt-2 relative"
            style={style}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div
                        className="cursor-grab px-2 py-1 bg-slate-800 rounded-md touch-none"
                        {...attributes}
                        {...listeners}
                    >
                        ↕️
                    </div>
                    <select
                        value={block.type}
                        onChange={(e) => updateBlock(index, "type", e.target.value)}
                        className="text-sm bg-slate-950/60 border border-slate-800 rounded px-2 py-1"
                    >
                        {["h1", "h2", "h3", "p", "image"].map((t) => (
                            <option key={t} value={t}>{t.toUpperCase()}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={() => removeBlock(index)}
                    className="px-2 py-1 text-xs rounded bg-rose-700"
                >
                    Remove
                </button>
            </div>
            {block.type === "image" ? (
                <>
                    {block.content ? (
                        <img
                            src={block.content}
                            alt="block"
                            onClick={() => setPreviewURL(block.content)}
                            className="h-20 w-20 object-cover rounded border border-slate-800 cursor-zoom-in"
                        />
                    ) : (
                        <div className="h-20 w-20 grid place-items-center rounded bg-slate-800">
                            {block.tempId ? "Uploading..." : "No image"}
                        </div>
                    )}
                </>
            ) : (
                <textarea
                    value={block.content}
                    onChange={(e) => updateBlock(index, "content", e.target.value)}
                    rows={block.type.startsWith("h") ? 2 : 5}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
                />
            )}
        </div>
    );
}

function AdminBlogInner({ email, onLogout }) {
    const [search, setSearch] = useState("");
    const { blogs, loading, error } = useBlogs({ onlyActive: false, search, pageSize: 500 });
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState(emptyBlog());
    const { upload, progress, url, error: upErr, reset } = useStorageUpload("blogs");
    const fileRef = useRef(null);
    const [bulk, setBulk] = useState({ running: false, count: 0, done: 0, error: "" });
    const [previewURL, setPreviewURL] = useState("");
    const [activeId, setActiveId] = useState(null);

    useEffect(() => {
        if (url) {
            const pendingBlock = draft.body.find((b) => b.tempId && b.type === "image");
            if (pendingBlock) {
                setDraft((d) => ({
                    ...d,
                    body: d.body.map((b) =>
                        b.tempId === pendingBlock.tempId ? { ...b, content: url, tempId: null } : b
                    ),
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
        // Ensure each block has an ID for drag-and-drop
        const bodyWithIds = Array.isArray(b.body)
            ? b.body.map(block => ({
                ...block,
                id: block.id || crypto.randomUUID()
            }))
            : [];
        setDraft({ ...b, body: bodyWithIds });
        reset();
    };

    const save = async () => {
        if (!draft.title.trim()) return alert("Title is required");
        if (!draft.slug.trim()) return alert("Slug is required");
        const cleanedDraft = {
            ...draft,
            body: draft.body.map(({ tempId, ...rest }) => rest),
        };
        if (editing) await updateBlog(editing, cleanedDraft);
        else await createBlog(cleanedDraft);
        startNew();
    };

    const remove = async (id) => {
        if (!confirm("Delete this blog?")) return;
        await deleteBlog(id);
        if (editing === id) startNew();
    };

    const exportJSON = () => {
        const plain = blogs.map(({ id, title, slug, mainImage, body, category, active }) => ({
            id,
            title,
            slug,
            mainImage,
            body,
            category,
            active,
        }));
        const blob = new Blob([JSON.stringify(plain, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `blogs-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const importJSON = async (file) => {
        try {
            setBulk({ running: true, count: 0, done: 0, error: "" });
            const text = await file.text();
            const arr = JSON.parse(text);
            if (!Array.isArray(arr)) throw new Error("JSON must be an array of blogs");
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
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const addBlock = (type) => {
        setDraft((d) => ({
            ...d,
            body: [...d.body, { id: crypto.randomUUID(), type, content: "", tempId: null }],
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
            body: [...d.body, { id: crypto.randomUUID(), type: "image", content: "", tempId }],
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
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-16">
            <div className="max-w-[1300px] mx-auto">
                <header className="flex items-center gap-3">
                    <Link to="/" className="text-2xl font-bold text-green-700">FranchGlobal</Link>
                    <h1 className="text-2xl font-semibold">/ Blog Panel</h1>
                    <p className="text-slate-400 text-sm ms-auto">Signed in as {email}</p>
                    <button onClick={onLogout} className="rounded-lg bg-slate-800 px-3 py-1.5 hover:bg-slate-700">
                        Logout
                    </button>
                </header>

                <section className="mt-4 grid gap-4 md:grid-cols-[1fr]">
                    {/* Editor */}
                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 grid gap-3 h-max">
                        <h3 className="text-lg font-medium">{editing ? "Edit Blog" : "New Blog"}</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm text-slate-300">Title</label>
                                <input
                                    value={draft.title}
                                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-300">Slug</label>
                                <input
                                    value={draft.slug}
                                    onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-slate-300">Category</label>
                            <input
                                value={draft.category}
                                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm text-slate-300">Main Image</label>
                            {draft.mainImage ? (
                                <img
                                    src={draft.mainImage}
                                    alt="preview"
                                    onClick={() => setPreviewURL(draft.mainImage)}
                                    className="h-32 w-32 object-cover rounded border border-slate-800 cursor-zoom-in"
                                />
                            ) : (
                                <div className="h-32 w-32 grid place-items-center rounded bg-slate-800">No image</div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) upload(f, `blogs/${draft.slug}/`, { isMainImage: true });
                                }}
                                className="text-sm"
                            />
                            {progress > 0 && progress < 100 && (
                                <div className="h-2 w-full bg-slate-800 rounded">
                                    <div className="h-full bg-emerald-500 rounded" style={{ width: `${progress}%` }} />
                                </div>
                            )}
                            {upErr && <div className="text-sm text-rose-300">{String(upErr)}</div>}
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm text-slate-300">Content Blocks</label>
                            <div className="flex flex-wrap gap-2">
                                {[{ "h1": "TITLE BIG" }, { "h2": "TITLE MEDIUM" }, { "h3": "TITLE SMALL" }, { "p": "PARAGRAPH" }].map((type) => (
                                    <button
                                        key={Object.keys(type)[0]}
                                        onClick={() => addBlock(type)}
                                        className="px-2 py-1 text-xs rounded bg-sky-900"
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
                                <label htmlFor="block-image-upload" className="px-2 py-1 text-xs rounded bg-sky-900">
                                    Add Image
                                </label>
                            </div>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                modifiers={[restrictToVerticalAxis]}
                            >
                                <SortableContext
                                    items={draft.body.map((b) => b.id)}
                                    strategy={verticalListSortingStrategy}
                                >
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
                            {draft.body.length === 0 && (
                                <div className="text-slate-400 text-sm">No content blocks yet.</div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={!!draft.active}
                                    onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
                                />
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
                                placeholder="Search title / slug / content"
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

                        {loading && <div className="text-slate-400">Loading...</div>}
                        {error && <div className="text-rose-300">{String(error)}</div>}

                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-slate-400 border-b border-slate-800">
                                        <th className="py-2 pr-3">Title</th>
                                        <th className="py-2 pr-3">Slug</th>
                                        <th className="py-2 pr-3">Active</th>
                                        <th className="py-2 pr-3">Category</th>
                                        <th className="py-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {blogs.map((b) => (
                                        <tr key={b.id} className="border-b border-slate-800 h-16">
                                            <td className="py-2 pr-3">
                                                <div className="flex items-center gap-2">
                                                    {b.mainImage ? (
                                                        <img src={b.mainImage} alt="" className="h-8 w-8 rounded object-cover" />
                                                    ) : (
                                                        <span className="h-8 w-8 grid place-items-center bg-slate-800 rounded">📝</span>
                                                    )}
                                                    <div className="truncate" title={b.title}>
                                                        {b.title}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2 pr-3">{b.slug}</td>
                                            <td className="py-2 pr-3">{b.active ? "Yes" : "No"}</td>
                                            <td className="py-2 pr-3">{b.category || "-"}</td>
                                            <td className="py-2 flex justify-center items-center gap-2 pb-0 h-16">
                                                <button onClick={() => startEdit(b)} className="px-2 py-1 rounded bg-slate-800">
                                                    Edit
                                                </button>
                                                <button onClick={() => remove(b.id)} className="px-2 py-1 rounded bg-rose-700">
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {blogs.length === 0 && !loading && (
                                        <tr>
                                            <td className="py-6 text-slate-400" colSpan={5}>
                                                No blogs found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>

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

function emptyBlog() {
    return {
        title: "",
        slug: "",
        mainImage: "",
        body: [],
        category: "",
        active: true,
    };
}

function normalizeBlog(b) {
    return {
        title: b.title ?? "",
        slug: b.slug ?? generateSlug(b.title),
        mainImage: b.mainImage ?? "",
        body: Array.isArray(b.body) ? b.body.map((b) => ({
            type: b.type || "p",
            content: b.content || "",
            id: b.id || crypto.randomUUID(),
        })) : [],
        category: b.category ?? "",
        active: typeof b.active === "boolean" ? b.active : true,
    };
}

function generateSlug(title) {
    if (!title) return "";
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}