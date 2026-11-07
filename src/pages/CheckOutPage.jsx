import { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { phpApi, phpRoutes } from "../lib/phpApi";

export default function CheckOutPage() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
    });
    const [loading, setLoading] = useState(false);

    const TOTAL_AMOUNT = 999; // 🔥 change price here (₹)

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const openRazorpay = async () => {
        if (!form.name || !form.email || !form.phone) {
            alert("Please fill all details");
            return;
        }

        setLoading(true);

        try {
            // 🔥 YOUR CLOUD FUNCTION / API
            const { data } = await phpApi.post(phpRoutes.createOrder, { amount: TOTAL_AMOUNT });

            if (!data.success) throw new Error("Order creation failed");

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID, // frontend key
                amount: data.amount,
                currency: "INR",
                name: "Franch Oil",
                description: "Franch Oil Purchase",
                order_id: data.order_id,
                handler: function (response) {
                    alert("Payment Successful 🎉");
                    // console.log("Payment:", response);
                },
                prefill: {
                    name: form.name,
                    email: form.email,
                    contact: form.phone,
                },
                theme: {
                    color: "#166534", // green
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error(err);
            alert("Payment failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6 space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-green-700">
                        Franch Oil Checkout
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                        100% Secure Payment
                    </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={form.name}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={form.email}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number"
                        value={form.phone}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>

                {/* Price */}
                <div className="flex justify-between text-lg font-semibold border-t pt-4">
                    <span>Total</span>
                    <span>₹{TOTAL_AMOUNT}</span>
                </div>

                {/* Pay Button */}
                <button
                    onClick={openRazorpay}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                    <Lock className="w-4 h-4" />
                    {loading ? "Processing..." : "Pay Now"}
                </button>

                <p className="text-xs text-center text-gray-400">
                    Payments powered by Razorpay
                </p>
            </div>
        </div>
    );
}
