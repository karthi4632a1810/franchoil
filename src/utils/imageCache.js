// Image caching utility for IndexedDB
const DB_NAME = "FranchGlobalCache";
const DB_VERSION = 2; // Must match indexedDB.js - both share the same DB
const IMAGE_STORE_NAME = "images";

// Cache expiration: 7 days in milliseconds
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Open IndexedDB database for images
 */
function openImageDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // Create all shared stores — must be in sync with indexedDB.js
            if (!db.objectStoreNames.contains("products")) {
                db.createObjectStore("products", { keyPath: "key" });
            }
            if (!db.objectStoreNames.contains("blogs")) {
                db.createObjectStore("blogs", { keyPath: "key" });
            }
            if (!db.objectStoreNames.contains(IMAGE_STORE_NAME)) {
                const store = db.createObjectStore(IMAGE_STORE_NAME, { keyPath: "url" });
                store.createIndex("timestamp", "timestamp", { unique: false });
            }
        };
    });
}

/**
 * Get cached image from IndexedDB
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<string | null>} - Data URL of the image or null if not cached/expired
 */
export async function getCachedImage(imageUrl) {
    if (!imageUrl) return null;

    try {
        const db = await openImageDB();
        const transaction = db.transaction([IMAGE_STORE_NAME], "readonly");
        const store = transaction.objectStore(IMAGE_STORE_NAME);
        const request = store.get(imageUrl);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const result = request.result;
                if (!result) {
                    resolve(null);
                    return;
                }

                // Check if cache is expired (older than 7 days)
                const now = Date.now();
                const cacheAge = now - result.timestamp;

                if (cacheAge > CACHE_EXPIRY_MS) {
                    // Cache expired, delete it
                    deleteCachedImage(imageUrl).catch(console.error);
                    resolve(null);
                } else {
                    // Cache is valid, return data URL
                    resolve(result.dataUrl);
                }
            };

            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Error reading image from IndexedDB:", error);
        return null;
    }
}

/**
 * Cache an image in IndexedDB
 * @param {string} imageUrl - URL of the image
 * @param {string} dataUrl - Data URL of the image (blob converted to data URL)
 */
export async function setCachedImage(imageUrl, dataUrl) {
    if (!imageUrl || !dataUrl) return;

    try {
        const db = await openImageDB();
        const transaction = db.transaction([IMAGE_STORE_NAME], "readwrite");
        const store = transaction.objectStore(IMAGE_STORE_NAME);

        const cacheData = {
            url: imageUrl,
            dataUrl: dataUrl,
            timestamp: Date.now(),
        };

        await new Promise((resolve, reject) => {
            const request = store.put(cacheData);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        // console.log(`Image cached: ${imageUrl.substring(0, 50)}...`);
    } catch (error) {
        console.error("Error writing image to IndexedDB:", error);
        // Don't throw - caching failure shouldn't break the app
    }
}

/**
 * Delete a cached image
 * @param {string} imageUrl - URL to delete
 */
export async function deleteCachedImage(imageUrl) {
    if (!imageUrl) return;

    try {
        const db = await openImageDB();
        const transaction = db.transaction([IMAGE_STORE_NAME], "readwrite");
        const store = transaction.objectStore(IMAGE_STORE_NAME);
        await new Promise((resolve, reject) => {
            const request = store.delete(imageUrl);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Error deleting image from IndexedDB:", error);
    }
}

/**
 * Fetch image and convert to data URL
 * @param {string} imageUrl - URL of the image to fetch
 * @returns {Promise<string>} - Data URL of the image
 */
async function fetchImageAsDataUrl(imageUrl) {
    try {
        const response = await fetch(imageUrl, { cache: "force-cache" });
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error fetching image:", error);
        throw error;
    }
}

/**
 * Get image URL (from cache or fetch and cache)
 * @param {string} imageUrl - Original image URL
 * @returns {Promise<string>} - Data URL (cached or fetched)
 */
export async function getImageUrl(imageUrl) {
    if (!imageUrl) return imageUrl;
    // Use direct image path from DB/MySQL without converting to base64 data URLs.
    return imageUrl;
}

/**
 * Preload and cache multiple images
 * @param {string[]} imageUrls - Array of image URLs to preload
 */
export async function preloadImages(imageUrls) {
    // Intentionally no-op: keep original image paths in img src.
    void imageUrls;
}

/**
 * Clear all cached images
 */
export async function clearAllCachedImages() {
    try {
        const db = await openImageDB();
        const transaction = db.transaction([IMAGE_STORE_NAME], "readwrite");
        const store = transaction.objectStore(IMAGE_STORE_NAME);
        await new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
        // console.log("All cached images cleared");
    } catch (error) {
        console.error("Error clearing image cache:", error);
    }
}

/**
 * Clean up expired images (older than 7 days)
 */
export async function cleanupExpiredImages() {
    try {
        const db = await openImageDB();
        const transaction = db.transaction([IMAGE_STORE_NAME], "readwrite");
        const store = transaction.objectStore(IMAGE_STORE_NAME);
        const index = store.index("timestamp");
        const now = Date.now();
        const cutoffTime = now - CACHE_EXPIRY_MS;

        const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime));

        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };

            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Error cleaning up expired images:", error);
    }
}

