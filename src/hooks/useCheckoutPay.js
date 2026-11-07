import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { firestore } from "../firebase/config";
import useAuth from "./useAuth";
import { phpApi, phpRoutes } from "../lib/phpApi";

/* 🔑 TEST KEY (replace when client gives real one) */
const RAZORPAY_KEY_ID = "rzp_live_RxNRBCo2yYi6cL";

export default function useCheckoutPay() {
    const { user } = useAuth();
    const userId = user?.uid;

    const [cart, setCart] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);

    /* ================= FETCH USER DATA ================= */
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            const ref = doc(firestore, "users", userId);
            const snap = await getDoc(ref);

            if (snap.exists()) {
                const data = snap.data();
                setCart(data.cart || []);
                setAddresses(data.addresses || []);
            }
            setLoading(false);
        };

        loadData();
    }, [userId]);

    /* ================= ADD ADDRESS ================= */
    const addAddress = async (address) => {
        const updated = [...addresses, { ...address, id: Date.now() }];
        setAddresses(updated);

        await updateDoc(doc(firestore, "users", userId), {
            addresses: updated,
        });
    };

    /* ================= TOTAL ================= */
    const subtotal = cart.reduce(
        (sum, item) => sum + item.price * item.qty,
        0
    );

    /* ================= RAZORPAY PAYMENT ================= */
    const payNow = async ({ selectedAddress, total }) => {
        if (!selectedAddress) {
            alert("Please select an address");
            return;
        }

        try {
            /* 1️⃣ CREATE ORDER */
            const { data } = await phpApi.post(phpRoutes.createOrder, { amount: total });

            if (!data.success) {
                alert("Failed to create order");
                return;
            }

            /* 2️⃣ OPEN RAZORPAY */
            const options = {
                key: "rzp_live_RxNRBCo2yYi6cL",
                amount: data.amount,
                currency: data.currency,
                name: "Franch Global",
                description: "Order Payment",
                order_id: data.order_id,

                handler: async function (response) {
                    // success path
                    await verifyPayment(response);
                    setIsClickedCheckout(false);
                },

                modal: {
                    ondismiss: function () {
                        // 👇 USER CLICKED CANCEL / CLOSED POPUP
                        setIsClickedCheckout(false);
                    },
                },

                prefill: {
                    name: customer_name,
                    email: customer_email,
                    contact: customer_phone,
                },

                theme: { color: "#16a34a" },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error(err);
            alert("Something went wrong");
        }
    };

    return {
        cart,
        addresses,
        subtotal,
        loading,
        addAddress,
        payNow, // 👈 exposed cleanly
    };
}
