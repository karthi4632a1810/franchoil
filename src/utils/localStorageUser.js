// Utility for managing anonymous user data in localStorage
const ANONYMOUS_USER_KEY = 'franch_anonymous_user';
const ANONYMOUS_CART_KEY = 'franch_anonymous_cart';
const ANONYMOUS_FAVORITES_KEY = 'franch_anonymous_favorites';

// Generate a unique ID for the device
function getDeviceId() {
    let deviceId = localStorage.getItem('franch_device_id');
    if (!deviceId) {
        deviceId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('franch_device_id', deviceId);
    }
    return deviceId;
}

// Get anonymous user data from localStorage
export function getAnonymousUser() {
    try {
        const stored = localStorage.getItem(ANONYMOUS_USER_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        // Create new anonymous user
        const newUser = {
            uid: getDeviceId(),
            email: null,
            displayName: null,
            photoURL: null,
            isAnonymous: true,
            name: '',
            phone: '',
            address: {
                line1: '',
                line2: '',
                street: '',
                landmark: '',
                city: '',
                state: '',
                pincode: '',
                country: 'India',
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setAnonymousUser(newUser);
        return newUser;
    } catch (error) {
        console.error('Error getting anonymous user:', error);
        return null;
    }
}

// Save anonymous user data to localStorage
export function setAnonymousUser(userData) {
    try {
        const userToSave = {
            ...userData,
            updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(ANONYMOUS_USER_KEY, JSON.stringify(userToSave));
        return userToSave;
    } catch (error) {
        console.error('Error saving anonymous user:', error);
        return null;
    }
}

// Update anonymous user profile
export function updateAnonymousProfile(updates) {
    const user = getAnonymousUser();
    if (!user) return null;
    const updated = {
        ...user,
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    return setAnonymousUser(updated);
}

// Get cart from localStorage
export function getAnonymousCart() {
    try {
        const stored = localStorage.getItem(ANONYMOUS_CART_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error getting anonymous cart:', error);
        return [];
    }
}

// Save cart to localStorage
export function setAnonymousCart(cart) {
    try {
        localStorage.setItem(ANONYMOUS_CART_KEY, JSON.stringify(cart));
        return cart;
    } catch (error) {
        console.error('Error saving anonymous cart:', error);
        return [];
    }
}

// Add item to cart
export function addToAnonymousCart(item) {
    const cart = getAnonymousCart();
    const existing = cart.find(c => c.productId === item.productId);
    if (existing) {
        existing.qty = (existing.qty || 1) + (item.qty || 1);
        setAnonymousCart(cart);
    } else {
        const newItem = {
            ...item,
            id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
        };
        setAnonymousCart([...cart, newItem]);
    }
}

// Update cart item quantity
export function updateAnonymousCartItem(itemId, qty) {
    const cart = getAnonymousCart();
    const item = cart.find(c => c.id === itemId);
    if (item) {
        item.qty = qty;
        setAnonymousCart(cart);
    }
}

// Remove item from cart
export function removeFromAnonymousCart(itemId) {
    const cart = getAnonymousCart();
    setAnonymousCart(cart.filter(c => c.id !== itemId));
}

// Get favorites from localStorage
export function getAnonymousFavorites() {
    try {
        const stored = localStorage.getItem(ANONYMOUS_FAVORITES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error getting anonymous favorites:', error);
        return [];
    }
}

// Save favorites to localStorage
export function setAnonymousFavorites(favorites) {
    try {
        localStorage.setItem(ANONYMOUS_FAVORITES_KEY, JSON.stringify(favorites));
        return favorites;
    } catch (error) {
        console.error('Error saving anonymous favorites:', error);
        return [];
    }
}

// Toggle favorite
export function toggleAnonymousFavorite(item) {
    const favorites = getAnonymousFavorites();
    const existing = favorites.find(f => f.productId === item.productId);
    if (existing) {
        setAnonymousFavorites(favorites.filter(f => f.id !== existing.id));
        return false; // Removed
    } else {
        const newFavorite = {
            ...item,
            id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
        };
        setAnonymousFavorites([...favorites, newFavorite]);
        return true; // Added
    }
}

// Clear all anonymous data (useful when user logs in)
export function clearAnonymousData() {
    localStorage.removeItem(ANONYMOUS_USER_KEY);
    localStorage.removeItem(ANONYMOUS_CART_KEY);
    localStorage.removeItem(ANONYMOUS_FAVORITES_KEY);
    localStorage.removeItem('franch_device_id');
}
