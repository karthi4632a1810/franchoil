import { useState } from "react";
import useTelegram from "./useTelegram";
import { phpApi, phpRoutes } from "../lib/phpApi";
import { getMetaAttributionPayload } from "../utils/metaAttribution";

export const useCheckout = ({
    amount,
    cart,
    setIsClickedCheckout,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { sendData } = useTelegram();
    const isMagicCheckoutEnabled = String(
        import.meta.env.VITE_RAZORPAY_MAGIC_ENABLED ?? "false"
    ).trim().toLowerCase() === "true";

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const targetSrc = isMagicCheckoutEnabled
                ? "https://checkout.razorpay.com/v1/magic-checkout.js"
                : "https://checkout.razorpay.com/v1/checkout.js";

            const existingScripts = Array.from(
                document.querySelectorAll('script[src*="checkout.razorpay.com/v1/"]')
            );
            const hasTargetScript = existingScripts.some((s) => s.src === targetSrc);
            if (window.Razorpay && hasTargetScript) {
                return resolve(true);
            }
            existingScripts.forEach((s) => s.remove());
            try {
                delete window.Razorpay;
            } catch {
                window.Razorpay = undefined;
            }

            const script = document.createElement("script");
            script.src = targetSrc;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const formatIndiaContact = (phone) => {
        const digits = String(phone || "").replace(/\D/g, "");
        if (digits.length === 10) return `+91${digits}`;
        if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
        const t = String(phone || "").trim();
        if (!t) return "";
        return t.startsWith("+") ? t : digits ? `+${digits}` : t;
    };

    /**
     * @param {{ name: string, email: string, phone: string, address: object }} checkout
     * @param {object} [profile] optional extra profile from auth
     */
    const doCheckout = async (checkout, profile = {}) => {
        setLoading(true);
        setError("");

        const customerName = String(checkout?.name || profile?.name || "").trim();
        const customerEmail = String(checkout?.email || profile?.email || "").trim();
        const customerPhone = String(checkout?.phone || profile?.phone || "").trim();
        const selectedAddress = {
            ...(checkout?.address || {}),
            name: customerName,
        };

        try {
            const latestOrderId = window.localStorage.getItem("latestOrderId");
            const contactE164 = customerPhone ? formatIndiaContact(customerPhone) : "";

            const prefill = {};
            if (customerName) prefill.name = customerName;
            if (customerEmail) prefill.email = customerEmail;
            if (contactE164) prefill.contact = contactE164;

            const loaded = await loadRazorpayScript();
            if (!loaded) {
                setError("Razorpay SDK failed to load");
                setIsClickedCheckout(false);
                return false;
            }

            const { data } = await phpApi.post(phpRoutes.createOrder, {
                amount,
                receipt: latestOrderId,
                cart: cart || [],
                magic_checkout: isMagicCheckoutEnabled,
                selectedAddress,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
            });

            if (!data.success) {
                setError("Failed to create payment order");
                setIsClickedCheckout(false);
                return false;
            }

            window.localStorage.setItem("order_id", data.order_id);

            try {
                const orderData = {
                    status: "init",
                    orderId: latestOrderId || "N/A",
                    razorpayOrderId: data.order_id,
                    customer: {
                        name: customerName || "N/A",
                        email: customerEmail || "N/A",
                        phone: customerPhone || "N/A",
                    },
                    address: selectedAddress,
                    products: cart?.map((item) => ({
                        name: item.title || item.name || "N/A",
                        quantity: item.qty || 1,
                        price: item.price || 0,
                        total: (item.price || 0) * (item.qty || 1),
                    })) || [],
                    totalAmount: amount,
                    currency: "INR",
                };
                await sendData(orderData, "🛒 New Order Initiated");
            } catch (telegramError) {
                console.error("Failed to send Telegram notification (init):", telegramError);
            }

            const orderDescription = (cart && cart.length > 0)
                ? cart.map((i) => `${i.title || i.name || "Item"} x ${i.qty || 1}`).join(", ")
                : "Order Payment";

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_RxNRBCo2yYi6cL",
                amount: data.amount,
                currency: data.currency,
                name: "Franch Global",
                description: orderDescription,
                order_id: data.order_id,

                handler: async function (response) {
                    let savedPhpOrderId = "";
                    try {
                        alert("Payment Successful 🎉");
                        try {
                            const verifyResponse = await phpApi.post(phpRoutes.verifyPayment, {
                                ...response,
                                profile: {
                                    name: customerName,
                                    email: customerEmail,
                                    phone: customerPhone,
                                    ...profile,
                                },
                                name: customerName,
                                email: customerEmail,
                                phone: customerPhone,
                                customer_name: customerName,
                                customer_email: customerEmail,
                                customer_phone: customerPhone,
                                amount: data.amount,
                                orderId: latestOrderId,
                                selectedAddress,
                                cart,
                                meta: getMetaAttributionPayload(),
                            });

                            if (verifyResponse.data.success) {
                                if (verifyResponse.data.phpOrderId) {
                                    savedPhpOrderId = String(verifyResponse.data.phpOrderId);
                                    try {
                                        window.localStorage.setItem(
                                            "latestOrderId",
                                            savedPhpOrderId
                                        );
                                    } catch (_) {}
                                }
                                try {
                                    const orderData = {
                                        status: "paid",
                                        orderId: latestOrderId || "N/A",
                                        razorpayOrderId: response.razorpay_order_id,
                                        razorpayPaymentId: response.razorpay_payment_id,
                                        customer: {
                                            name: customerName,
                                            email: customerEmail,
                                            phone: customerPhone,
                                        },
                                        address: selectedAddress,
                                        products: cart?.map((item) => ({
                                            name: item.title || item.name || "N/A",
                                            quantity: item.qty || 1,
                                            price: item.price || 0,
                                            total: (item.price || 0) * (item.qty || 1),
                                        })) || [],
                                        totalAmount: amount,
                                        currency: "INR",
                                    };
                                    await sendData(orderData, "✅ Payment Successful");
                                } catch (telegramError) {
                                    console.error("Failed to send Telegram notification (paid):", telegramError);
                                }
                            } else {
                                console.warn("Payment verify returned success=false", verifyResponse.data);
                            }
                        } catch (verifyError) {
                            console.error("Payment verify request failed:", verifyError);
                        }
                    } finally {
                        setIsClickedCheckout(false);
                        const thankYouId = encodeURIComponent(
                            savedPhpOrderId ||
                                window.localStorage.getItem("latestOrderId") ||
                                latestOrderId ||
                                ""
                        );
                        window.location.assign(
                            thankYouId ? `/thank-you?orderId=${thankYouId}` : "/thank-you"
                        );
                    }
                },
                modal: {
                    ondismiss: function () {
                        alert("Payment cancelled. Please try again.");
                        setIsClickedCheckout(false);
                    },
                },

                ...(isMagicCheckoutEnabled
                    ? {
                        one_click_checkout: true,
                        show_coupons: true,
                        ...(Object.keys(prefill).length > 0 ? { prefill, customer: { ...prefill } } : {}),
                        readonly: { name: true, email: true, contact: true },
                        notes: {
                            address_line1: selectedAddress?.line1 || "",
                            address_line2: selectedAddress?.line2 || "",
                            area: selectedAddress?.area || "",
                            city: selectedAddress?.city || "",
                            state: selectedAddress?.state || "",
                            pincode: selectedAddress?.pincode || "",
                            country: selectedAddress?.country || "India",
                        },
                    }
                    : {
                        prefill: {
                            name: customerName,
                            email: customerEmail,
                            contact: contactE164 || customerPhone,
                        },
                        readonly: {
                            name: true,
                            email: true,
                            contact: true,
                        },
                    }),

                theme: {
                    color: "#16a34a",
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();

            return true;
        } catch (err) {
            console.error(err);
            setError("Payment initiation failed");
            setIsClickedCheckout(false);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { doCheckout, loading, error };
};
