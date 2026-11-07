import { useState } from "react";
import { Link } from "react-router-dom";
import { useBlogs } from "../hooks/useBlogs.js";
import BannerForAll from "../sections/banner.jsx";

export default function BlogsPage() {
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [visibleCount, setVisibleCount] = useState(6);

    const { blogs, loading, error } = useBlogs({ onlyActive: true, search });

    // Extract unique categories
    const categories = [...new Set(blogs.map((b) => b.category).filter(Boolean))];

    // Filtered blogs
    const filteredBlogs = blogs.filter((b) =>
        (!categoryFilter || b.category === categoryFilter) &&
        (b.title.toLowerCase().includes(search.toLowerCase()) ||
            b.slug.toLowerCase().includes(search.toLowerCase()) ||
            b.body.some((block) =>
                block.content?.toLowerCase().includes(search.toLowerCase())
            ))
    );

    // Blogs to show (pagination)
    const visibleBlogs = filteredBlogs.slice(0, visibleCount);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <BannerForAll title="OUR BLOGS" breadcrumb="OUR BLOGS" />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {/* Search + Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                    <input
                        type="text"
                        placeholder="Search blogs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500"
                    />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">All Categories</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Blogs Grid */}
                {loading && <div className="text-green-500">Loading blogs...</div>}
                {error && <div className="text-red-500">Error: {String(error)}</div>}

                {visibleBlogs.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {visibleBlogs.map((b) => (
                            <div

                                key={b.id}
                                className="bg-white rounded-lg shadow hover:shadow-lg p-4 flex flex-col hover:translate-y-[-10px] transition-transform duration-300"
                            >
                                {b.mainImage && (
                                    <Link
                                        to={`/blog/${b.slug}`} className="block">
                                        <img
                                            src={b.mainImage}
                                            alt={b.title}
                                            className="w-full object-cover rounded mb-4"
                                        />
                                    </Link>
                                )}
                                <Link
                                    to={`/blog/${b.slug}`}>
                                    <h2 className="text-xl font-semibold text-green-700 mb-2">{b.title}</h2>
                                </Link>
                                <p className="text-sm text-gray-500 mb-2">{b.category || "Uncategorized"}</p>
                                <p className="text-gray-600 flex-1">
                                    {b.body.find((blk) => blk.type === "p")?.content?.slice(0, 100) || "Read more..."}
                                </p>
                                <Link
                                    to={`/blog/${b.slug}`}
                                    className="mt-4 inline-block text-green-600 font-medium hover:text-green-800"
                                >
                                    Read More →
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    !loading && <div className="text-gray-500">No blogs found.</div>
                )}

                {/* Load More */}
                {visibleCount < filteredBlogs.length && (
                    <div className="text-center mt-8">
                        <button
                            onClick={() => setVisibleCount((prev) => prev + 6)}
                            className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                        >
                            Load More
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
