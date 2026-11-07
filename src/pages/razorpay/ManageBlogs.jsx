import { useEffect, useRef, useState } from "react";
import { FileText, Search, Plus, Edit2, Trash2, X, Image as ImageIcon, Download, Upload } from "lucide-react";
import useStorageUpload from "../../hooks/useStorage.js";
import { useBlogs, createBlog, updateBlog, deleteBlog } from "../../hooks/useBlogs.js";
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
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";

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
    };

    return (
        <div
            ref={setNodeRef}
            className="border border-border/50 rounded-lg p-3 mt-2 relative bg-card"
            style={style}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div
                        className="cursor-grab px-2 py-1 bg-muted rounded-md touch-none"
                        {...attributes}
                        {...listeners}
                    >
                        ↕️
                    </div>
                    <select
                        value={block.type}
                        onChange={(e) => updateBlock(index, "type", e.target.value)}
                        className="text-sm bg-background border border-input rounded px-2 py-1"
                    >
                        {["h1", "h2", "h3", "p", "image"].map((t) => (
                            <option key={t} value={t}>{t.toUpperCase()}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={() => removeBlock(index)}
                    className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
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
                            className="h-20 w-20 object-cover rounded border border-border/50 cursor-zoom-in"
                        />
                    ) : (
                        <div className="h-20 w-20 grid place-items-center rounded bg-muted text-muted-foreground">
                            {block.tempId ? "Uploading..." : "No image"}
                        </div>
                    )}
                </>
            ) : (
                <textarea
                    value={block.content}
                    onChange={(e) => updateBlock(index, "content", e.target.value)}
                    rows={block.type.startsWith("h") ? 2 : 5}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus-visible:ring-green-700/30"
                />
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

export default function ManageBlogs() {
    const [search, setSearch] = useState("");
    const { blogs, loading, error } = useBlogs({ onlyActive: false, search, pageSize: 500 });
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState(emptyBlog());
    const { upload, progress, url, error: upErr, reset } = useStorageUpload("blogs");
    const fileRef = useRef(null);
    const [bulk, setBulk] = useState({ running: false, count: 0, done: 0, error: "" });
    const [previewURL, setPreviewURL] = useState("");
    const [activeId, setActiveId] = useState(null);
    const [showForm, setShowForm] = useState(false);

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
        setShowForm(true);
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
        setShowForm(true);
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
        setShowForm(false);
    };

    const remove = async (id) => {
        if (!confirm("Delete this blog?")) return;
        await deleteBlog(id);
        if (editing === id) {
            startNew();
            setShowForm(false);
        }
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
        upload(file, `blogs/${draft.slug}/`);
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
        <div className="min-h-screen overflow-y-scroll bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                            Manage Blogs
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Create, edit, and manage blog posts
                        </p>
                    </div>
                    <Button onClick={startNew} className="bg-green-700 hover:bg-green-800">
                        <Plus className="h-4 w-4 mr-2" />
                        New Blog
                    </Button>
                </div>

                {/* Blog Editor Form */}
                {showForm && (
                    <Card className="border-border/50 shadow-lg">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold">
                                    {editing ? "Edit Blog" : "New Blog"}
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setShowForm(false);
                                        startNew();
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Title *</label>
                                    <Input
                                        value={draft.title}
                                        onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                                        placeholder="Blog title"
                                        className="focus-visible:ring-green-700/30"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Slug *</label>
                                    <Input
                                        value={draft.slug}
                                        onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
                                        placeholder="blog-slug"
                                        className="focus-visible:ring-green-700/30"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium mb-2 block">Category</label>
                                    <Input
                                        value={draft.category}
                                        onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                                        placeholder="Category"
                                        className="focus-visible:ring-green-700/30"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Main Image</label>
                                {draft.mainImage ? (
                                    <div className="relative inline-block">
                                        <img
                                            src={draft.mainImage}
                                            alt="preview"
                                            onClick={() => setPreviewURL(draft.mainImage)}
                                            className="h-32 w-32 object-cover rounded-lg border border-border/50 cursor-zoom-in"
                                        />
                                        <button
                                            onClick={() => setDraft((d) => ({ ...d, mainImage: "" }))}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center">
                                        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                if (f) upload(f, `blogs/${draft.slug}/`);
                                            }}
                                            className="hidden"
                                            id="main-image-upload"
                                        />
                                        <label
                                            htmlFor="main-image-upload"
                                            className="cursor-pointer text-sm text-green-700 hover:underline"
                                        >
                                            Click to upload
                                        </label>
                                        {progress > 0 && progress < 100 && (
                                            <div className="mt-2 h-2 w-full bg-green-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-700 rounded-full" style={{ width: `${progress}%` }} />
                                            </div>
                                        )}
                                        {upErr && <p className="text-xs text-red-500 mt-2">{upErr.message}</p>}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Content Blocks</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addBlock("h1")}
                                        className="border-green-700/30 hover:bg-green-700/10"
                                    >
                                        Add H1
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addBlock("h2")}
                                        className="border-green-700/30 hover:bg-green-700/10"
                                    >
                                        Add H2
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addBlock("h3")}
                                        className="border-green-700/30 hover:bg-green-700/10"
                                    >
                                        Add H3
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addBlock("p")}
                                        className="border-green-700/30 hover:bg-green-700/10"
                                    >
                                        Add Paragraph
                                    </Button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => addImageBlock(e.target.files?.[0])}
                                        className="hidden"
                                        id="block-image-upload"
                                    />
                                    <label
                                        htmlFor="block-image-upload"
                                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 cursor-pointer border-green-700/30 hover:bg-green-700/10"
                                    >
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
                                    <DragOverlay>
                                        {activeId ? (
                                            <div className="border border-border/50 rounded-lg p-3 bg-card opacity-90">
                                                Dragging...
                                            </div>
                                        ) : null}
                                    </DragOverlay>
                                </DndContext>
                                {draft.body.length === 0 && (
                                    <div className="text-muted-foreground text-sm py-4 text-center border border-dashed border-border/50 rounded-lg">
                                        No content blocks yet. Add blocks to start creating your blog post.
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="inline-flex items-center gap-2 text-sm font-medium">
                                    <input
                                        type="checkbox"
                                        checked={!!draft.active}
                                        onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
                                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    />
                                    Active
                                </label>
                                <div className="ml-auto flex gap-2">
                                    <Button variant="outline" onClick={() => { setShowForm(false); startNew(); }}>
                                        Cancel
                                    </Button>
                                    <Button onClick={save} className="bg-green-700 hover:bg-green-800">
                                        {editing ? "Update" : "Create"} Blog
                                    </Button>
                                    {editing && (
                                        <Button onClick={() => remove(editing)} variant="destructive">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Search and Import/Export */}
                <Card className="border-border/50 shadow-md">
                    <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search blogs by title, slug, or content..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 bg-card border-border/50 focus-visible:ring-green-700/30"
                                />
                            </div>
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
                            <Button
                                variant="outline"
                                onClick={() => fileRef.current?.click()}
                                className="border-green-700/30 hover:bg-green-700/10"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Import JSON
                            </Button>
                            <Button
                                variant="outline"
                                onClick={exportJSON}
                                className="border-green-700/30 hover:bg-green-700/10"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export JSON
                            </Button>
                        </div>
                        {bulk.running && (
                            <div className="mt-3 p-3 rounded-lg border border-green-600 bg-green-50 text-green-800 text-sm">
                                Importing… {bulk.done}/{bulk.count}
                            </div>
                        )}
                        {bulk.error && (
                            <div className="mt-3 p-3 rounded-lg border border-red-600 bg-red-50 text-red-800 text-sm">
                                Import error: {bulk.error}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Blogs List */}
                <Card className="border-border/50 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">All Blogs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <p className="text-muted-foreground">Loading blogs...</p>
                            </div>
                        ) : blogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground text-lg font-medium">No blogs found</p>
                                <p className="text-muted-foreground text-sm mt-1">
                                    {search ? "Try adjusting your search query" : "Start by creating your first blog"}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Image</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Slug</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {blogs.map((blog) => (
                                            <TableRow key={blog.id}>
                                                <TableCell>
                                                    {blog.mainImage ? (
                                                        <img
                                                            src={blog.mainImage}
                                                            alt={blog.title}
                                                            className="h-12 w-12 object-cover rounded border border-border/50"
                                                        />
                                                    ) : (
                                                        <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{blog.title || "—"}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-mono text-muted-foreground">{blog.slug || "—"}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">{blog.category || "—"}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={blog.active ? "default" : "secondary"}
                                                        className={blog.active ? "bg-green-700" : ""}
                                                    >
                                                        {blog.active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => startEdit(blog)}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => remove(blog.id)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Preview Modal */}
                {previewURL && (
                    <div
                        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                        onClick={() => setPreviewURL("")}
                    >
                        <img src={previewURL} alt="Preview" className="max-w-full max-h-full object-contain" />
                        <button
                            onClick={() => setPreviewURL("")}
                            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
