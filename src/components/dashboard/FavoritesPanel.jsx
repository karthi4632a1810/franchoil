import { Heart, X } from "lucide-react";
import CachedImage from "../CachedImage.jsx";

function productHref(sku) {
  return sku?.includes("landing") ? `/landing/${sku}` : `/product/${sku}`;
}

export default function FavoritesPanel({ favs, productMap, onToggleFav }) {
  if (favs.length === 0) return null;

  return (
    <section className="dash-products-favs p-4 bg-white rounded-xl border border-[#d4e5da] poppins">
      <h2 className="text-base font-semibold text-[#125700] flex items-center gap-2 mb-3">
        <Heart className="w-4 h-4 text-[#007e3c] fill-[#007e3c]" />
        Saved items
      </h2>
      <div className="dashboard-favs-scroll">
        {favs.map((f) => {
          const prod = productMap.get(f.productId);
          const title = prod?.title || f.title || f.productId;
          const img = prod?.imageURL || f.imageURL || "";
          const sku = prod?.sku;
            const product = prod || { id: f.productId, productId: f.productId, title, imageURL: img, sku };

          return (
            <div key={f.id} className="dashboard-fav-chip relative">
              <button
                type="button"
                onClick={() => onToggleFav(product)}
                className="absolute top-1 right-1 p-1 rounded-full bg-white shadow text-slate-400 hover:text-red-500 z-10"
                aria-label="Remove"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <a href={sku ? productHref(sku) : "#"}>
                {img ? (
                  <CachedImage src={img} alt="" className="w-full aspect-square object-cover rounded-lg mb-2" />
                ) : (
                  <div className="w-full aspect-square rounded-lg bg-emerald-50 grid place-items-center text-xl mb-2">
                    ★
                  </div>
                )}
                <p className="text-xs font-semibold text-[var(--t-c-d1)] line-clamp-2 leading-tight" title={title}>
                  {title}
                </p>
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}
