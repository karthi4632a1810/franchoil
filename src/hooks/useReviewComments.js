import { useState, useEffect, useCallback } from "react";
import { phpApi, phpRoutes } from "../lib/phpApi";

export function useReviewComments(productId) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadReviews = useCallback(async () => {
        if (!productId) {
            setReviews([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data } = await phpApi.get(phpRoutes.reviews, {
                params: { productId },
            });
            if (data?.success && Array.isArray(data.reviews)) {
                setReviews(data.reviews);
            } else {
                setReviews([]);
            }
        } catch (e) {
            setError(e?.response?.data?.error || e?.message || "Failed to load reviews");
            setReviews([]);
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    /**
     * @returns {Promise<{ ok: boolean, error?: string }>}
     */
    const submitReview = async ({ rating, message, authorName }) => {
        if (!rating || rating < 1 || rating > 5) {
            const msg = "Please select a valid rating (1-5).";
            setError(msg);
            return { ok: false, error: msg };
        }
        if (!productId) {
            const msg = "Missing product.";
            setError(msg);
            return { ok: false, error: msg };
        }

        try {
            setError(null);
            const { data } = await phpApi.post(phpRoutes.reviews, {
                productId,
                rating: Number(rating),
                message: message || "",
                authorName: authorName || "",
            });
            if (data?.success) {
                await loadReviews();
                return { ok: true };
            }
            const msg = data?.error || "Failed to submit review.";
            setError(msg);
            return { ok: false, error: msg };
        } catch (e) {
            const msg =
                e?.response?.data?.error ||
                e?.response?.data?.message ||
                e?.message ||
                "Failed to submit review.";
            setError(msg);
            return { ok: false, error: msg };
        }
    };

    return { reviews, loading, error, submitReview };
}
