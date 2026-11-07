import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Lock } from "lucide-react";
import useAuth from "../hooks/useAuth";
import useRequireCustomerLogin from "../hooks/useRequireCustomerLogin";
import { useProducts } from "../hooks/useProducts.js";
import useStorageUpload from "../hooks/useStorage.js";
import { useCheckout } from "../hooks/useCheckoutR.js";
import { phpApi, phpRoutes } from "../lib/phpApi";
import CheckoutAddressModal from "../components/dashboard/CheckoutAddressModal.jsx";
import {
    getSavedCheckoutAddress,
    saveCheckoutAddressToLocal,
    formToSelectedAddress,
    selectedAddressToForm,
} from "../utils/checkoutAddressStorage";
import {
    addressBookToInitialForm,
    buildAuthMeAddressPayload,
    parseAddressBookFromUser,
    upsertAddressFromForm,
} from "../utils/customerAddresses";
import {
    fetchCustomerCart,
    fetchCustomerFavorites,
    replaceCustomerCart,
    upsertCustomerCartItem,
    deleteCustomerCartLine,
    addCustomerFavorite,
    removeCustomerFavorite,
} from "../api/customerDataApi.js";
import MaskImage from "../tools/MaskImage.jsx";
import Toast from "../components/Toast";
import {
    getAnonymousUser,
    getAnonymousFavorites,
    getAnonymousCart,
    setAnonymousCart,
    updateAnonymousProfile,
} from "../utils/localStorageUser";
import {
    isFranchOilSku,
    findFranchOilCartItem,
    resolveFranchOilLine,
    normalizeFranchOilBottleQty,
    normalizeFranchOilCart,
} from "../utils/franchOilCart";
import { useLocalStorageCart } from "../hooks/useLocalStorageCart";
import { useLocalStorageFavorites } from "../hooks/useLocalStorageFavorites";
import { trackAddToCart, trackInitiateCheckout, initPixelWithUser } from "../utils/metaPixel.js";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import DashboardHero from "../components/dashboard/DashboardHero.jsx";
import CheckoutStepper from "../components/dashboard/CheckoutStepper.jsx";
import CheckoutTrustBar from "../components/dashboard/CheckoutTrustBar.jsx";
import OrderSummary from "../components/dashboard/OrderSummary.jsx";
import CartPanel from "../components/dashboard/CartPanel.jsx";
import ProductUpsell from "../components/dashboard/ProductUpsell.jsx";
import FavoritesPanel from "../components/dashboard/FavoritesPanel.jsx";
import "../css/dashboard.css";

export default function Dashboard() {
    const { user, logout, loading, isCustomerLoggedIn, refreshUser } = useAuth();
    const { requireCustomerLogin } = useRequireCustomerLogin();
    const navigate = useNavigate();
    const [userBlocked, setUserBlocked] = useState(null);
    const [search, setSearch] = useState("");
    const [toast, setToast] = useState(null);
    const [isClickedCheckout, setIsClickedCheckout] = useState(false);
    const [stopLoading, setStopLoading] = useState(true);
    const [isMobileView, setIsMobileView] = useState(
        () => typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches
    );
    const [showMobilePayBar, setShowMobilePayBar] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [savingAddress, setSavingAddress] = useState(false);
    const mobilePaymentRef = useRef(null);

    const showToast = (msg, type) => {
        setToast({ message: msg, type });
    };

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 1023px)");
        const onChange = () => setIsMobileView(mq.matches);
        onChange();
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);
    const { products, loading: prodLoading } = useProducts({
        onlyActive: false,
        search,
        pageSize: 200,
    });

    useEffect(() => {
        // console.log(products, prodLoading);
        stopLoading && setStopLoading(false);
    }, [products, prodLoading]);

    const productMap = useMemo(() => {
        const m = new Map();
        for (const p of products) m.set(p.id, p);
        return m;
    }, [products]);

    const [profile, setProfile] = useState({ name: "", email: "", phone: "", photoURL: "" });
    const [cart, setCart] = useState([]);
    const [favs, setFavs] = useState([]);

    // LocalStorage hooks for anonymous users
    const { cart: anonCart, addToCart: addToAnonCart, updateQty: updateAnonQty, removeItem: removeAnonItem } = useLocalStorageCart();
    const { favorites: anonFavs, toggleFavorite: toggleAnonFav } = useLocalStorageFavorites();
    const { upload, progress, error: uploadErr } = useStorageUpload(`avatars`);
    const [totalCost, setTotalCost] = useState(0);

    const enrichedCart = useMemo(() => {
        return cart.map(item => {
            let prod = productMap.get(item.productId) || products.find(p => p.sku === item.sku);

            const currentItem = { ...item };
            if (prod) {
                currentItem.productId = prod.id;
                currentItem.title = prod.title || item.title;
                currentItem.price = prod.price ?? item.price ?? 0;
                currentItem.imageURL = prod.imageURL || item.imageURL;
                currentItem.subTitle = prod.subTitle || item.subTitle;
                currentItem.description = prod.description || item.description;
            }
            return currentItem;
        });
    }, [cart, productMap, products]);

    const cartTotal = useMemo(
        () =>
            enrichedCart.reduce((sum, i) => {
                const price = i.price || 0;
                return sum + price * (i.qty || 1);
            }, 0),
        [enrichedCart]
    );

    useEffect(() => {
        const el = mobilePaymentRef.current;
        if (!isMobileView || enrichedCart.length === 0 || !el) {
            setShowMobilePayBar(false);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => setShowMobilePayBar(!entry.isIntersecting),
            { threshold: 0 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [isMobileView, enrichedCart.length]);

    useEffect(() => {
        if (!user) return;

        // Handle anonymous users (localStorage)
        if (user.isAnonymous) {
            const anonUser = getAnonymousUser();
            setUserBlocked(false); // Anonymous users can't be blocked
            setProfile((p) => ({
                ...p,
                name: anonUser.name || "",
                email: anonUser.email || "",
                phone: anonUser.phone || "",
                photoURL: anonUser.photoURL || "",
                address: anonUser.address || {},
            }));
            // Use localStorage cart and favorites
            setCart(anonCart);
            setFavs(getAnonymousFavorites());
            return;
        }

        if (!isCustomerLoggedIn) return;

        setUserBlocked(false);
        setProfile({
            name: user.name || user.displayName || "",
            email: user.email || "",
            phone: user.phone || "",
            photoURL: user.photoURL || "",
            address: user.address || {},
        });

        let cancelled = false;
        (async () => {
            try {
                const [cartItems, favItems] = await Promise.all([
                    fetchCustomerCart(),
                    fetchCustomerFavorites(),
                ]);
                if (!cancelled) {
                    setCart(
                        products?.length
                            ? normalizeFranchOilCart(products, cartItems)
                            : cartItems
                    );
                    setFavs(favItems);
                }
            } catch (error) {
                console.error("Error fetching cart/favorites from server:", error);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user, isCustomerLoggedIn]);

    // Sync anon cart/favs for anonymous users
    useEffect(() => {
        if (user?.isAnonymous) {
            const next = products?.length
                ? normalizeFranchOilCart(products, anonCart)
                : anonCart;
            setCart(next);
            setFavs(anonFavs.length ? anonFavs : getAnonymousFavorites());
        }
    }, [user?.isAnonymous, anonCart, anonFavs, products]);

    // Fix legacy franch-oil lines (pack @ qty 1 → single @ ₹220, etc.)
    useEffect(() => {
        if (!products?.length) return;
        setCart((prev) => {
            if (!prev?.length) return prev;
            const next = normalizeFranchOilCart(products, prev);
            const same =
                next.length === prev.length &&
                next.every(
                    (line, i) =>
                        line.sku === prev[i]?.sku &&
                        line.price === prev[i]?.price &&
                        line.productId === prev[i]?.productId &&
                        line.qty === prev[i]?.qty
                );
            if (same) return prev;
            if (user?.isAnonymous) {
                setAnonymousCart(next);
            } else if (isCustomerLoggedIn) {
                replaceCustomerCart(next).catch((err) =>
                    console.error("Could not sync franch oil cart:", err)
                );
            }
            return next;
        });
    }, [products]);

    useEffect(() => {
        setTotalCost(cartTotal);
    }, [cartTotal]);

    // Advanced Matching: update Meta Pixel with user profile data when available
    useEffect(() => {
        if (profile.email || profile.phone) {
            initPixelWithUser({
                email: profile.email,
                phone: profile.phone,
                name: profile.name,
            });
        }
    }, [profile.email, profile.phone]);

    const { doCheckout, loading: checkoutLoading } = useCheckout({
        amount: cartTotal,
        cart: enrichedCart,
        setIsClickedCheckout,
    });

    const checkoutAddressBook = useMemo(
        () => parseAddressBookFromUser(user),
        [user]
    );

    const checkoutModalInitial = useMemo(() => {
        const saved = getSavedCheckoutAddress();
        let profileSeed = profile;

        if (user?.isAnonymous) {
            const anonUser = getAnonymousUser();
            profileSeed = {
                name: anonUser?.name || profile.name,
                email: anonUser?.email || profile.email,
                phone: anonUser?.phone || profile.phone,
            };
            const anonBook = parseAddressBookFromUser(anonUser);
            if (anonBook.addresses.length > 0) {
                return addressBookToInitialForm(anonBook, profileSeed);
            }
            return selectedAddressToForm(anonUser?.address || saved || {}, profileSeed);
        }

        if (isCustomerLoggedIn && checkoutAddressBook.addresses.length > 0) {
            return addressBookToInitialForm(checkoutAddressBook, profileSeed);
        }

        const addressSeed =
            user?.address && typeof user.address === "object" ? user.address : {};
        return selectedAddressToForm(saved || addressSeed, profileSeed);
    }, [showAddressModal, profile, user, isCustomerLoggedIn, checkoutAddressBook]);

    const validateCartForCheckout = () => {
        const omega_prod = "RNd3gdknYlM4r6moZJbN";
        const omega_prod_cartItem = enrichedCart.find((item) => item.productId === omega_prod);
        if (omega_prod_cartItem && omega_prod_cartItem.qty < 4) {
            showToast(
                "Please add at least 4 quantities of the Franch Ayurveda clear Skin Soap product to proceed to checkout.",
                "error"
            );
            return false;
        }

        const orthovin_prod = "fcrb3N0Lt7YPjK7UTX39";
        const orthovin_prod_cartItem = enrichedCart.find((item) => item.productId === orthovin_prod);
        if (orthovin_prod_cartItem && orthovin_prod_cartItem.qty < 2) {
            showToast(
                "Please add at least 4 quantities of the Franch Ayurveda clear Skin Soap product to proceed to checkout.",
                "error"
            );
            return false;
        }

        if (enrichedCart.length === 0) {
            showToast("Your cart is empty.", "error");
            return false;
        }

        return true;
    };

    const persistCheckoutAddress = async (form, meta = {}) => {
        saveCheckoutAddressToLocal(form);
        const address = formToSelectedAddress(form);

        if (user?.isAnonymous) {
            const book = parseAddressBookFromUser(user);
            const merged = upsertAddressFromForm(book, form, {
                editingId: meta.editingId || form.addressId || null,
            });
            updateAnonymousProfile({
                name: form.name,
                phone: form.phone,
                email: form.email,
                address,
                addresses: merged.addresses,
                selectedAddressId: merged.selectedId,
            });
            return;
        }

        if (user?.uid && !user.isAnonymous) {
            try {
                const payload = buildAuthMeAddressPayload(form, user, meta);
                await phpApi.put(phpRoutes.authUpdateMe, payload);
                await refreshUser();
                setProfile((p) => ({
                    ...p,
                    name: form.name,
                    phone: form.phone,
                    email: form.email || p.email,
                    address,
                }));
            } catch (err) {
                console.error("API address save:", err);
                throw err;
            }
        }
    };

    const handleSaveAddressToAccount = async (form, meta) => {
        if (!isCustomerLoggedIn) {
            showToast("Please sign in to save addresses to your account.", "error");
            return;
        }
        setSavingAddress(true);
        try {
            await persistCheckoutAddress(form, meta);
            showToast("Address saved to your account. You can use it on any browser after login.", "success");
        } catch {
            showToast("Could not save address. Check your connection and try again.", "error");
        } finally {
            setSavingAddress(false);
        }
    };

    const handleDoCheckout = () => {
        if (!isCustomerLoggedIn) {
            showToast("Please sign in to checkout and track your orders on any device.", "error");
            navigate("/login", { state: { returnTo: "/dashboard" } });
            return;
        }
        if (!validateCartForCheckout()) return;
        setShowAddressModal(true);
    };

    const handleAddressConfirm = async (form, meta) => {
        setIsClickedCheckout(true);

        try {
            await persistCheckoutAddress(form, meta);

            const finalCart = enrichedCart;
            try {
                const cartSnapshot = finalCart.map((item) => ({
                    sku: item.sku,
                    price: Number(item.price) || 0,
                    qty: Number(item.qty) || 1,
                }));
                const totalSnapshot = cartSnapshot.reduce(
                    (sum, i) => sum + i.price * i.qty,
                    0
                );
                window.localStorage.setItem(
                    "meta_cart_snapshot",
                    JSON.stringify({ cart: cartSnapshot, total: totalSnapshot })
                );
            } catch (_) {
                /* non-critical */
            }

            trackInitiateCheckout(finalCart);

            const address = formToSelectedAddress(form);
            const checkoutOk = await doCheckout(
                {
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    address,
                },
                profile
            );

            if (!checkoutOk) {
                setIsClickedCheckout(false);
            } else {
                setShowAddressModal(false);
            }
        } catch (err) {
            setIsClickedCheckout(false);
            showToast("Error starting payment: " + err.message, "error");
        }
    };

    const onAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const { downloadURL } = await upload(file);
            setProfile((p) => ({ ...p, photoURL: downloadURL }));
        } catch (err) {
            showToast("Error uploading avatar: " + err.message, "error");
        }
    };

    const applyFranchOilCartLine = async (existingItem, line) => {
        if (!user || !line) return;

        if (user.isAnonymous) {
            const currentCart = getAnonymousCart().filter((c) => !isFranchOilSku(c.sku));
            const newItem = {
                id: existingItem?.id || `cart_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                ...line,
                createdAt: existingItem?.createdAt || new Date().toISOString(),
            };
            const updatedCart = [...currentCart, newItem];
            setAnonymousCart(updatedCart);
            setCart(updatedCart);
            return;
        }

        const franchItems = cart.filter((c) => isFranchOilSku(c.sku));
        const primary = existingItem || franchItems[0];
        const payload = {
            productId: line.productId,
            sku: line.sku,
            title: line.title,
            price: line.price,
            imageURL: line.imageURL,
            qty: line.qty,
        };
        const nextCart = cart
            .filter((c) => !isFranchOilSku(c.sku))
            .concat([{ ...(primary || {}), ...payload }]);
        const saved = await replaceCustomerCart(nextCart);
        setCart(saved);
    };

    const addToCart = async (product) => {
        if (!requireCustomerLogin("/dashboard")) return;

        if (isFranchOilSku(product.sku)) {
            const existingFranch = findFranchOilCartItem(cart);
            const bottleQty = existingFranch
                ? normalizeFranchOilBottleQty((existingFranch.qty || 1) + 1)
                : 1;
            const line = resolveFranchOilLine(products, bottleQty);
            if (!line) {
                showToast("Franch Oil product is unavailable right now.", "error");
                return;
            }
            await applyFranchOilCartLine(existingFranch, line);
            trackAddToCart(line.sku, line.price, line.qty);
            return;
        }

        let finalQty = 1;
        if (product.sku === "franch-ayurveda-skin-soap") finalQty = 4;
        if (product.sku === "franch-orthovin-thailam") finalQty = 2;

        if (user.isAnonymous) {
            addToAnonCart({
                productId: product.id,
                sku: product.sku,
                title: product.title,
                price: Number(product.price) || 0,
                imageURL: product.imageURL || "",
                qty: finalQty,
            });
            trackAddToCart(product.sku, product.price, finalQty);
            return;
        }

        const existing = cart.find((c) => c.productId === product.id);
        const line = {
            productId: product.id,
            sku: product.sku,
            title: product.title,
            price: Number(product.price) || 0,
            imageURL: product.imageURL || "",
            qty: existing ? (existing.qty || finalQty) + 1 : finalQty,
        };
        try {
            const saved = await upsertCustomerCartItem(line);
            setCart(saved);
            trackAddToCart(product.sku, product.price, line.qty);
        } catch (err) {
            showToast("Error adding to cart: " + err.message, "error");
        }
    };

    const minQty = {
        "franch-ayurveda-skin-soap": 4,
        "franch-orthovin-thailam": 2,
        "omega-3": 1,
    };

    const updateQty = async (item, qty) => {
        if (!user) return;

        if (isFranchOilSku(item.sku)) {
            const bottleQty = normalizeFranchOilBottleQty(qty);
            const line = resolveFranchOilLine(products, bottleQty);
            if (!line) {
                showToast("Franch Oil product is unavailable right now.", "error");
                return;
            }
            await applyFranchOilCartLine(item, line);
            return;
        }

        const finalQty = Math.max(minQty[item.sku] || 1, qty);

        if (user.isAnonymous) {
            updateAnonQty(item.id, finalQty);
            return;
        }

        setCart((prev) => prev.map((c) => c.id === item.id ? { ...c, qty: finalQty } : c));
        try {
            const saved = await upsertCustomerCartItem({
                productId: item.productId,
                sku: item.sku,
                title: item.title,
                price: item.price,
                imageURL: item.imageURL,
                qty: finalQty,
            });
            setCart(saved);
        } catch (err) {
            setCart((prev) => prev.map((c) => c.id === item.id ? { ...c, qty: item.qty } : c));
            showToast("Error updating quantity: " + err.message, "error");
        }
    };

    const removeCartItem = async (id) => {
        if (!user) return;

        if (user.isAnonymous) {
            removeAnonItem(id);
            return;
        }
        const removed = cart.find((c) => c.id === id);
        setCart((prev) => prev.filter((c) => c.id !== id));
        try {
            const saved = await deleteCustomerCartLine({
                productId: removed?.productId,
                lineId: id,
            });
            setCart(saved);
        } catch (err) {
            if (removed) setCart((prev) => [...prev, removed]);
            showToast("Error removing item: " + err.message, "error");
        }
    };

    const resolveProductId = (product) => product?.id ?? product?.productId;

    const reloadFavoritesFromStore = async () => {
        if (!isCustomerLoggedIn) return;
        try {
            const items = await fetchCustomerFavorites();
            setFavs(items);
        } catch (err) {
            console.error("Error reloading favorites:", err);
        }
    };

    const toggleFav = async (product) => {
        if (!requireCustomerLogin("/dashboard")) return;

        const productId = resolveProductId(product);
        if (!productId) {
            showToast("Could not save this favorite.", "error");
            return;
        }

        const payload = {
            productId,
            title: product.title || "",
            price: Number(product.price) || 0,
            imageURL: product.imageURL || "",
        };

        if (user.isAnonymous) {
            toggleAnonFav(payload);
            setFavs(getAnonymousFavorites());
            return;
        }

        const existing = favs.find((f) => f.productId === productId);
        try {
            if (existing) {
                setFavs((prev) => prev.filter((f) => f.id !== existing.id));
                const items = await removeCustomerFavorite({
                    productId,
                    lineId: existing.id,
                });
                setFavs(items);
            } else {
                setFavs((prev) => [
                    { id: `temp_fav_${Date.now()}`, ...payload, createdAt: new Date().toISOString() },
                    ...prev,
                ]);
                const items = await addCustomerFavorite(payload);
                setFavs(items);
            }
        } catch (err) {
            await reloadFavoritesFromStore();
            showToast("Error toggling favorite: " + err.message, "error");
        }
    };

    // if (!user || userBlocked == null) return null;
    // if (stopLoading) return <span className='web_loading'></span>;

    return (
        <>
            <DashboardHeader />
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <CheckoutAddressModal
                isOpen={showAddressModal}
                onClose={() => {
                    if (!checkoutLoading && !isClickedCheckout) {
                        setShowAddressModal(false);
                    }
                }}
                initialForm={checkoutModalInitial}
                savedAddresses={checkoutAddressBook.addresses}
                initialSelectedId={checkoutAddressBook.selectedId}
                accountSync={isCustomerLoggedIn}
                onSaveToAccount={handleSaveAddressToAccount}
                totalCost={totalCost}
                loading={checkoutLoading || isClickedCheckout || savingAddress}
                onConfirm={handleAddressConfirm}
            />

            {userBlocked ? (
                <div className="w-screen min-h-screen bg-slate-50 flex flex-col gap-5 text-2xl justify-center items-center poppins">
                    <MaskImage size="5rem" bg="black" hBg="red" url="https://api.iconify.design/tdesign:user-blocked.svg" />
                    You are Blocked
                </div>
            ) : (
                <div className="dashboard-page poppins">
                    <DashboardHero
                        itemCount={enrichedCart.length}
                        totalCost={totalCost}
                    />
                    <CheckoutStepper />

                    <main
                        className={`dashboard-main max-w-7xl mx-auto px-3 sm:px-6 lg:pb-12 ${
                            isMobileView && enrichedCart.length > 0 ? "pb-32" : "pb-12"
                        }`}
                    >
                        {!isCustomerLoggedIn && (
                            <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-950">
                                Please{" "}
                                <Link to="/login" state={{ returnTo: "/dashboard" }} className="font-semibold text-[var(--p-c)] underline">
                                    sign in with email or Google
                                </Link>{" "}
                                to pay and track your orders on any phone or computer.
                            </div>
                        )}
                        <div className="dashboard-checkout-panel dashboard-checkout-layout">
                            <div className="dashboard-checkout-left">
                                <CartPanel
                                    enrichedCart={enrichedCart}
                                    isMobile={isMobileView}
                                    onUpdateQty={updateQty}
                                    onRemove={removeCartItem}
                                />

                                <div ref={mobilePaymentRef} className="dashboard-mobile-payment lg:hidden">
                                    <OrderSummary
                                        enrichedCart={enrichedCart}
                                        totalCost={totalCost}
                                        isMobile
                                        isClickedCheckout={isClickedCheckout}
                                        checkoutLoading={checkoutLoading}
                                        onCheckout={handleDoCheckout}
                                        onUpdateQty={updateQty}
                                        onRemove={removeCartItem}
                                        paymentOnly
                                    />
                                </div>

                                <FavoritesPanel
                                    favs={favs}
                                    productMap={productMap}
                                    onToggleFav={toggleFav}
                                />
                                <ProductUpsell
                                    products={products}
                                    prodLoading={prodLoading}
                                    search={search}
                                    onSearchChange={setSearch}
                                    favs={favs}
                                    onAddToCart={addToCart}
                                    onToggleFav={toggleFav}
                                />
                            </div>

                            <div className="dashboard-checkout-right hidden lg:block">
                                <OrderSummary
                                    enrichedCart={enrichedCart}
                                    totalCost={totalCost}
                                    isMobile={false}
                                    isClickedCheckout={isClickedCheckout}
                                    checkoutLoading={checkoutLoading}
                                    onCheckout={handleDoCheckout}
                                    onUpdateQty={updateQty}
                                    onRemove={removeCartItem}
                                    paymentOnly
                                />
                            </div>
                        </div>

                        <CheckoutTrustBar />
                    </main>

                    {isMobileView && enrichedCart.length > 0 && (
                        <div
                            className={`dashboard-mobile-bar poppins${showMobilePayBar ? " dashboard-mobile-bar--visible" : ""}`}
                            role="region"
                            aria-label="Quick checkout"
                            aria-hidden={!showMobilePayBar}
                        >
                            <div className="max-w-lg mx-auto flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-[var(--p-c)] uppercase">Total</p>
                                    <p className="text-2xl font-bold text-[var(--p-c)] tabular-nums">₹{totalCost}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleDoCheckout}
                                    disabled={checkoutLoading || isClickedCheckout}
                                    className="dashboard-btn-pay flex-1 max-w-[240px] flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                                >
                                    <Lock className="w-4 h-4" />
                                    Pay Now
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}