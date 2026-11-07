import { useState, useEffect } from "react";
import { getImageUrl } from "../utils/imageCache";

/**
 * Hook to get cached image URL
 * @param {string} imageUrl - Original image URL
 * @param {string} fallback - Fallback URL if loading fails
 * @returns {Object} - { src, loading, error }
 */
export function useCachedImage(imageUrl, fallback = null) {
    const [src, setSrc] = useState(imageUrl);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!imageUrl) {
            setLoading(false);
            setSrc(fallback || imageUrl);
            return;
        }

        let isMounted = true;

        const loadImage = async () => {
            try {
                setLoading(true);
                setError(false);

                // Get image from cache or fetch and cache
                const cachedUrl = await getImageUrl(imageUrl);

                if (isMounted) {
                    setSrc(cachedUrl);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error loading cached image:", err);
                if (isMounted) {
                    setError(true);
                    setLoading(false);
                    // Use fallback or original src
                    setSrc(fallback || imageUrl);
                }
            }
        };

        loadImage();

        return () => {
            isMounted = false;
        };
    }, [imageUrl, fallback]);

    return { src, loading, error };
}

