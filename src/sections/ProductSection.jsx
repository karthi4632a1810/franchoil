import React, { useCallback, useEffect, useState } from "react";
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
import { useAnimation } from "../hooks/useAnimation.js";
import { getAnonymousCart } from "../utils/localStorageUser";
import { useLocalStorageCart } from "../hooks/useLocalStorageCart";
import Toast from "../components/Toast";
import ProductGridCard from "../components/product/ProductGridCard.jsx";
import { getProductEffectivePrice } from "../utils/productDiscount.js";
import {
  isFranchOilSku,
  findFranchOilCartItem,
  resolveFranchOilLine,
  normalizeFranchOilBottleQty,
  upsertFranchOilAnonymousCart,
  shouldHideFromProductListings,
} from "../utils/franchOilCart";

function ProductSection({ title = "Our Products", currentProductId = null }) {
  const { user, isCustomerLoggedIn } = useAuth();
  const { requireCustomerLogin } = useRequireCustomerLogin();
  const { products, loading } = useProducts();
  const [elements, setElements] = useState([]);
  const [zoomImg, setZoomImg] = useState(null);
  const [toast, setToast] = useState(null);
  const [favs, setFavs] = useState([]);
  const [cart, setCart] = useState([]);
  const { addToCart: addToAnonCart } = useLocalStorageCart();

  const refCallback = useCallback(
    (el) => {
      if (el && !elements.includes(el)) {
        setElements((prev) => [...prev, el]);
      }
    },
    [elements]
  );

  useAnimation(elements);

  const minQty = {
    "franch-ayurveda-skin-soap": 4,
    "franch-orthovin-thailam": 2,
    "omega-3": 1,
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
      const existingFranch = findFranchOilCartItem(user.isAnonymous ? getAnonymousCart() : cart);
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

  if (loading) return <div className="text-center py-10 poppins">Loading products…</div>;

  const visibleProducts = products
    .filter((p) => !shouldHideFromProductListings(p))
    .filter((p) => p.sku?.toLowerCase() !== currentProductId?.toLowerCase());

  return (
    <section className="w-full bg-w py-20">
      {zoomImg && (
        <div
          className="franch-product-zoom-backdrop"
          onClick={() => setZoomImg(null)}
          role="dialog"
          aria-label="Product image zoom"
        >
          <img src={zoomImg} alt="Product zoom" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-[1200px] w-[100%] mx-auto product-section-wrapper">
        <div className="grid grid-cols-12 items-stretch product-section-grid">
          <div className="col-span-12 mb-10 px-4">
            <div className="product-section-heading-wrapper border-b-[5px] border-[var(--p-c)]">
              <div className="product-section-heading ruwudu p-2 px-7 pb-0 bg-p-c mb-[3px] w-max text-c-l text-[17px] rounded-t-[7px] tracking-[1px]">
                {title}
              </div>
            </div>
          </div>

          {visibleProducts.map((product) => {
            const isFav = favs.some((f) => f.productId === product.id);
            return (
              <div
                ref={refCallback}
                key={product.id}
                data-animation="left"
                className="product-grid-cell col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-3 px-3 sm:px-4 mb-10"
              >
                <ProductGridCard
                  product={product}
                  isFav={isFav}
                  onToggleFav={toggleFav}
                  onAddToCart={addToCart}
                  onZoom={setZoomImg}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ProductSection;
