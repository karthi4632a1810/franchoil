import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Tag,
  Check,
  Truck,
  MessageCircle
} from "lucide-react";
import { setAnonymousCart } from "../../utils/localStorageUser";

export default function ModernCartDrawer({
  isOpen,
  onClose,
  cartItems = [],
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) {
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  // Discount calculation
  const discountAmount = appliedPromo ? Math.round(subtotal * 0.1) : 0;
  const deliveryFee = subtotal >= 499 || subtotal === 0 ? 0 : 50;
  const finalTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

  // Free shipping threshold ₹499
  const freeShippingThreshold = 499;
  const progressToFreeShipping = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError("");
    if (promoCode.trim().toUpperCase() === "FRANCH10") {
      setAppliedPromo("FRANCH10");
    } else {
      setPromoError("Invalid code. Try using FRANCH10 for 10% off.");
    }
  };

  const handleProceedToCheckout = () => {
    setIsCheckingOut(true);
    // Sync to persistent cart for checkout page
    try {
      const formatted = cartItems.map((item) => ({
        id: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        productId: item.id,
        sku: item.id,
        title: item.name,
        subTitle: item.selectedSize || "",
        description: "",
        price: item.price,
        imageURL: item.mainImage,
        qty: item.quantity,
        createdAt: new Date().toISOString()
      }));
      setAnonymousCart(formatted);
    } catch (e) {
      console.warn("Could not sync to anonymous cart:", e);
    }

    setTimeout(() => {
      setIsCheckingOut(false);
      onClose();
      navigate("/checkout");
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#145C34]" />
              <h3 className="font-display font-extrabold text-lg text-gray-900">
                Your Ayurvedic Bag ({cartItems.reduce((a, b) => a + b.quantity, 0)})
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Bar */}
          <div className="bg-emerald-50/70 p-4 border-b border-emerald-100">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#145C34]" />
                {amountNeededForFreeShipping === 0 ? (
                  <span>Congratulations! You get FREE Express Delivery!</span>
                ) : (
                  <span>
                    Add ₹{amountNeededForFreeShipping} more for{" "}
                    <span className="text-[#145C34] underline">FREE Shipping</span>
                  </span>
                )}
              </div>
              <span>{progressToFreeShipping}%</span>
            </div>
            <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#145C34] h-full rounded-full transition-all duration-500"
                style={{ width: `${progressToFreeShipping}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-gray-100">
            {orderSuccess ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#145C34] flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="font-display font-bold text-xl text-gray-900">
                  Order Successfully Simulated!
                </h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  Thank you for testing the modern Franch UI redesign. All items have been recorded in this frontend prototype.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOrderSuccess(false);
                    onClose();
                  }}
                  className="bg-[#145C34] text-white px-6 py-2.5 rounded-xl font-bold text-xs"
                >
                  Continue Browsing
                </button>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-display font-bold text-lg text-gray-800">
                  Your Bag is Empty
                </h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Explore our 25-year Ayurvedic legacy formulations for natural pain relief and daily wellness.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#145C34] text-white px-6 py-2.5 rounded-xl font-bold text-xs"
                >
                  Explore Products
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={`${item.id}-${item.selectedSize}`} className="py-4 flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gray-50 p-1 flex-shrink-0 border border-gray-100">
                    <img
                      src={item.mainImage}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-gray-900 leading-snug truncate">
                        {item.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id, item.selectedSize)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded w-fit mt-0.5">
                      {item.selectedSize}
                    </p>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity selector */}
                      <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(
                              item.id,
                              item.selectedSize,
                              Math.max(1, item.quantity - 1)
                            )
                          }
                          className="px-2 py-1 text-gray-500 hover:text-gray-800"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(
                              item.id,
                              item.selectedSize,
                              item.quantity + 1
                            )
                          }
                          className="px-2 py-1 text-gray-500 hover:text-gray-800"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-[#145C34]">
                          ₹{item.price * item.quantity}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-gray-400 block">
                            (₹{item.price} each)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {cartItems.length > 0 && !orderSuccess && (
            <div className="p-5 border-t border-gray-100 bg-[#FBFDFB] space-y-4">
              {/* Promo Code Input */}
              {appliedPromo ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                    <Tag className="w-3.5 h-3.5 text-[#145C34]" />
                    <span>Coupon {appliedPromo} applied (-10%)</span>
                  </div>
                  <button
                    onClick={() => setAppliedPromo(null)}
                    className="text-xs text-red-500 hover:underline font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="space-y-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Coupon code (e.g. FRANCH10)"
                      className="flex-1 bg-white border border-gray-200 text-xs px-3 py-2 rounded-xl uppercase font-mono tracking-wider focus:outline-none focus:border-[#145C34]"
                    />
                    <button
                      type="submit"
                      className="bg-gray-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-[11px] text-red-600 font-medium">{promoError}</p>
                  )}
                </form>
              )}

              {/* Price Calculation Rows */}
              <div className="space-y-1.5 text-xs text-gray-600 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{subtotal}</span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount (10%)</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="font-bold text-emerald-700 uppercase">FREE</span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total Amount</span>
                  <span className="text-base text-[#145C34]">₹{finalTotal}</span>
                </div>
              </div>

              {/* Dual Action: Proceed to Checkout & WhatsApp Direct Order */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={isCheckingOut}
                  onClick={handleProceedToCheckout}
                  className="w-full bg-[#145C34] hover:bg-[#0E4325] text-white py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-[#145C34]/25 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  {isCheckingOut ? (
                    <span>Opening Secure Checkout...</span>
                  ) : (
                    <>
                      <span>Proceed to Checkout • ₹{finalTotal}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <a
                  href={`https://wa.me/919841854321?text=${encodeURIComponent(
                    `Hello Franch Ayurveda, I would like to order:\n` +
                    cartItems.map((i) => `• ${i.name} (${i.selectedSize}) x ${i.quantity} = ₹${i.price * i.quantity}`).join('\n') +
                    `\nTotal Amount: ₹${finalTotal}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Order via WhatsApp (1-Tap Direct)</span>
                </a>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#145C34]" />
                <span>100% Genuine Direct from FM Group • COD Available</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
