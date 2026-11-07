import { useEffect, useState, useCallback } from "react";
import { phpApi, phpRoutes } from "../lib/phpApi";
import {
    getCachedProducts,
    setCachedProducts,
    generateCacheKey,
    clearAllCachedProducts,
    BACKGROUND_REFRESH_MIN_AGE_MS
} from "../utils/indexedDB";
import { preloadImages, clearAllCachedImages } from "../utils/imageCache";

export function useProducts({
    onlyActive = true,
    pageSize = 30,
    sort = "createdAt",
    dir = "desc",
    category,
    search,
    skipFetch = false
} = {}) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshCount, setRefreshCount] = useState(0);

    const refresh = useCallback(async () => {
        try {
            await clearAllCachedProducts();
            await clearAllCachedImages();
        } catch (e) {
            console.error("Failed clearing product cache:", e);
        }
        setRefreshCount((c) => c + 1);
    }, []);

    useEffect(() => {
        if (skipFetch) return;
        
        let isMounted = true;

        const fetchProducts = async () => {
            const cacheKey = generateCacheKey({
                onlyActive,
                category,
                sort,
                dir,
            });

            // If a manual refresh was requested (refreshCount > 0), bypass cache
            if (refreshCount === 0) {
                const cached = await getCachedProducts(cacheKey);

                const cacheMissingDiscountFields =
                    cached &&
                    Array.isArray(cached.data) &&
                    cached.data.length > 0 &&
                    cached.data.some(
                        (p) =>
                            p &&
                            typeof p === "object" &&
                            !("originalPrice" in p) &&
                            !("delPrize" in p) &&
                            !("discountPercent" in p)
                    );

                if (
                    cached &&
                    Array.isArray(cached.data) &&
                    cached.data.length > 0 &&
                    !cacheMissingDiscountFields
                ) {
                    let rows = cached.data;

                    if (onlyActive) {
                        rows = rows.filter((r) => r.active !== false);
                    }

                    if (search) {
                        const s = search.toLowerCase();
                        rows = rows.filter(
                            (r) =>
                                `${r.title} ${r.description} ${r.sku || ""}`
                                    .toLowerCase()
                                    .includes(s)
                        );
                    }

                    if (isMounted) {
                        setProducts(rows.slice(0, pageSize));
                        setLoading(false);
                    }

                    const now = Date.now();
                    if (now - cached.timestamp > BACKGROUND_REFRESH_MIN_AGE_MS) {
                        fetchFromApi(cacheKey, false);
                    }
                    return;
                }
            }

            // No cache or manual refresh - fetch from PHP API
            await fetchFromApi(cacheKey, true);
        };

        const fetchFromApi = async (cacheKey, showLoading = true) => {
            try {
                if (showLoading && isMounted) {
                    setLoading(true);
                }

                const { data } = await phpApi.get(phpRoutes.products, {
                    params: {
                        onlyActive,
                        category,
                        search,
                        sort,
                        dir,
                        pageSize: pageSize * 2,
                    },
                });

                let rows = Array.isArray(data?.products) ? data.products : [];

                await setCachedProducts(cacheKey, rows);

                if (isMounted) {
                    setProducts(rows.slice(0, pageSize));
                    setLoading(false);

                    const imageUrls = rows
                        .slice(0, pageSize)
                        .flatMap((product) => {
                            const urls = [];
                            if (product.imageURL) urls.push(product.imageURL);
                            if (product.images && Array.isArray(product.images)) {
                                urls.push(...product.images.filter(Boolean));
                            }
                            return urls;
                        })
                        .filter((url, index, self) => self.indexOf(url) === index);

                    preloadImages(imageUrls).catch(console.error);
                }
            } catch (e) {
                console.error("Error fetching products from PHP API:", e);
                if (isMounted) {
                    setError(e);
                    setLoading(false);
                }
            }
        };

        fetchProducts();

        return () => {
            isMounted = false;
        };
    }, [onlyActive, pageSize, sort, dir, category, search, skipFetch, refreshCount]);

    return { products, setProducts, loading, error, refresh };
}

export async function createProduct(data) {
    const rawImages = Array.isArray(data.images) ? data.images.filter(Boolean) : [];
    const isDiscount = Boolean(
        data.isDiscountEnabled !== undefined
            ? data.isDiscountEnabled
            : data.is_discount_enabled
    );
    const payload = {
        title: data.title || "",
        price: Number(data.price) || 0,
        originalPrice: Number(data.originalPrice) || 0,
        discountPercent: Number(data.discountPercent) || 0,
        isDiscountEnabled: isDiscount,
        is_discount_enabled: isDiscount,
        discountTag: String(data.discountTag ?? data.discount_tag ?? ""),
        discountBadgeLabel: String(data.discountBadgeLabel ?? data.discount_badge_label ?? "SPECIAL OFFER"),
        discountPrice: Number(data.discountPrice ?? data.discount_price) || 0,
        discountStrikePrice: Number(data.discountStrikePrice ?? data.discount_strike_price) || 0,
        sku: data.sku || "",
        stock: Number(data.stock) || 0,
        category: data.category || "",
        description: data.description || "",
        imageURL: data.imageURL || rawImages[0] || "",
        images: rawImages,
        active: data.active ?? true,
        slug: data.slug || data.sku || "",
        subTitle: data.subTitle || "",
    };
    const { data: response } = await phpApi.post(phpRoutes.products, payload);
    
    // Clear cache when product is created
    clearAllCachedProducts().catch(console.error);
    clearAllCachedImages().catch(console.error);
    
    return response?.id;
}

export async function updateProduct(id, data) {
    const rawImages = Array.isArray(data.images) ? data.images.filter(Boolean) : [];
    const isDiscount = Boolean(
        data.isDiscountEnabled !== undefined
            ? data.isDiscountEnabled
            : data.is_discount_enabled
    );
    const payload = {
        ...data,
        price: Number(data.price) || 0,
        originalPrice: Number(data.originalPrice) || 0,
        discountPercent: Number(data.discountPercent) || 0,
        isDiscountEnabled: isDiscount,
        is_discount_enabled: isDiscount,
        discountTag: String(data.discountTag ?? data.discount_tag ?? ""),
        discountBadgeLabel: String(data.discountBadgeLabel ?? data.discount_badge_label ?? "SPECIAL OFFER"),
        discountPrice: Number(data.discountPrice ?? data.discount_price) || 0,
        discountStrikePrice: Number(data.discountStrikePrice ?? data.discount_strike_price) || 0,
        stock: Number(data.stock) || 0,
        images: rawImages,
        imageURL: data.imageURL || rawImages[0] || "",
        slug: data.slug || data.sku || "",
        subTitle: data.subTitle || "",
    };
    await phpApi.put(`${phpRoutes.products}/${id}`, payload);
    
    // Clear cache when product is updated
    clearAllCachedProducts().catch(console.error);
    clearAllCachedImages().catch(console.error);
}

export async function deleteProduct(id) {
    await phpApi.delete(`${phpRoutes.products}/${id}`);
    
    // Clear cache when product is deleted
    clearAllCachedProducts().catch(console.error);
    clearAllCachedImages().catch(console.error);
}
