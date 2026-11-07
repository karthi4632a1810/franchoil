import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import CartItemRow from "./CartItemRow";

export default function CartPanel({
  enrichedCart,
  isMobile,
  onUpdateQty,
  onRemove,
}) {
  const isEmpty = enrichedCart.length === 0;

  return (
    <section className="dash-cart-panel poppins">
      <div className="dash-cart-panel__head">
        <h2>Your cart</h2>
        {!isEmpty && (
          <span className="dash-order__badge">
            {enrichedCart.length} item{enrichedCart.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="dash-cart-panel__body">
        {isEmpty ? (
          <div className="py-10 text-center">
            <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 mb-3" strokeWidth={1.5} />
            <p className="text-sm text-slate-600">Your cart is empty</p>
            <Link
              to="/products"
              className="inline-block mt-4 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[var(--p-c)] hover:opacity-90 transition-opacity"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <ul className="dash-order__items list-none m-0 p-0">
            {enrichedCart.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                isMobile={isMobile}
                onUpdateQty={onUpdateQty}
                onRemove={onRemove}
                qtyLocked={false}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
