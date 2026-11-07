import { useState, useEffect } from "react";
import { getImageUrl } from "../utils/imageCache";

/**
 * CachedImage component - Loads images from IndexedDB cache first, then fetches if needed
 * @param {string} src - Image URL
 * @param {string} alt - Alt text
 * @param {string} className - CSS classes
 * @param {Object} style - Inline styles
 * @param {string} fallback - Fallback image URL if loading fails
 * @param {Object} props - Other img props
 */
export default function CachedImage({
    src,
    alt = "",
    className = "",
    style = {},
    fallback = null,
    ...props
}) {
    const [imageSrc, setImageSrc] = useState(src);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!src) {
            setLoading(false);
            return;
        }

        let isMounted = true;

        const loadImage = async () => {
            try {
                setLoading(true);
                setError(false);

                // Get image from cache or fetch and cache
                const cachedUrl = await getImageUrl(src);

                if (isMounted) {
                    setImageSrc(cachedUrl);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error loading cached image:", err);
                if (isMounted) {
                    setError(true);
                    setLoading(false);
                    // Use fallback or original src
                    if (fallback) {
                        setImageSrc(fallback);
                    } else {
                        setImageSrc(src); // Fallback to original URL
                    }
                }
            }
        };

        loadImage();

        return () => {
            isMounted = false;
        };
    }, [src, fallback]);

    if (!src) {
        return null;
    }

    return (
        <img
            src={imageSrc}
            alt={alt}
            className={className}
            style={{
                ...style,
                opacity: loading ? 0.5 : 1,
                transition: "opacity 0.3s ease-in-out",
            }}
            onError={() => {
                if (!error && fallback) {
                    setImageSrc(fallback);
                    setError(true);
                }
            }}
            {...props}
        />
    );
}

