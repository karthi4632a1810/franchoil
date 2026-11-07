import { useEffect, useState, useRef } from "react";
import { useCachedImage } from "../hooks/useCachedImage";

/**
 * Component that applies cached images as CSS background
 * @param {string} imageUrl - Main image URL
 * @param {string} hoverImageUrl - Optional hover image URL
 * @param {string} className - CSS classes
 * @param {Object} style - Additional inline styles
 * @param {React.ReactNode} children - Child elements
 */
export default function CachedImageBackground({
    imageUrl,
    hoverImageUrl = null,
    className = "",
    style = {},
    children,
    ...props
}) {
    const { src: cachedMainImage, loading: mainLoading } = useCachedImage(imageUrl);
    const { src: cachedHoverImage, loading: hoverLoading } = useCachedImage(hoverImageUrl);
    
    // Store the last style object to avoid infinite loops
    const styleRef = useRef(style);
    // Use state to track style key so we can include it in effect dependencies
    const [styleKey, setStyleKey] = useState(() => JSON.stringify(style));

    const [backgroundStyle, setBackgroundStyle] = useState(() => ({
        ...style,
        "--front-image": imageUrl ? `url(${imageUrl})` : undefined,
        "--hover-image": hoverImageUrl ? `url(${hoverImageUrl})` : undefined,
    }));

    // Update styleKey only when style content actually changes
    useEffect(() => {
        const currentStyleKey = JSON.stringify(style);
        if (styleKey !== currentStyleKey) {
            setStyleKey(currentStyleKey);
            styleRef.current = style;
        }
    }, [style, styleKey]);

    useEffect(() => {
        const newStyle = {
            ...styleRef.current,
            opacity: mainLoading ? 0.5 : 1,
            transition: "opacity 0.3s ease-in-out",
        };

        if (cachedMainImage) {
            newStyle["--front-image"] = `url(${cachedMainImage})`;
        }

        if (cachedHoverImage) {
            newStyle["--hover-image"] = `url(${cachedHoverImage})`;
        }

        setBackgroundStyle(newStyle);
    }, [cachedMainImage, cachedHoverImage, mainLoading, styleKey]);

    return (
        <div className={className} style={backgroundStyle} {...props}>
            {children}
        </div>
    );
}
