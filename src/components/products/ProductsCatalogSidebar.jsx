import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import MaskImage from "../../tools/MaskImage.jsx";
import PriceRangeFilter from "./PriceRangeFilter.jsx";

function CategoryFilterContent({ categories, category, onPick }) {
  return (
    <>
      <div className="filter-heading">
        <h5 className="m-0">CATEGORIES</h5>
      </div>
      <div className="filter-input-wrapper">
        <label className="input-filter">
          <span>ALL PRODUCTS</span>
          <input type="checkbox" checked={category === "all"} onChange={() => onPick("all")} />
        </label>
        {categories.map((cat) => (
          <label key={cat} className="input-filter">
            <span>{cat.toUpperCase()}</span>
            <input
              type="checkbox"
              checked={category === cat}
              onChange={(e) => onPick(e.target.checked ? cat : "all")}
            />
          </label>
        ))}
      </div>
    </>
  );
}

function PriceFilterContent({ priceMax, priceRange, onPriceRangeChange }) {
  return (
    <>
      <div className="filter-heading">
        <h5 className="m-0">PRICE RANGE</h5>
      </div>
      <PriceRangeFilter min={0} max={priceMax} value={priceRange} onChange={onPriceRangeChange} />
    </>
  );
}

export default function ProductsCatalogSidebar({
  categories = [],
  products = [],
  category,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  priceMax = 1000,
}) {
  const [filterOpen, setFilterOpen] = useState(null);
  const pillsRef = useRef(null);

  const closeFilter = () => setFilterOpen(null);

  const toggleFilter = (key) => {
    setFilterOpen((p) => (p === key ? null : key));
  };

  useEffect(() => {
    if (!filterOpen) return undefined;

    const onDocClick = (e) => {
      const sheet = document.getElementById("catalog-mobile-filter-sheet");
      if (pillsRef.current?.contains(e.target)) return;
      if (sheet?.contains(e.target)) return;
      setFilterOpen(null);
    };

    const timer = window.setTimeout(() => {
      document.addEventListener("click", onDocClick);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", onDocClick);
    };
  }, [filterOpen]);

  useEffect(() => {
    if (!filterOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filterOpen]);

  const bestSellers = products.slice(0, 4);

  const pickCategory = (value) => {
    onCategoryChange?.(value);
  };

  const mobileFilterPortal =
    filterOpen && typeof document !== "undefined"
      ? createPortal(
          <>
            <div
              className="catalog-filter-backdrop catalog-filter-backdrop--open"
              onClick={closeFilter}
              aria-hidden={false}
            />
            <div
              id="catalog-mobile-filter-sheet"
              role="dialog"
              aria-modal="true"
              aria-label={filterOpen === "categ" ? "Categories" : "Price range"}
              className="catalog-mobile-sheet catalog-filter-panel"
            >
              <button
                type="button"
                className="catalog-mobile-sheet__close"
                onClick={closeFilter}
                aria-label="Close filters"
              >
                ×
              </button>
              {filterOpen === "categ" ? (
                <CategoryFilterContent
                  categories={categories}
                  category={category}
                  onPick={pickCategory}
                />
              ) : (
                <PriceFilterContent
                  priceMax={priceMax}
                  priceRange={priceRange}
                  onPriceRangeChange={onPriceRangeChange}
                />
              )}
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <aside className="catalog-sidebar">
      <div ref={pillsRef} className="catalog-filter-mobile flex gap-2 mb-4 lg:hidden">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFilter("categ");
          }}
          className={`catalog-filter-pill ${filterOpen === "categ" ? "active" : ""}`}
          aria-expanded={filterOpen === "categ"}
        >
          Categories
          <MaskImage url="https://api.iconify.design/mdi:chevron-down.svg" size="0.7em" bg="var(--p-c)" hBg="#fff" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFilter("price");
          }}
          className={`catalog-filter-pill ${filterOpen === "price" ? "active" : ""}`}
          aria-expanded={filterOpen === "price"}
        >
          Price range
          <MaskImage url="https://api.iconify.design/mdi:chevron-down.svg" size="0.7em" bg="var(--p-c)" hBg="#fff" />
        </button>
      </div>

      {mobileFilterPortal}

      <div className="catalog-sidebar-stack">
        <div className="catalog-filter-panel hidden lg:block">
          <CategoryFilterContent
            categories={categories}
            category={category}
            onPick={pickCategory}
          />
        </div>

        <div className="catalog-filter-panel hidden lg:block">
          <PriceFilterContent
            priceMax={priceMax}
            priceRange={priceRange}
            onPriceRangeChange={onPriceRangeChange}
          />
        </div>

        <div className="catalog-filter-panel catalog-filter-panel--bestsellers">
          <div className="filter-heading">
            <h5 className="m-0">BEST SELLERS</h5>
          </div>
          <div className="best-product-wrapper">
            {bestSellers.map((p) => (
              <Link key={p.id} to={`/product/${p.sku || p.id}`} className="best-seller">
                <div className="best-seller-img">
                  <img src={p.imageURL || p.images?.[0]} alt="" loading="lazy" />
                </div>
                <div className="best-seller-content">
                  <div className="best-seller-stars" aria-hidden>
                    <MaskImage
                      url="https://api.iconify.design/material-symbols:star.svg"
                      size="0.85em"
                      bg="#ffc107"
                      hBg="#ffc107"
                    />
                    <span>5.0</span>
                  </div>
                  <h6 className="m-0">{p.title}</h6>
                  <p className="m-0 best-seller-price font-sans tabular-nums">₹ {p.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
