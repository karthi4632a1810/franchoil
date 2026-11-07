import { useState, useEffect, useCallback } from "react";
import {
    getAnonymousCart,
    setAnonymousCart,
    addToAnonymousCart,
    updateAnonymousCartItem,
    removeFromAnonymousCart,
} from "../utils/localStorageUser";

// Hook to manage cart for anonymous users
export function useLocalStorageCart() {
    const [cart, setCart] = useState([]);

    // Load cart from localStorage on mount
    useEffect(() => {
        const loadedCart = getAnonymousCart();
        setCart(loadedCart);
    }, []);

    // Sync state with localStorage whenever cart changes
    const syncCart = useCallback((newCart) => {
        setCart(newCart);
        setAnonymousCart(newCart);
    }, []);

    const addToCart = useCallback((item) => {
        const currentCart = getAnonymousCart();
        const existing = currentCart.find(c => c.productId === item.productId);
        let updatedCart;

        if (existing) {
            existing.qty = (existing.qty || 1) + (item.qty || 1);
            updatedCart = [...currentCart];
        } else {
            const newItem = {
                ...item,
                id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date().toISOString(),
            };
            updatedCart = [...currentCart, newItem];
        }

        syncCart(updatedCart);
    }, [syncCart]);

    const updateQty = useCallback((itemId, qty) => {
        const currentCart = getAnonymousCart();
        const item = currentCart.find(c => c.id === itemId);
        if (item) {
            item.qty = qty;
            syncCart([...currentCart]);
        }
    }, [syncCart]);

    const removeItem = useCallback((itemId) => {
        const currentCart = getAnonymousCart();
        syncCart(currentCart.filter(c => c.id !== itemId));
    }, [syncCart]);

    return { cart, addToCart, updateQty, removeItem, syncCart };
}
