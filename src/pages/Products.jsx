import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "../hooks/useProducts.js";
import useAuth from "../hooks/useAuth";
import useRequireCustomerLogin from "../hooks/useRequireCustomerLogin";
import {
  fetchCustomerCart,
  fetchCustomerFavorites,
  replaceCustomerCart,
  upsertCustomerCartItem,
  addCustomerFavorite,
  removeCustomerFavorite,
} from "../api/customerDataApi.js";
import BannerForAll from "../sections/banner.jsx";
import { useLocalStorageCart } from "../hooks/useLocalStorageCart";
import Toast from "../components/Toast";
import ProductGridCard from "../components/product/ProductGridCard.jsx";
import ProductsCatalogSidebar from "../components/products/ProductsCatalogSidebar.jsx";
import { getAnonymousCart } from "../utils/localStorageUser";
import { getProductEffectivePrice } from "../utils/productDiscount.js";
import {
  isFranchOilSku,
  findFranchOilCartItem,
  resolveFranchOilLine,
  normalizeFranchOilBottleQty,
  upsertFranchOilAnonymousCart,
  shouldHideFromProductListings,
} from "../utils/franchOilCart";
import "../css/productsCatalog.css";

function Products() {
  const { user, isCustomerLoggedIn } = useAuth();
  const { requireCustomerLogin } = useRequireCustomerLogin();
  const { products, loading } = useProducts({ onlyActive: false, pageSize: 200 });
  const [toast, setToast] = useState(null);
  const [zoomImg, setZoomImg] = useState(null);
  const [favs, setFavs] = useState([]);
  const [cart, setCart] = useState([]);
  const { addToCart: addToAnonCart } = useLocalStorageCart();

  const minQty = {
    "franch-ayurveda-skin-soap": 4,
    "franch-orthovin-thailam": 2,
    "omega-3": 1,
  };

  const [searchParams, setSearchParams] = useSearchParams();

  const listingProducts = useMemo(
    () => (products || []).filter((p) => !shouldHideFromProductListings(p)),
    [products]
  );

  const priceCeiling = useMemo(() => {
    const prices = listingProducts.map((p) => getProductEffectivePrice(p));
    if (!prices.length) return 1000;
    const top = Math.max(...prices);
    return Math.max(500, Math.ceil(top / 100) * 100);
  }, [listingProducts]);

  const categories = useMemo(
    () =>
      [...new Set(listingProducts.map((p) => p.category).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [listingProducts]
  );

  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [search] = useState(searchParams.get("search") || "");
  const [priceRange, setPriceRange] = useState({
    min: Number(searchParams.get("min") || 0),
    max: Number(searchParams.get("max") || priceCeiling),
  });

  useEffect(() => {
    setCategory(searchParams.get("category") || "all");
    setPriceRange({
      min: Number(searchParams.get("min") || 0),
      max: Number(searchParams.get("max") || priceCeiling),
    });
  }, [searchParams, priceCeiling]);

  const searchQuery = search.toLowerCase();

  const filteredProducts = useMemo(() => {
    return listingProducts.filter((product) => {
      const inCategory =
        category === "all" ||
        !category ||
        product.category?.toLowerCase() === category.toLowerCase();
      const price = getProductEffectivePrice(product);
      const inPrice = price >= priceRange.min && price <= priceRange.max;
      const inSearch = searchQuery
        ? product.title?.toLowerCase().includes(searchQuery) ||
          product.subTitle?.toLowerCase().includes(searchQuery)
        : true;
      return inCategory && inPrice && inSearch;
    });
  }, [listingProducts, category, priceRange, searchQuery]);

  const syncUrl = useCallback(
    (nextCategory, nextRange) => {
      const params = {};
      if (nextCategory && nextCategory !== "all") params.category = nextCategory;
      if (search) params.search = search;
      if (nextRange.min > 0) params.min = String(nextRange.min);
      if (nextRange.max < priceCeiling) params.max = String(nextRange.max);
      setSearchParams(params, { replace: true });
    },
    [search, priceCeiling, setSearchParams]
  );

  const handleCategoryChange = (value) => {
    setCategory(value);
    syncUrl(value, priceRange);
  };

  const handlePriceRangeChange = (range) => {
    setPriceRange(range);
    syncUrl(category, range);
  };

  useEffect(() => {
    if (!user) return;

    if (user.isAnonymous) {
      setCart(getAnonymousCart());
      setFavs([]);
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
      } catch (error) {
        console.error("Error loading cart/favorites:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isCustomerLoggedIn]);

  const toggleFav = async (product) => {
    if (!requireCustomerLogin()) return;

    if (user.isAnonymous) return;

    const existing = favs.find((f) => f.productId === product.id);
    const payload = {
      productId: product.id,
      title: product.title,
      price: getProductEffectivePrice(product),
      imageURL: product.imageURL || "",
    };

    try {
      if (existing) {
        const items = await removeCustomerFavorite({
          productId: product.id,
          lineId: existing.id,
        });
        setFavs(items);
      } else {
        const items = await addCustomerFavorite(payload);
        setFavs(items);
      }
    } catch (err) {
      setToast({ message: err.message || "Could not update favorites", type: "error" });
    }
  };

  const addToCart = async (product) => {
    if (!requireCustomerLogin()) return;

    if (isFranchOilSku(product.sku)) {
      const existingFranch = findFranchOilCartItem(
        user.isAnonymous ? getAnonymousCart() : cart
      );
      const bottleQty = existingFranch
        ? normalizeFranchOilBottleQty((existingFranch.qty || 1) + 1)
        : 1;
      const line = resolveFranchOilLine(products, bottleQty);
      if (!line) {
        setToast({ message: "Franch Oil is unavailable right now.", type: "error" });
        return;
      }

      if (user.isAnonymous) {
        upsertFranchOilAnonymousCart(line);
      } else {
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
      }
      setToast({ message: "Added to cart!", type: "success" });
      return;
    }

    const finalQty = minQty[product.sku?.toLowerCase()] || 1;

    if (user.isAnonymous) {
      addToAnonCart({
        productId: product.id,
        sku: product.sku,
        title: product.title,
        price: getProductEffectivePrice(product),
        imageURL: product.imageURL || "",
        qty: finalQty,
      });
      setToast({ message: "Added to cart!", type: "success" });
      return;
    }

    const existing = cart.find((c) => c.productId === product.id);
    const line = {
      productId: product.id,
      sku: product.sku,
      title: product.title,
      price: getProductEffectivePrice(product),
      imageURL: product.imageURL || "",
      qty: existing ? (existing.qty || 0) + finalQty : finalQty,
    };

    try {
      const saved = await upsertCustomerCartItem(line);
      setCart(saved);
      setToast({ message: "Added to cart!", type: "success" });
    } catch (err) {
      setToast({ message: err.message || "Could not add to cart", type: "error" });
    }
  };

  if (loading) return <span className="web_loading" />;

  return (
    <section id="all-product-section" className="w-full pb-16">
      <BannerForAll title="Our Products" breadcrumb="Our Products" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {zoomImg && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setZoomImg(null)}
          role="presentation"
        >
          <img
            src={zoomImg}
            alt="Product zoom"
            className="max-h-[85vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="max-w-[1200px] w-[92%] mx-auto mt-8 lg:mt-12">
        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          <div className="col-span-12 lg:col-span-3">
            <ProductsCatalogSidebar
              categories={categories}
              products={listingProducts}
              category={category}
              onCategoryChange={handleCategoryChange}
              priceRange={priceRange}
              onPriceRangeChange={handlePriceRangeChange}
              priceMax={priceCeiling}
            />
          </div>

          <div className="col-span-12 lg:col-span-9 h-full">
            {filteredProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-12 poppins">No products match your filters.</p>
            ) : (
              <div className="catalog-grid">
                {filteredProducts.map((product) => (
                  <ProductGridCard
                    key={product.id}
                    product={product}
                    isFav={favs.some((f) => f.productId === product.id)}
                    onToggleFav={toggleFav}
                    onAddToCart={addToCart}
                    onZoom={setZoomImg}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Products;
