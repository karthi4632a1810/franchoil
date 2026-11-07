import { Link } from "react-router-dom";
import { ShoppingCart, Truck, Lock, Loader2, CreditCard } from "lucide-react";
import CartItemRow from "./CartItemRow";
import MaskImage from "../../tools/MaskImage";
import visa from "/images/product/productpage/visa.webp";
import upi from "/images/product/productpage/upi.webp";
import master from "/images/product/productpage/master.webp";
import google_pay from "/images/product/productpage/google_pay.webp";
import paypal from "/images/product/productpage/paypal.webp";

const paymentIcons = [visa, master, paypal, google_pay, upi];

export default function OrderSummary({
  enrichedCart,
  totalCost,
  isMobile,
  isClickedCheckout,
  checkoutLoading,
  onCheckout,
  onUpdateQty,
  onRemove,
  compact = false,
  showItems = true,
  paymentOnly = false,
}) {
  const isEmpty = enrichedCart.length === 0;
  const listItems = paymentOnly ? false : showItems;

  return (
    <aside
      className={`dash-order poppins ${paymentOnly ? "dash-order--payment" : ""}`}
    >
      <div className="dash-order__head">
        <div className="flex items-center justify-between gap-2">
          <h2>{paymentOnly ? "Payment" : "Your order"}</h2>
          {!isEmpty && (
            <span className="dash-order__badge">
              {enrichedCart.length} item{enrichedCart.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {(isEmpty && paymentOnly) || !isEmpty ? (
          <p className="dash-order__hint">
            {isEmpty && paymentOnly
              ? "Add items to your cart to see your total and pay."
              : paymentOnly
                ? "Your total is ready — pay securely below."
                : "Review items below, then proceed to secure payment."}
          </p>
        ) : null}
      </div>

      <div className="dash-order__body">
        {listItems && (
          <ul className="dash-order__items list-none m-0 p-0">
            {isEmpty ? (
              <li className="py-10 text-center">
                <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 mb-3" strokeWidth={1.5} />
                <p className="text-sm text-slate-600">Your cart is empty</p>
                <Link
                  to="/products"
                  className="inline-block mt-4 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[var(--p-c)] hover:opacity-90 transition-opacity"
                >
                  Browse products
                </Link>
              </li>
            ) : (
              enrichedCart.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  isMobile={isMobile}
                  onUpdateQty={onUpdateQty}
                  onRemove={onRemove}
                  qtyLocked={false}
                />
              ))
            )}
          </ul>
        )}

        {isEmpty && paymentOnly && (
          <div className="dash-order__empty">
            <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-3" strokeWidth={1.5} />
            <p className="text-sm font-medium text-slate-700">Nothing to pay yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Pick products from the list below or browse our store.
            </p>
            <Link
              to="/products"
              className="inline-block mt-4 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[var(--p-c)] hover:opacity-90 transition-opacity"
            >
              Browse products
            </Link>
            <div className="dash-order__payments dash-order__payments--empty">
              {paymentIcons.map((src) => (
                <img key={src} src={src} alt="" />
              ))}
            </div>
            <p className="dash-order__footer">Secured by Razorpay</p>
          </div>
        )}

        {!isEmpty && (
          <>
            <div className="dash-order__gift" role="note">
              <span className="dash-order__gift-ribbon">Bonus unlocked</span>
              <span className="dash-order__gift-spark dash-order__gift-spark--1" aria-hidden>✦</span>
              <span className="dash-order__gift-spark dash-order__gift-spark--2" aria-hidden>✦</span>
              <span className="dash-order__gift-spark dash-order__gift-spark--3" aria-hidden>✦</span>
              <span className="dash-order__gift-icon" aria-hidden>
                <MaskImage
                  size="1.65em"
                  hBg="#dc2626"
                  bg="#dc2626"
                  url="https://api.iconify.design/meteor-icons:gift.svg"
                />
              </span>
              <div className="dash-order__gift-body">
                <div className="dash-order__gift-head">
                  <strong className="animate-blink-scale">Surprise gift included!</strong>
                  <span className="dash-order__gift-badge">FREE</span>
                </div>
                <span className="dash-order__gift-sub">
                  Exclusive complimentary add-on — a little extra joy in every box!
                </span>
              </div>
            </div>

            <div className="dash-order__row">
              <span className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[var(--p-c)]" strokeWidth={1.75} />
                Home delivery
              </span>
              <b>Free</b>
            </div>

            <div className="dash-order__total">
              <span>Total</span>
              <span className="price">₹{totalCost}</span>
            </div>

            <div className="dash-order__payments">
              {paymentIcons.map((src) => (
                <img key={src} src={src} alt="" />
              ))}
            </div>

            <button
              type="button"
              onClick={onCheckout}
              disabled={checkoutLoading || isEmpty}
              className={`dash-order__pay ${isClickedCheckout ? "pointer-events-none opacity-70" : ""}`}
            >
              {isClickedCheckout ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" strokeWidth={2} />
                  Pay now · ₹{totalCost}
                </>
              )}
            </button>

            <p className="dash-order__footer">Secured by Razorpay</p>
          </>
        )}
      </div>
    </aside>
  );
}
