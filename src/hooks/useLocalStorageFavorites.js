import { useState, useEffect, useCallback } from "react";
import {
    getAnonymousFavorites,
    setAnonymousFavorites,
    toggleAnonymousFavorite,
} from "../utils/localStorageUser";

// Hook to manage favorites for anonymous users
export function useLocalStorageFavorites() {
    const [favorites, setFavorites] = useState([]);

    // Load favorites from localStorage on mount
    useEffect(() => {
        const loadedFavorites = getAnonymousFavorites();
        setFavorites(loadedFavorites);
    }, []);

    // Sync state with localStorage
    const syncFavorites = useCallback((newFavorites) => {
        setFavorites(newFavorites);
        setAnonymousFavorites(newFavorites);
    }, []);

    const toggleFavorite = useCallback((item) => {
        const currentFavorites = getAnonymousFavorites();
        const existing = currentFavorites.find(f => f.productId === item.productId);
        let updatedFavorites;
        
        if (existing) {
            updatedFavorites = currentFavorites.filter(f => f.id !== existing.id);
        } else {
            const newFavorite = {
                ...item,
                id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date().toISOString(),
            };
            updatedFavorites = [...currentFavorites, newFavorite];
        }
        
        syncFavorites(updatedFavorites);
        return !existing; // Return true if added, false if removed
    }, [syncFavorites]);

    return { favorites, toggleFavorite, syncFavorites };
}
