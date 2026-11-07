import { Trash2 } from "lucide-react";
import { isFranchOilSku } from "../../utils/franchOilCart";

function productHref(sku) {
  return sku?.includes("landing") ? `/landing/${sku}` : `/product/${sku}`;
}

export default function CartItemRow({ item, onUpdateQty, onRemove, qtyLocked }) {
  const title = item.title || item.productId;
  const subTitle = item.subTitle || "";
  const img = item.imageURL || "";
  const price = item.price ?? 0;
  const qty = item.qty || 1;
  const lineTotal = (price * qty).toFixed(2);
  const minQty = isFranchOilSku(item.sku)
    ? 1
    : item.sku === "franch-ayurveda-skin-soap"
      ? 4
      : item.sku === "franch-orthovin-thailam"
        ? 2
        : 1;

  return (
    <li className="dash-cart-item">
      <a href={productHref(item.sku)} className="shrink-0">
        {img ? (
          <img src={img} alt={title} className="dash-cart-item__img" />
        ) : (
          <div className="dash-cart-item__img dash-cart-item__img--empty">🛍️</div>
        )}
      </a>

      <div className="flex-1 min-w-0">
        <a href={productHref(item.sku)}>
          <h4 className="dash-cart-item__title">{title}</h4>
        </a>
        {subTitle && <p className="dash-cart-item__sub">{subTitle}</p>}

        <div className="dash-cart-item__foot">
          <div className="flex items-center gap-1">
            <div className={`dash-qty ${qtyLocked ? "opacity-50 pointer-events-none" : ""}`}>
              <button
                type="button"
                className="dash-qty__minus"
                onClick={() => onUpdateQty(item, Math.max(minQty, qty - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span>{qty}</span>
              <button
                type="button"
                className="dash-qty__plus"
                onClick={() => onUpdateQty(item, qty + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="dash-cart-item__remove"
              aria-label="Remove item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="dash-cart-item__price">
            <strong>₹{lineTotal}</strong>
            <small>
              {qty} × ₹{price}
            </small>
          </div>
        </div>
      </div>
    </li>
  );
}
