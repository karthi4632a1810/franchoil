import { Search, Gift, Star } from "lucide-react";
import { shouldHideFromProductListings } from "../../utils/franchOilCart";

function productHref(sku) {
  return sku?.includes("landing") ? `/landing/${sku}` : `/product/${sku}`;
}

export default function ProductUpsell({
  products,
  prodLoading,
  search,
  onSearchChange,
  favs,
  onAddToCart,
  onToggleFav,
}) {
  const filtered = (products || []).filter((p) => !shouldHideFromProductListings(p));

  return (
    <section className="dash-products poppins">
      <div className="dash-products__head">
        <div>
          <h2>Add more products</h2>
          <p>Every order includes a complimentary surprise gift.</p>
        </div>
        <div className="dash-products__search-wrap">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Search products"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="dash-products__search"
          />
        </div>
      </div>

      {prodLoading && (
        <p className="text-sm text-slate-500 py-12 text-center">Loading products…</p>
      )}

      <div className="dash-products__grid">
        {filtered.map((p) => {
          const isFav = favs.some((f) => f.productId === (p.id ?? p.productId));
          return (
            <article key={p.id} className="dash-product-card">
              <a href={productHref(p.sku)} className="dash-product-card__media">
                <span className="dash-product-card__tag">
                  <Gift className="w-3 h-3 inline -mt-0.5 mr-0.5" strokeWidth={2} />
                  Gift
                </span>
                {p.imageURL ? (
                  <img src={p.imageURL} alt={p.title} />
                ) : (
                  <span className="text-3xl opacity-40">🛍️</span>
                )}
              </a>
              <div className="dash-product-card__body">
                <a href={productHref(p.sku)}>
                  <h3 className="dash-product-card__title">{p.title}</h3>
                </a>
                <p className="dash-product-card__price">₹{p.price}</p>
                <div className="dash-product-card__actions">
                  <button
                    type="button"
                    onClick={() => onToggleFav(p)}
                    className={`dash-product-card__fav ${isFav ? "is-active" : ""}`}
                    aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Star className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddToCart(p)}
                    className="dash-product-card__add"
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!prodLoading && filtered.length === 0 && (
        <p className="text-sm text-slate-500 py-10 text-center">No products found.</p>
      )}
    </section>
  );
}
