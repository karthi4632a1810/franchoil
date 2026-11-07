import React, { useEffect, useMemo, useState, useRef } from "react";
import "../css/productPage.css"
import "../css/productBuyBox.css"
import fnhpackoftwo from "/images/product/landing/fnh-pack-of-2.png"
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Maximize2, X as CloseIcon, Sparkles, ShieldCheck } from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import useAuth from "../hooks/useAuth";
import useRequireCustomerLogin from "../hooks/useRequireCustomerLogin";
import {
    collection,
    doc,
    onSnapshot,
    query,
    orderBy,
    addDoc,
    deleteDoc,
    updateDoc,
    setDoc,
    serverTimestamp,
} from "firebase/firestore";
import { firestore as db } from "../firebase/config";
import MaskImage from '../tools/MaskImage.jsx';
import ReviewSection from "./ReviewSection.jsx";
import ProductPageComponent from "./ProductPageComponent.jsx";
import ProductSection from "./ProductSection.jsx";
import ProductBuyBox from "../components/product/ProductBuyBox.jsx";
import ProductPackOffer from "../components/product/ProductPackOffer.jsx";
import ProductPageBanners from "../components/product/ProductPageBanners.jsx";
import ProductBuyNowButton from "../components/product/ProductBuyNowButton.jsx";
import ProductGiftBanner from "../components/product/ProductGiftBanner.jsx";
import CheckoutAddressModal from "../components/dashboard/CheckoutAddressModal.jsx";
import Toast from "../components/Toast.jsx";
import { getProductMrp, getProductEffectivePrice } from "../utils/productDiscount.js";
import { useCheckout } from "../hooks/useCheckoutR.js";
import { phpApi, phpRoutes } from "../lib/phpApi";
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
import { updateAnonymousProfile, getAnonymousUser } from "../utils/localStorageUser";
import { trackInitiateCheckout } from "../utils/metaPixel.js";
import { useReviewComments } from "../hooks/useReviewComments";
import {
    getAnonymousCart,
    setAnonymousCart,
    getAnonymousFavorites,
    setAnonymousFavorites,
    addToAnonymousCart,
    toggleAnonymousFavorite
} from "../utils/localStorageUser";
import { trackViewContent, trackAddToCart } from "../utils/metaPixel";
import {
    isFranchOilSku,
    isFranchOilPackSku,
    findFranchOilCartItem,
    resolveFranchOilLine,
    normalizeFranchOilBottleQty,
    normalizeFranchOilCartLine,
    upsertFranchOilAnonymousCart,
    FRANCH_OIL_PACK_SKU,
    FRANCH_OIL_SINGLE_SKU,
    FRANCH_OIL_PACK_FALLBACK,
    getFranchOilReviewProductId,
} from "../utils/franchOilCart";
import { getProductPageBanners } from "../utils/productPageBanners.js";
import {
    fetchCustomerCart,
    fetchCustomerFavorites,
    replaceCustomerCart,
    upsertCustomerCartItem,
    addCustomerFavorite,
    removeCustomerFavorite,
} from "../api/customerDataApi.js";

/** Shown on PDP when catalog still has legacy OG-3 naming (see doc/omega-3.txt). */
const OMEGA3_PRODUCT_DISPLAY = {
    title: "Franch Omega 3 Veg Capsules",
    subTitle: "Ayurvedic Flaxseed Omega Supplement for Heart, Brain & Immunity Support",
    shortBlurb:
        "Franch Omega 3 Veg Capsules are a plant-based Ayurvedic supplement designed to support heart health, brain function, immunity, and overall wellness. Formulated using high-quality flaxseed oil, this vegetarian omega supplement provides Alpha-Linolenic Acid (ALA), which the body naturally converts into essential fatty acids required for daily health. Unlike fish oil supplements, this veg omega-3 solution is ideal for those seeking a natural, plant-based alternative without compromising on benefits.",
};

const FRANCH_OIL_PRODUCT_DISPLAY = {
    title: "Franch Oil NH Plus",
    subTitle: "Ayurvedic Multipurpose Pain Relief & Skin Care Oil (100ml) | Joint Pain, Muscle Relief, Healing Oil",
    shortBlurb:
        "Franch Oil NH Plus is a powerful Ayurvedic multipurpose oil designed to provide natural relief from pain, support skin healing, and promote overall wellness. Formulated using advanced cold-pressed extraction, this herbal oil retains the potency of natural ingredients to deliver deep penetration and long-lasting results. Whether you're dealing with joint pain, muscle soreness, or skin concerns, Franch Oil NH Plus offers a safe and effective solution without harmful chemicals.",
};

/** Fixed PDP display price (checkout uses tiered pricing via franchOilCart). */
const FRANCH_OIL_PDP_PRICE = 220;

const FRANCH_OIL_PACK_PRODUCT_DISPLAY = {
    title: "Franch Oil NH Plus",
    subTitle:
        "Pack of 2 · Ayurvedic Multipurpose Pain Relief & Skin Care Oil (100 ml each)",
    shortBlurb:
        "Franch Oil NH Plus is a powerful Ayurvedic multipurpose oil designed to provide natural relief from pain, support skin healing, and promote overall wellness. This pack of 2 bottles gives you better value for daily family use — joint pain, muscle soreness, and skin care in one trusted formula.",
    salePrice: 400,
    originalPrice: 440,
};

const ORTHOVIN_PRODUCT_DISPLAY = {
    title: "Franch Orthovin Thailam",
    subTitle: "Ayurvedic Joint & Muscle Pain Relief Oil (60ml) | Arthritis, Back Pain & Stiffness Relief",
    shortBlurb:
        "Franch Orthovin Thailam is a highly concentrated Ayurvedic oil specially formulated to relieve joint pain, arthritis, and muscle stiffness naturally. Made with a powerful blend of herbal ingredients, this oil penetrates deep into the affected area to reduce inflammation, improve mobility, and provide long-lasting relief. Ideal for people suffering from chronic joint pain, back pain, or stiffness, Orthovin Thailam offers a natural and chemical-free solution for everyday pain management.",
};

const SKIN_SOAP_PRODUCT_DISPLAY = {
    title: "Franch Ayurveda Skin Soap",
    subTitle: "Herbal Clear Skin Bath Soap for Pimples, Dark Spots & Glowing Skin (100g)",
    shortBlurb:
        "Franch Ayurveda Skin Soap is a herbal bathing soap crafted to cleanse, nourish, and protect your skin naturally. Made using Ayurvedic principles, this soap helps maintain clear skin, improve complexion, and protect against common skin concerns like pimples, dryness, and dark spots. Its gentle formulation makes it suitable for daily use, leaving your skin fresh, soft, and naturally radiant after every wash.",
};

function ProductPage() {

    const { user, isCustomerLoggedIn, refreshUser } = useAuth();
    const { requireCustomerLogin } = useRequireCustomerLogin();
    const [cartFixed, setCartFixed] = useState('');
    const [currentProduct, setCurrentProduct] = useState(null);
    const { products, loading } = useProducts({ onlyActive: false, pageSize: 200 });
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const routeId = (id || "").toLowerCase();
    const reviewProductId = getFranchOilReviewProductId(routeId) || routeId;
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [savingAddress, setSavingAddress] = useState(false);
    const [isClickedCheckout, setIsClickedCheckout] = useState(false);
    const [checkoutCart, setCheckoutCart] = useState([]);
    const [imgState, setImgState] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [favs, setFavs] = useState([]);
    const [cart, setCart] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [toast, setToast] = useState(null);

    const { reviews: productReviews } = useReviewComments(reviewProductId);
    const [zoom, setZoom] = useState(false);
    const hasFiredViewContent = useRef(false);

    const matchesRouteProduct = (product, slug) => {
        if (!product || !slug) return false;
        const candidates = [
            product.sku,
            product.slug,
            product.itemCode,
            product.code,
            product.id,
        ]
            .filter(Boolean)
            .map((v) => String(v).toLowerCase());
        return candidates.includes(slug);
    };

    const minQty = {
        "franch-ayurveda-skin-soap": 4,
        "landing-franch-oil-nh-plus-pack-of-2": 1,
        "franch-orthovin-thailam": 2,
        "franch-oil-nh-plus": 1,
        "omega-3": 1
    }

    const handleMouseMove = (e) => {
        if (!zoom) return;

        const rect = e.target.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        e.target.style.backgroundPosition = `${x}% ${y}%`;
    };

    const desc = {
        "franch-oil-nh-plus": <div className="space-y-3">
            <p>Franch Oil NH Plus is a powerful Ayurvedic multipurpose oil designed to provide natural relief from pain, support skin healing, and promote overall wellness.</p>
            <p>Formulated using advanced cold-pressed extraction, this herbal oil retains the potency of natural ingredients to deliver deep penetration and long-lasting results.</p>
            <p>Whether you&apos;re dealing with joint pain, muscle soreness, or skin concerns, Franch Oil NH Plus offers a safe and effective solution without harmful chemicals.</p>
        </div>,
        "landing-franch-oil-nh-plus-pack-of-2": <div className="space-y-3">
            <p>Franch Oil NH Plus is a powerful Ayurvedic multipurpose oil designed to provide natural relief from pain, support skin healing, and promote overall wellness.</p>
            <p>Formulated using advanced cold-pressed extraction, this herbal oil retains the potency of natural ingredients to deliver deep penetration and long-lasting results.</p>
            <p>This pack of 2 gives you better value for daily family use — whether you&apos;re dealing with joint pain, muscle soreness, or skin concerns.</p>
        </div>,
        "omega-3": <div className="space-y-3">
            <p>Franch Omega 3 Veg Capsules are a plant-based Ayurvedic supplement designed to support heart health, brain function, immunity, and overall wellness.</p>
            <p>Formulated using high-quality flaxseed oil, this vegetarian omega supplement provides Alpha-Linolenic Acid (ALA), which the body naturally converts into essential fatty acids required for daily health.</p>
            <p>Unlike fish oil supplements, this veg omega-3 solution is ideal for those seeking a natural, plant-based alternative without compromising on benefits.</p>
            <p className="font-semibold text-[var(--t-p-c)]">How it works</p>
            <p>Omega-3 fatty acids play a key role in supporting brain cell function, maintaining heart health, and reducing inflammation. Since the body cannot produce omega-3 on its own, supplementation helps maintain balance.</p>
            <p>Omega-3 fatty acids are known to support heart, brain, and overall body function.</p>
        </div>,
        "franch-ayurveda-skin-soap": <div className="space-y-3">
            <p>Franch Ayurveda Skin Soap is a herbal bathing soap crafted to cleanse, nourish, and protect your skin naturally.</p>
            <p>Made using Ayurvedic principles, this soap helps maintain clear skin, improve complexion, and protect against common skin concerns like pimples, dryness, and dark spots.</p>
            <p>Its gentle formulation makes it suitable for daily use, leaving your skin fresh, soft, and naturally radiant after every wash.</p>
        </div>,
        "franch-orthovin-thailam": <div className="space-y-3">
            <p>Franch Orthovin Thailam is a highly concentrated Ayurvedic oil specially formulated to relieve joint pain, arthritis, and muscle stiffness naturally.</p>
            <p>Made with a powerful blend of herbal ingredients, this oil penetrates deep into the affected area to reduce inflammation, improve mobility, and provide long-lasting relief.</p>
            <p>Ideal for people suffering from chronic joint pain, back pain, or stiffness, Orthovin Thailam offers a natural and chemical-free solution for everyday pain management.</p>
            <p>Commonly used for arthritis, knee pain, back pain, neck pain, and shoulder discomfort.</p>
        </div>,
    }

    const faqs = {
        "franch-oil-nh-plus": [
            {
                q: "What is Franch Oil NH Plus used for?",
                a: "It is used for joint pain relief, muscle soreness, skin healing, and overall body wellness."
            },
            {
                q: "Is this oil safe for daily use?",
                a: "Yes, it is made with Ayurvedic ingredients and is safe for regular external use."
            },
            {
                q: "Can it be used for skin problems?",
                a: "Yes, it helps with dryness, cracks, minor wounds, and skin irritation."
            },
            {
                q: "How long does it take to show results?",
                a: "Results may vary, but regular use provides better and long-term benefits."
            }
        ],
        "landing-franch-oil-nh-plus-pack-of-2": [
            {
                q: "What is Franch Oil NH Plus used for?",
                a: "It is used for joint pain relief, muscle soreness, skin healing, and overall body wellness."
            },
            {
                q: "Is this oil safe for daily use?",
                a: "Yes, it is made with Ayurvedic ingredients and is safe for regular external use."
            },
            {
                q: "Can it be used for skin problems?",
                a: "Yes, it helps with dryness, cracks, minor wounds, and skin irritation."
            },
            {
                q: "How long does it take to show results?",
                a: "Results may vary, but regular use provides better and long-term benefits."
            }
        ],
        "omega-3": [
            {
                q: "What is Franch Omega 3 Veg used for?",
                a: "It supports heart health, brain function, immunity, and overall wellness."
            },
            {
                q: "Is this better than fish oil?",
                a: "It is ideal for vegetarians and provides plant-based omega-3 without fish-derived ingredients."
            },
            {
                q: "Can kids take this?",
                a: "Yes, it can be consumed from age 6+."
            },
            {
                q: "Does it help with hair and skin?",
                a: "Yes, omega-3 supports healthier skin and hair."
            },
        ],

        "franch-ayurveda-skin-soap": [
            {
                q: "What is Franch Ayurveda Skin Soap used for?",
                a: "It is used for daily cleansing, clear skin support, and improving skin glow while helping with pimples, dark spots, and dryness."
            },
            {
                q: "Can it be used daily?",
                a: "Yes, this soap is suitable for daily bathing."
            },
            {
                q: "Is it suitable for all skin types?",
                a: "Yes, it works for all skin types and is gentle on skin."
            },
            {
                q: "Does it help with pimples and dark spots?",
                a: "Yes, it helps protect skin from pimples and supports dark spot reduction with regular use."
            }
        ],

        "franch-orthovin-thailam": [
            {
                q: "What is Orthovin Thailam used for?",
                a: "It is used for arthritis, joint pain, muscle stiffness, and body pain relief."
            },
            {
                q: "Can I use it daily?",
                a: "Yes, it is made with natural herbs and can be used daily."
            },
            {
                q: "Does it help muscle stiffness?",
                a: "Yes, it helps relieve muscle stiffness and improves flexibility."
            },
            {
                q: "Can it be used for all age groups?",
                a: "Yes, it is suitable for all age groups suffering from joint pain."
            }
        ],
    };

    useEffect(() => {
        if (!user) return;

        // Handle anonymous users (localStorage)
        if (user.isAnonymous) {
            const anonCart = getAnonymousCart();
            const anonFavs = getAnonymousFavorites();
            setCart(anonCart);
            setFavs(anonFavs);
            return;
        }

        if (!isCustomerLoggedIn) return;

        let cancelled = false;
        (async () => {
            try {
                const [cartItems, favItems] = await Promise.all([
                    fetchCustomerCart(),
                    fetchCustomerFavorites(),
                ]);
                if (!cancelled) {
                    setCart(cartItems);
                    setFavs(favItems);
                }
            } catch (err) {
                console.error("Failed to load cart/favorites from server:", err);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user, isCustomerLoggedIn]);

    useEffect(() => {
        let matched = products.find((p) => matchesRouteProduct(p, routeId));
        if (!matched && routeId === FRANCH_OIL_PACK_SKU) {
            matched = { ...FRANCH_OIL_PACK_FALLBACK };
        }
        if (matched && routeId === FRANCH_OIL_PACK_SKU) {
            const singleOil = products.find((p) => matchesRouteProduct(p, FRANCH_OIL_SINGLE_SKU));
            const matchedImgs = Array.isArray(matched.images) ? matched.images.filter(Boolean) : [];
            const singleImgs = Array.isArray(singleOil?.images) ? singleOil.images.filter(Boolean) : [];
            const baseGallery =
                (matchedImgs.length > 0 ? matchedImgs : null) ||
                (singleImgs.length > 0 ? singleImgs : null) ||
                (matched.imageURL ? [matched.imageURL] : null) ||
                (singleOil?.imageURL ? [singleOil.imageURL] : null) ||
                FRANCH_OIL_PACK_FALLBACK.images;
            matched = {
                ...matched,
                images: baseGallery,
                imageURL: matched.imageURL || baseGallery[0] || singleOil?.imageURL || "",
            };
        }
        if (matched) {
            const imgs = Array.isArray(matched.images)
                ? matched.images.filter(Boolean)
                : [];
            if (imgs.length === 0 && matched.imageURL) {
                matched = { ...matched, images: [matched.imageURL] };
            } else if (imgs.length > 0) {
                matched = { ...matched, images: imgs, imageURL: matched.imageURL || imgs[0] };
            }
        }
        setCurrentProduct(matched || null);
    }, [routeId, products]);

    useEffect(() => {
        // Reset ViewContent guard and image selection when product changes
        hasFiredViewContent.current = false;
        setImgState(0);
    }, [id, routeId]);

    useEffect(() => {
        if (!currentProduct) return;

        if (
            routeId === FRANCH_OIL_PACK_SKU ||
            routeId === FRANCH_OIL_SINGLE_SKU
        ) {
            const franch = findFranchOilCartItem(cart);
            if (franch) {
                setQuantity(normalizeFranchOilBottleQty(franch.qty));
            }
        } else {
            const existing = cart.find((c) => c.productId === currentProduct.id);
            const idLower = id.toLowerCase();
            const maxBal = minQty[idLower] || 1;
            setQuantity(existing ? existing.qty || maxBal : maxBal);
        }

        if (!hasFiredViewContent.current) {
            hasFiredViewContent.current = true;
            const viewPrice = isFranchOilPackSku(currentProduct.sku)
                ? FRANCH_OIL_PACK_PRODUCT_DISPLAY.salePrice
                : routeId === FRANCH_OIL_SINGLE_SKU
                  ? (getProductEffectivePrice(currentProduct) || FRANCH_OIL_PDP_PRICE)
                  : currentProduct.price;
            trackViewContent(currentProduct.sku, viewPrice);
        }
    }, [cart, currentProduct, id, routeId]);

    const [isFav, setIsFav] = useState(false);

    useEffect(() => {
        if (currentProduct) {
            setIsFav(favs.some((f) => f.productId === currentProduct.id));
        }
    }, [favs, currentProduct]);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const docHeight = document.documentElement.scrollHeight;
            const clientHeight = document.documentElement.clientHeight;

            const distanceFromBottom = docHeight - (scrollY + clientHeight);

            if (scrollY > 600 && distanceFromBottom > 100) {
                setCartFixed("active");
            } else {
                setCartFixed("");
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const toggleFav = async (product) => {
        if (!requireCustomerLogin()) return;

        // Handle anonymous users (localStorage)
        if (user?.isAnonymous) {
            const wasAdded = toggleAnonymousFavorite({
                productId: product.id,
                title: product.title,
                price: Number(product.price) || 0,
                imageURL: product.imageURL || "",
            });
            const updatedFavs = getAnonymousFavorites();
            setFavs(updatedFavs);
            setIsFav(wasAdded);
            return;
        }

        const existing = favs.find((f) => f.productId === product.id);
        const nextIsFav = !existing;
        setIsFav(nextIsFav);
        setFavs((prev) =>
            existing
                ? prev.filter((f) => f.productId !== product.id)
                : [
                      ...prev,
                      {
                          id: `fav_pending_${Date.now()}`,
                          productId: product.id,
                          title: product.title,
                          price: Number(product.price) || 0,
                          imageURL: product.imageURL || "",
                      },
                  ]
        );

        try {
            if (existing) {
                const items = await removeCustomerFavorite({
                    productId: product.id,
                    lineId: existing.id,
                });
                setFavs(items);
            } else {
                const items = await addCustomerFavorite({
                    productId: product.id,
                    title: product.title,
                    price: Number(product.price) || 0,
                    imageURL: product.imageURL || "",
                });
                setFavs(items);
            }
        } catch (err) {
            console.error("Favorite toggle failed:", err);
            setIsFav(!nextIsFav);
            setFavs((prev) => {
                if (nextIsFav) {
                    return prev.filter((f) => f.productId !== product.id);
                }
                return existing ? [...prev, existing] : prev;
            });
        }
    };

    const upsertFranchOilServerCart = async (line) => {
        const franchItems = cart.filter((c) => isFranchOilSku(c.sku));
        const primary = franchItems[0];
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
        return saved;
    };

    const showToast = (message, type = "success") => {
        setToast({ message, type });
    };

    const enrichCartLines = (lines) =>
        (lines || []).map((item) => {
            const prod =
                products.find((p) => p.id === item.productId || p.sku === item.sku) ||
                currentProduct;
            if (isFranchOilSku(item.sku)) {
                return normalizeFranchOilCartLine(products, item);
            }
            const qty = Number(item.qty) || 1;
            return {
                ...item,
                productId: prod?.id || item.productId,
                sku: prod?.sku || item.sku,
                title: prod?.title || item.title,
                price: prod ? getProductEffectivePrice(prod) : (Number(item.price) || 0),
                imageURL: prod?.imageURL || item.imageURL,
                qty,
            };
        });

    const checkoutTotal = useMemo(
        () =>
            checkoutCart.reduce(
                (sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 1),
                0
            ),
        [checkoutCart]
    );

    const profile = useMemo(
        () => ({
            name: user?.displayName || user?.name || "",
            email: user?.email || "",
            phone: user?.phone || "",
        }),
        [user]
    );

    const { doCheckout, loading: checkoutLoading } = useCheckout({
        amount: checkoutTotal,
        cart: checkoutCart,
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

    const validateCheckoutCart = (lines) => {
        const omega_prod = "RNd3gdknYlM4r6moZJbN";
        const omegaItem = lines.find((item) => item.productId === omega_prod);
        if (omegaItem && omegaItem.qty < 4) {
            showToast(
                "Please add at least 4 quantities of the Franch Ayurveda clear Skin Soap product to proceed to checkout.",
                "error"
            );
            return false;
        }

        const orthovin_prod = "fcrb3N0Lt7YPjK7UTX39";
        const orthovinItem = lines.find((item) => item.productId === orthovin_prod);
        if (orthovinItem && orthovinItem.qty < 2) {
            showToast(
                "Please add at least 2 quantities of Franch Orthovin Thailam to proceed to checkout.",
                "error"
            );
            return false;
        }

        if (lines.length === 0) {
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

    const openCheckoutModal = (cartLines) => {
        if (!isCustomerLoggedIn) {
            navigate("/login", {
                state: {
                    returnTo: `${location.pathname}${location.search}`,
                },
            });
            return;
        }

        const enriched = enrichCartLines(cartLines);
        if (!validateCheckoutCart(enriched)) return;

        setCheckoutCart(enriched);
        setShowAddressModal(true);
    };

    const handleAddressConfirm = async (form, meta) => {
        setIsClickedCheckout(true);

        try {
            await persistCheckoutAddress(form, meta);

            try {
                const cartSnapshot = checkoutCart.map((item) => ({
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
            } catch {
                /* non-critical */
            }

            trackInitiateCheckout(checkoutCart);

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
            showToast(`Error starting payment: ${err.message}`, "error");
        }
    };

    const productForCart = (product, qty = quantity) => {
        if (!product) return product;
        if (!isFranchOilSku(product.sku)) return product;
        const line = resolveFranchOilLine(
            products,
            normalizeFranchOilBottleQty(qty)
        );
        if (!line) return product;
        return { ...product, ...line };
    };

    const addToCart = async (product, { goToCheckout = false } = {}) => {
        product = productForCart(product);
        if (!requireCustomerLogin()) return;

        const finish = (cartLines, checkoutLine) => {
            if (goToCheckout) {
                openCheckoutModal(checkoutLine ? [checkoutLine] : cartLines);
                return;
            }
            showToast("Added to cart! You can continue shopping or checkout anytime.");
        };

        const buildProductLine = (qty) => {
            const mrp = getProductMrp(product) || product.price || 0;
            return {
                sku: product.sku,
                productId: product.id,
                title: product.title,
                price: getProductEffectivePrice(product),
                mrp: mrp,
                originalPrice: mrp,
                discountStrikePrice: mrp,
                imageURL: product.imageURL || "",
                qty,
            };
        };

        if (isFranchOilSku(product.sku)) {
            const bottleQty = normalizeFranchOilBottleQty(quantity);
            const line = resolveFranchOilLine(products, bottleQty);
            if (!line) {
                console.error("Franch Oil line could not be resolved for qty", bottleQty);
                return;
            }

            if (user.isAnonymous) {
                const updatedCart = upsertFranchOilAnonymousCart(line);
                setCart(updatedCart);
                trackAddToCart(line.sku, line.price, line.qty);
                finish(updatedCart, line);
            } else {
                const saved = await upsertFranchOilServerCart(line);
                const checkoutLine = saved.find((c) => isFranchOilSku(c.sku)) || line;
                trackAddToCart(line.sku, line.price, line.qty);
                finish(saved, checkoutLine);
            }
            return;
        }

        const itemQty = Math.max(minQty[product.sku.toLowerCase()] || 1, quantity);

        if (user.isAnonymous) {
            const currentCart = getAnonymousCart();
            const existing = currentCart.find((c) => c.productId === product.id);
            let checkoutLine;

            if (existing) {
                existing.qty = itemQty;
                checkoutLine = { ...existing };
                setAnonymousCart(currentCart);
            } else {
                checkoutLine = {
                    ...buildProductLine(itemQty),
                    id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    createdAt: new Date().toISOString(),
                };
                setAnonymousCart([...currentCart, checkoutLine]);
            }

            const updatedCart = getAnonymousCart();
            setCart(updatedCart);
            trackAddToCart(product.sku, product.price, itemQty);
            finish(updatedCart, checkoutLine);
            return;
        }

        const existing = cart.find((c) => c.productId === product.id);
        const line = buildProductLine(itemQty);
        try {
            const saved = await upsertCustomerCartItem(
                existing ? { ...line, qty: itemQty } : line
            );
            setCart(saved);
            const checkoutLine = saved.find((c) => c.productId === product.id) || line;
            trackAddToCart(product.sku, product.price, itemQty);
            finish(saved, checkoutLine);
        } catch (err) {
            console.error("Add to cart failed:", err);
            showToast("Could not update cart. Please try again.", "error");
        }
    };

    const updateQty = (newQty) => {
        if (
            routeId === FRANCH_OIL_PACK_SKU ||
            routeId === FRANCH_OIL_SINGLE_SKU
        ) {
            setQuantity(normalizeFranchOilBottleQty(newQty));
            return;
        }
        const idLower = id.toLowerCase();
        const maxBal = minQty[idLower] || 1;
        setQuantity(Math.max(maxBal, newQty));
    };

    if (loading) return <div className="w-full h-[300px] flex justify-center items-center">
        <MaskImage size="3em" bg="var(--t-p-c)" hBg="var(--t-p-c)" url="https://api.iconify.design/line-md:loading-twotone-loop.svg" />
    </div>;

    if (!currentProduct) {
        return (
            <div className="w-full h-[300px] flex flex-col justify-center items-center gap-3">
                <p className="text-lg text-gray-700">Product not found.</p>
                <a href="/products" className="text-green-700 underline">Go back to products</a>
            </div>
        );
    }

    const isPackProduct = routeId === FRANCH_OIL_PACK_SKU;
    const isOmega3Product = routeId === "omega-3";
    const isOrthovinProduct = routeId === "franch-orthovin-thailam";
    const isSkinSoapProduct = routeId === "franch-ayurveda-skin-soap";
    const pdpTitle = isPackProduct
        ? FRANCH_OIL_PACK_PRODUCT_DISPLAY.title
        : routeId === "franch-oil-nh-plus"
        ? FRANCH_OIL_PRODUCT_DISPLAY.title
        : (isOmega3Product ? OMEGA3_PRODUCT_DISPLAY.title : currentProduct.title);
    const pdpSubTitle = isPackProduct
        ? FRANCH_OIL_PACK_PRODUCT_DISPLAY.subTitle
        : routeId === "franch-oil-nh-plus"
        ? FRANCH_OIL_PRODUCT_DISPLAY.subTitle
        : (isOmega3Product
        ? OMEGA3_PRODUCT_DISPLAY.subTitle
        : (isOrthovinProduct
            ? ORTHOVIN_PRODUCT_DISPLAY.subTitle
            : (isSkinSoapProduct ? SKIN_SOAP_PRODUCT_DISPLAY.subTitle : (currentProduct.subTitle || ""))));
    const pdpIntroBlurb = isPackProduct
        ? FRANCH_OIL_PACK_PRODUCT_DISPLAY.shortBlurb
        : routeId === "franch-oil-nh-plus"
        ? FRANCH_OIL_PRODUCT_DISPLAY.shortBlurb
        : (isOmega3Product
        ? OMEGA3_PRODUCT_DISPLAY.shortBlurb
        : (isOrthovinProduct
            ? ORTHOVIN_PRODUCT_DISPLAY.shortBlurb
            : (isSkinSoapProduct ? SKIN_SOAP_PRODUCT_DISPLAY.shortBlurb : currentProduct.description)));

    const franchOilPdpDynamicPrice = getProductEffectivePrice(currentProduct) || FRANCH_OIL_PDP_PRICE;
    const buyBoxProduct = isPackProduct
        ? {
              ...currentProduct,
              price: FRANCH_OIL_PACK_PRODUCT_DISPLAY.salePrice,
              originalPrice: FRANCH_OIL_PACK_PRODUCT_DISPLAY.originalPrice,
              subTitle: FRANCH_OIL_PACK_PRODUCT_DISPLAY.subTitle,
          }
        : routeId === FRANCH_OIL_SINGLE_SKU
          ? { ...currentProduct, price: franchOilPdpDynamicPrice }
          : currentProduct;
    const pdpTitleFinal = isOrthovinProduct
        ? ORTHOVIN_PRODUCT_DISPLAY.title
        : (isSkinSoapProduct ? SKIN_SOAP_PRODUCT_DISPLAY.title : pdpTitle);

    const reviewCount = productReviews.length;
    const avgRating = reviewCount > 0
        ? Math.round((productReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviewCount) * 10) / 10
        : null;
    const displayRating = avgRating != null ? String(avgRating) : "5";

    const pdpMrp = getProductMrp(buyBoxProduct || currentProduct);
    const pdpSale = isPackProduct
        ? FRANCH_OIL_PACK_PRODUCT_DISPLAY.salePrice
        : routeId === FRANCH_OIL_SINGLE_SKU
          ? franchOilPdpDynamicPrice
          : getProductEffectivePrice(currentProduct);
    const pdpLineTotal =
        isPackProduct || routeId === FRANCH_OIL_SINGLE_SKU
            ? pdpSale
            : pdpSale * Math.max(minQty[id?.toLowerCase()] || 1, quantity);
    const showPdpMrp = pdpMrp > pdpSale;
    const displayQtyFixed =
        routeId === FRANCH_OIL_PACK_SKU || routeId === FRANCH_OIL_SINGLE_SKU
            ? normalizeFranchOilBottleQty(quantity)
            : Math.max(minQty[id?.toLowerCase()] || 1, quantity);
    const productPageBanners = getProductPageBanners(routeId);

    const productImages =
        Array.isArray(currentProduct.images) && currentProduct.images.length > 0
            ? currentProduct.images.filter(Boolean)
            : currentProduct.imageURL
              ? [currentProduct.imageURL]
              : [];

    const mainImage =
        productImages[imgState] || productImages[0] || currentProduct.imageURL || "";

    return (
        <>
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
            totalCost={checkoutTotal}
            loading={checkoutLoading || isClickedCheckout || savingAddress}
            onConfirm={handleAddressConfirm}
        />
        <section>

            <div id="productPage-sec" className="max-w-[1920px] bg-w py-10 xl:pt-20 mx-auto  sm:px-10">
                <div className="max-w-[1200px] w-[90%] mx-auto ">
                    <div className={`add-to-cart-wrapper bg-w p-4 fixed-cart-bottom  xl:block ${cartFixed}`}>
                        <div className="grid grid-cols-12 gap-5 items-center">
                            <div className="sm:col-span-6 col-span-12">
                                <div className="fixed-cart-product flex gap-3">
                                    <div className="fixed-cart-product-image" style={{ "--product-full-img": `url(${currentProduct?.imageURL})` }}></div>
                                    <div className="flex flex-col justify-center">
                                        <h5 className="m-0 poppins font-medium text-[var(--t-c-d1)] text-[1rem] truncate w-64 ">{pdpTitleFinal}</h5>
                                        <div className="poppins mt-1 flex flex-wrap items-center gap-2">
                                            <p className="m-0 text-[var(--p-c)] font-bold text-[1rem] leading-[1.2] font-sans tabular-nums">
                                                ₹ {pdpLineTotal}
                                            </p>
                                            {showPdpMrp && (
                                                <p className="m-0 text-slate-400 text-sm line-through font-sans tabular-nums">
                                                    ₹ {pdpMrp * displayQtyFixed}
                                                </p>
                                            )}
                                            <ProductGiftBanner compact />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="sm:col-span-2 col-span-5">
                                <div className="dd-count-wrapper flex justify-between p-1 px-4 items-center">
                                    <div
                                        className="mask-item"
                                        style={{
                                            "--m-size": "1.7rem",
                                            "--m-bg": "var(--t-p-c)",
                                            "--m-url": "url(https://api.iconify.design/iconamoon:sign-minus-bold.svg?color=%23ff0000)",
                                        }}
                                        onClick={() => updateQty(quantity - 1)}
                                    ></div>
                                    <div className="text-[1.3rem]">
                                        {displayQtyFixed}
                                    </div>
                                    <div
                                        className="mask-item"
                                        style={{
                                            "--m-size": "1.7rem",
                                            "--m-bg": "var(--t-p-c)",
                                            "--m-url": "url(https://api.iconify.design/material-symbols:add-rounded.svg?color=%23ff0000)",
                                        }}
                                        onClick={() => updateQty(quantity + 1)}
                                    ></div>
                                </div>
                            </div>
                            <div className="sm:col-span-4 col-span-7 flex gap-2">
                                <button
                                    type="button"
                                    className="flex-1 flex items-center justify-center poppins font-semibold border border-[var(--p-c)] text-[var(--p-c)] bg-white text-[12px] sm:text-[14px] py-2 rounded-full"
                                    onClick={() => addToCart(currentProduct, { goToCheckout: false })}
                                >
                                    Add to cart
                                </button>
                                <ProductBuyNowButton
                                    className="flex-1 min-w-0"
                                    size="sm"
                                    showPaymentIcons={false}
                                    onClick={() => addToCart(currentProduct, { goToCheckout: true })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="product-pdp-layout grid grid-cols-12 gap-x-6 lg:gap-x-10">
                        <div className="col-span-12 lg:col-span-6 product-pdp-sticky-col min-h-0">
                            <div className="products-image-wrapper product-pdp-gallery w-full flex lg:flex-row flex-col gap-3">
                                {/* Thumbnail Strip */}
                                <div className="product-short-image-wrapper flex lg:flex-col flex-row items-center gap-2.5 order-2 lg:order-1 overflow-x-auto lg:overflow-y-auto">
                                    {productImages.map((image, index) => (
                                        <button
                                            type="button"
                                            key={index}
                                            className={`product-short-image relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                                                imgState === index
                                                    ? "border-emerald-600 ring-2 ring-emerald-500/30 scale-102 shadow-sm"
                                                    : "border-slate-200/80 hover:border-slate-400 opacity-75 hover:opacity-100"
                                            }`}
                                            style={{ "--product-short-img": `url(${image})` }}
                                            onClick={() => setImgState(index)}
                                            aria-label={`View product image ${index + 1}`}
                                        >
                                            <span className="sr-only">Image {index + 1}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Main Hero Image with Left / Right Arrows & Counter */}
                                <div className="relative order-1 lg:order-2 flex-1 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/80 shadow-xs">
                                    <div
                                        className={`product-full-image-wrapper relative ${zoom ? "zoom-active" : ""}`}
                                        style={{ "--product-full-img": `url(${mainImage})` }}
                                        onMouseEnter={() => setZoom(true)}
                                        onMouseLeave={(e) => {
                                            setZoom(false);
                                            e.target.style.backgroundPosition = "center";
                                        }}
                                        onMouseMove={handleMouseMove}
                                    >
                                        {id == "omega-3" && (<div className="pureVegImage"></div>)}
                                    </div>

                                    {/* Left Arrow Button on Hero Image */}
                                    {productImages.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setImgState((prev) => (prev > 0 ? prev - 1 : productImages.length - 1))}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md border border-slate-200 flex items-center justify-center transition hover:scale-105 backdrop-blur-xs cursor-pointer z-10"
                                            aria-label="Previous image"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                    )}

                                    {/* Right Arrow Button on Hero Image */}
                                    {productImages.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setImgState((prev) => (prev < productImages.length - 1 ? prev + 1 : 0))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md border border-slate-200 flex items-center justify-center transition hover:scale-105 backdrop-blur-xs cursor-pointer z-10"
                                            aria-label="Next image"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    )}

                                    {/* Top badges: Counter + Lightbox Zoom Button */}
                                    <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                                        <button
                                            type="button"
                                            onClick={() => setLightboxOpen(true)}
                                            className="h-8 w-8 rounded-full bg-white/85 hover:bg-white text-slate-700 shadow-xs border border-slate-200/80 flex items-center justify-center transition cursor-pointer backdrop-blur-xs"
                                            title="View Fullscreen"
                                        >
                                            <Maximize2 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {productImages.length > 1 && (
                                        <div className="absolute bottom-3 left-3 bg-slate-900/75 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-xs z-10">
                                            📷 {imgState + 1} / {productImages.length}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="col-span-12 lg:col-span-6 mt-15 lg:mt-0 product-pdp-main">
                            <div className="product-page-details-wrapper product-pdp-modern lg:pl-2">
                                <ProductBuyBox
                                    product={buyBoxProduct}
                                    title={pdpTitleFinal}
                                    subtitle={pdpSubTitle}
                                    pricePackLabel={isPackProduct ? "Pack of 2" : null}
                                    displayRating={displayRating}
                                    reviewCount={reviewCount}
                                    avgRating={avgRating}
                                    quantity={quantity}
                                    onQtyChange={updateQty}
                                    minQty={minQty[id?.toLowerCase()] || 1}
                                    isFranchOilQty={
                                        routeId === FRANCH_OIL_SINGLE_SKU ||
                                        routeId === FRANCH_OIL_PACK_SKU
                                    }
                                    isFav={isFav}
                                    onToggleFav={() => toggleFav(currentProduct)}
                                    onAddToCart={() => addToCart(currentProduct, { goToCheckout: false })}
                                    onBuyNow={() => addToCart(currentProduct, { goToCheckout: true })}
                                    packBanner={
                                        id === "franch-oil-nh-plus" ? (
                                            <ProductPackOffer imageSrc={fnhpackoftwo} />
                                        ) : null
                                    }
                                />
                                <div className="product-pdp-intro mt-8 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/80 to-white p-5 sm:p-6 shadow-xs">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-emerald-700" />
                                        <h2 className="m-0 quando text-xl sm:text-2xl font-bold text-[var(--t-c-g)]">About this product</h2>
                                    </div>
                                    <p className="m-0 mt-3 text-sm sm:text-base text-slate-700 leading-relaxed">{pdpIntroBlurb}</p>
                                    <div className="mt-4 flex flex-wrap gap-2.5">
                                        <a href="/contact" className="product-pdp-quick-link">Ask a question</a>
                                        <a href="/shipping" className="product-pdp-quick-link">Shipping info</a>
                                        <a href="/return" className="product-pdp-quick-link">Returns policy</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="product-pdp-tabs-full w-full mt-10 lg:mt-14">
                        <ProductPageComponent
                            embedded
                            path={id.toLowerCase()}
                            desc={desc[id.toLowerCase()]}
                            faqs={faqs[id.toLowerCase()]}
                        />
                    </div>

                    {productPageBanners.length > 0 && (
                        <ProductPageBanners
                            banners={productPageBanners}
                            productName={pdpTitleFinal}
                        />
                    )}

                    {/* Products Section */}
                    <ProductSection title="Related Products" currentProductId={id} />

                    {/* Reviews Section */}
                    <ReviewSection productId={reviewProductId} />
                </div>
            </div>

            {/* Lightbox Fullscreen Modal */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setLightboxOpen(false)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={mainImage}
                            alt="Full Preview"
                            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                        />
                        <button
                            type="button"
                            onClick={() => setLightboxOpen(false)}
                            className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition cursor-pointer"
                        >
                            <CloseIcon className="h-6 w-6" />
                        </button>
                        {productImages.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setImgState((prev) => (prev > 0 ? prev - 1 : productImages.length - 1))}
                                    className="absolute -left-14 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition cursor-pointer"
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setImgState((prev) => (prev < productImages.length - 1 ? prev + 1 : 0))}
                                    className="absolute -right-14 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition cursor-pointer"
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </section >
        </>
    );
}

export default ProductPage;