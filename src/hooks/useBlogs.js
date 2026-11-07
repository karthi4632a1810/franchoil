import { useEffect, useState } from "react";
import { phpApi, phpRoutes } from "../lib/phpApi";
import {
    getCachedBlogs,
    setCachedBlogs,
    generateCacheKey,
    clearAllCachedBlogs,
    BACKGROUND_REFRESH_MIN_AGE_MS
} from "../utils/indexedDB";

export function useBlogs({
    onlyActive = true,
    pageSize = 30,
    sort = "createdAt",
    dir = "desc",
    category,
    search
} = {}) {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchBlogs = async () => {
            const cacheKey = generateCacheKey({
                onlyActive,
                category,
                sort,
                dir,
            }, "blogs");

            const cached = await getCachedBlogs(cacheKey);

            if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
                let rows = cached.data;

                // Client-side filtering
                if (onlyActive) {
                    rows = rows.filter((r) => r.active !== false);
                }

                if (search) {
                    const s = search.toLowerCase();
                    rows = rows.filter((r) => 
                        `${r.title} ${r.body.map(b => b.type !== 'image' ? b.content : '').join(' ')} ${r.slug || ""}`.toLowerCase().includes(s)
                    );
                }

                if (isMounted) {
                    setBlogs(rows.slice(0, pageSize));
                    setLoading(false);
                }

                const now = Date.now();
                if (now - cached.timestamp > BACKGROUND_REFRESH_MIN_AGE_MS) {
                    fetchFromApi(cacheKey, false);
                }
            } else {
                await fetchFromApi(cacheKey, true);
            }
        };

        const fetchFromApi = async (cacheKey, showLoading = true) => {
            try {
                if (showLoading && isMounted) {
                    setLoading(true);
                }

                const { data } = await phpApi.get(phpRoutes.blogs, {
                    params: {
                        onlyActive,
                        category,
                        search,
                        sort,
                        dir,
                        pageSize: pageSize * 2,
                    },
                });
                let rows = Array.isArray(data?.blogs) ? data.blogs : [];

                // Cache the full server result before client-side search filtering
                await setCachedBlogs(cacheKey, rows);

                if (isMounted) {
                    setBlogs(rows.slice(0, pageSize));
                    setLoading(false);
                }
            } catch (e) {
                console.error("Error fetching blogs from PHP API:", e);
                if (isMounted) {
                    setError(e);
                    setLoading(false);
                }
            }
        };

        fetchBlogs();
        
        return () => {
            isMounted = false;
        };
    }, [onlyActive, pageSize, sort, dir, category, search]);

    return { blogs, loading, error };
}

export async function createBlog(data) {
    const payload = {
        title: data.title || "",
        slug: data.slug || generateSlug(data.title),
        mainImage: data.mainImage || "",
        body: Array.isArray(data.body) ? data.body.map(normalizeBlock) : [],
        category: data.category || "",
        active: data.active ?? true,
    };
    const { data: response } = await phpApi.post(phpRoutes.blogs, payload);

    clearAllCachedBlogs().catch(console.error);

    return response?.id;
}

export async function updateBlog(id, data) {
    const payload = {
        ...data,
        slug: data.slug || generateSlug(data.title),
        body: Array.isArray(data.body) ? data.body.map(normalizeBlock) : [],
    };
    await phpApi.put(`${phpRoutes.blogs}/${id}`, payload);

    clearAllCachedBlogs().catch(console.error);
}

export async function deleteBlog(id) {
    await phpApi.delete(`${phpRoutes.blogs}/${id}`);

    clearAllCachedBlogs().catch(console.error);
}

function normalizeBlock(block) {
    // console.log(block)
    return {
        type: block?.type || 'p', // default to paragraph
        content: block?.content || "",
    };
}

function generateSlug(title) {
    if (!title) return "";
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // remove non-word chars
        .replace(/[\s_-]+/g, '-') // swap spaces and underscores to hyphen
        .replace(/^-+|-+$/g, ''); // trim hyphens
}