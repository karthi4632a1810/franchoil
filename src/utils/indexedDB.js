// IndexedDB utility for caching Firestore data
const DB_NAME = "FranchGlobalCache";
const DB_VERSION = 2; // Bumped to fix missing object stores in old browser caches
const CACHE_KEY_VERSION = "v4-special-discount-offer";


// Cache expiration: 7 days in milliseconds (when to completely delete)
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
// Background Refresh interval: 2 hours (when to fetch fresh data if cached data exists)
export const BACKGROUND_REFRESH_MIN_AGE_MS = 2 * 60 * 60 * 1000;

// Object store names
const STORE_PRODUCTS = "products";
const STORE_BLOGS = "blogs";
const STORES = [STORE_PRODUCTS, STORE_BLOGS];

/**
 * Open IndexedDB database
 */
function deleteDatabase(dbName) {
    return new Promise((resolve) => {
        const req = indexedDB.deleteDatabase(dbName);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
    });
}

function openDB(retried = false) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = async () => {
            const db = request.result;
            // Some old browser states can keep DB open but miss stores.
            // Auto-reset once to recover from "object store not found" runtime errors.
            const missingStores = STORES.some((s) => !db.objectStoreNames.contains(s)) ||
                !db.objectStoreNames.contains("images");

            if (missingStores && !retried) {
                db.close();
                await deleteDatabase(DB_NAME);
                try {
                    const reopened = await openDB(true);
                    resolve(reopened);
                } catch (err) {
                    reject(err);
                }
                return;
            }

            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // Create all shared stores — must be in sync with imageCache.js
            STORES.forEach((store) => {
                if (!db.objectStoreNames.contains(store)) {
                    db.createObjectStore(store, { keyPath: "key" });
                }
            });
            // Also create the images store (managed by imageCache.js)
            if (!db.objectStoreNames.contains("images")) {
                const imageStore = db.createObjectStore("images", { keyPath: "url" });
                imageStore.createIndex("timestamp", "timestamp", { unique: false });
            }
        };
    });
}

/**
 * Get cached data from IndexedDB
 * @param {string} storeName - Store name ('products' or 'blogs')
 * @param {string} cacheKey - Unique key for the cache (based on query params)
 * @returns {Promise<{data: Array, timestamp: number} | null>}
 */
export async function getCachedData(storeName, cacheKey) {
    try {
        const db = await openDB();
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.get(cacheKey);

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
                    deleteCachedData(storeName, cacheKey).catch(console.error);
                    resolve(null);
                } else {
                    // Cache is valid
                    resolve({
                        data: result.data,
                        timestamp: result.timestamp,
                    });
                }
            };

            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Error reading from IndexedDB:", error);
        return null;
    }
}

/**
 * Save data to IndexedDB cache
 * @param {string} storeName - Store name ('products' or 'blogs')
 * @param {string} cacheKey - Unique key for the cache
 * @param {Array} data - Data to cache
 */
export async function setCachedData(storeName, cacheKey, data) {
    try {
        const db = await openDB();
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);

        const cacheData = {
            key: cacheKey,
            data: data,
            timestamp: Date.now(),
        };

        await new Promise((resolve, reject) => {
            const request = store.put(cacheData);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        // console.log(`Data cached in IndexedDB with key: ${cacheKey}`);
    } catch (error) {
        console.error("Error writing to IndexedDB:", error);
        // Don't throw - caching failure shouldn't break the app
    }
}

/**
 * Delete cached data
 * @param {string} storeName - Store name
 * @param {string} cacheKey - Key to delete
 */
export async function deleteCachedData(storeName, cacheKey) {
    try {
        const db = await openDB();
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        await new Promise((resolve, reject) => {
            const request = store.delete(cacheKey);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Error deleting from IndexedDB:", error);
    }
}

/**
 * Clear all cached content for a given store (useful for debugging or forced refresh)
 */
export async function clearAllCachedStore(storeName) {
    try {
        const db = await openDB();
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        await new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
        // console.log(`All cached ${storeName} cleared`);
    } catch (error) {
        console.error("Error clearing IndexedDB:", error);
    }
}

/**
 * Legacy wrappers for Products explicitly
 */
export const getCachedProducts = (key) => getCachedData('products', key);
export const setCachedProducts = (key, data) => setCachedData('products', key, data);
export const clearAllCachedProducts = () => clearAllCachedStore('products');

/**
 * Wrappers for Blogs explicitly
 */
export const getCachedBlogs = (key) => getCachedData('blogs', key);
export const setCachedBlogs = (key, data) => setCachedData('blogs', key, data);
export const clearAllCachedBlogs = () => clearAllCachedStore('blogs');

/**
 * Generate a cache key based on query parameters
 * @param {Object} params - Query parameters
 * @param {string} prefix - Prefix (e.g. products, blogs)
 * @returns {string}
 */
export function generateCacheKey(params = {}, prefix = "products") {
    const {
        onlyActive = true,
        category = null,
        sort = "createdAt",
        dir = "desc",
    } = params;

    // Create a unique key based on query parameters
    const keyParts = [
        CACHE_KEY_VERSION,
        prefix,
        `active_${onlyActive}`,
        category ? `cat_${category}` : "all",
        `sort_${sort}_${dir}`,
    ];

    return keyParts.join("_");
}

