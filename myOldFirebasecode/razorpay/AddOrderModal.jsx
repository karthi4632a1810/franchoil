import { useState, useEffect } from "react";
import { X, Plus, Trash2, Copy } from "lucide-react";
import { useProducts } from "../../hooks/useProducts";
import { firestore as db } from "../../firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function AddOrderModal({ isOpen, onClose, onSuccess, existingOrders = [] }) {
    const { products, loading: productsLoading } = useProducts({ onlyActive: false });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Customer details
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");

    // Address
    const [line1, setLine1] = useState("");
    const [line2, setLine2] = useState("");
    const [street, setStreet] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [pincode, setPincode] = useState("");
    const [country, setCountry] = useState("India");

    // Razorpay payment details
    const [razorpayOrderId, setRazorpayOrderId] = useState("");
    const [razorpayPaymentId, setRazorpayPaymentId] = useState("");
    const [razorpaySignature, setRazorpaySignature] = useState("");
    const [amount, setAmount] = useState("");

    // Selected products
    const [selectedProducts, setSelectedProducts] = useState([]);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            // Reset all fields
            setName("");
            setPhone("");
            setEmail("");
            setLine1("");
            setLine2("");
            setStreet("");
            setCity("");
            setState("");
            setPincode("");
            setCountry("India");
            setRazorpayOrderId("");
            setRazorpayPaymentId("");
            setRazorpaySignature("");
            setAmount("");
            setSelectedProducts([]);
            setErrors({});
        }
    }, [isOpen]);

    // Calculate total amount from selected products
    useEffect(() => {
        const total = selectedProducts.reduce((sum, item) => {
            return sum + (Number(item.price) || 0) * (Number(item.qty) || 1);
        }, 0);
        if (total > 0) {
            setAmount((total * 100).toString()); // Convert to paise
        }
    }, [selectedProducts]);

    const addProduct = () => {
        setSelectedProducts([
            ...selectedProducts,
            {
                productId: "",
                title: "",
                price: 0,
                qty: 1,
                sku: "",
                itemCode: "",
                hsn: "30039011",
                imageURL: "",
            },
        ]);
    };

    const removeProduct = (index) => {
        setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
    };

    const updateProduct = (index, field, value) => {
        const updated = [...selectedProducts];
        updated[index] = { ...updated[index], [field]: value };

        // If product is selected from dropdown, auto-fill details
        if (field === "productId" && value) {
            const product = products.find((p) => p.id === value);
            if (product) {
                updated[index] = {
                    ...updated[index],
                    productId: product.id,
                    title: product.title || "",
                    price: product.price || 0,
                    sku: product.sku || "",
                    itemCode: product.sku || "",
                    hsn: product.hsn || "30039011",
                    imageURL: product.imageURL || "",
                };
            }
        }

        setSelectedProducts(updated);
    };

    // Copy customer, address and products from an existing order (Razorpay fields left for you to fill)
    const copyFromOrder = (order) => {
        if (!order) return;
        const addr = order.selectedAddress || order.address || {};
        setName(order.name || order.userName || "");
        setPhone(order.phone || order.userPhone || "");
        setEmail(order.email || order.userEmail || "");
        setLine1(addr.line1 || addr.address || "");
        setLine2(addr.line2 || "");
        setStreet(addr.street || "");
        setCity(addr.city || "");
        setState(addr.state || "");
        setPincode(addr.pincode || "");
        setCountry(addr.country || "India");
        const cart = order.cart || order.items || [];
        setSelectedProducts(
            cart.map((item) => ({
                productId: item.productId || item.id || "",
                title: item.title || item.name || "",
                price: Number(item.price) || 0,
                qty: Number(item.qty) || 1,
                sku: item.sku || item.itemCode || "",
                itemCode: item.sku || item.itemCode || "",
                hsn: item.hsn || "30039011",
                imageURL: item.imageURL || "",
            }))
        );
        // Leave Razorpay fields empty so you enter the new order's payment details
        setRazorpayOrderId("");
        setRazorpayPaymentId("");
        setRazorpaySignature("");
        setErrors({});
    };

    const validate = () => {
        const newErrors = {};

        if (!name.trim()) newErrors.name = "Name is required";
        if (!phone.trim()) newErrors.phone = "Phone is required";
        if (!email.trim()) newErrors.email = "Email is required";
        if (!line1.trim()) newErrors.line1 = "Address line 1 is required";
        if (!city.trim()) newErrors.city = "City is required";
        if (!state.trim()) newErrors.state = "State is required";
        if (!pincode.trim()) newErrors.pincode = "Pincode is required";
        if (!razorpayOrderId.trim()) newErrors.razorpayOrderId = "Razorpay Order ID is required";
        if (!razorpayPaymentId.trim()) newErrors.razorpayPaymentId = "Razorpay Payment ID is required";
        if (!razorpaySignature.trim()) newErrors.razorpaySignature = "Razorpay Signature is required";
        if (!amount || Number(amount) <= 0) newErrors.amount = "Amount must be greater than 0";
        if (selectedProducts.length === 0) newErrors.products = "At least one product is required";

        // Validate each product
        selectedProducts.forEach((product, index) => {
            if (!product.title) newErrors[`product_${index}_title`] = "Product title is required";
            if (!product.price || product.price <= 0) newErrors[`product_${index}_price`] = "Product price is required";
            if (!product.qty || product.qty <= 0) newErrors[`product_${index}_qty`] = "Product quantity is required";
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setLoading(true);
        try {
            const orderData = {
                razorpay_order_id: razorpayOrderId.trim(),
                razorpay_payment_id: razorpayPaymentId.trim(),
                razorpay_signature: razorpaySignature.trim(),
                isValid: true, // Manual orders are marked as valid
                amount: Number(amount),
                selectedAddress: {
                    line1: line1.trim(),
                    line2: line2.trim(),
                    street: street.trim(),
                    city: city.trim(),
                    state: state.trim(),
                    pincode: pincode.trim(),
                    country: country.trim() || "India",
                },
                cart: selectedProducts.map((item) => ({
                    id: item.productId || `manual_${Date.now()}_${Math.random()}`,
                    productId: item.productId,
                    title: item.title,
                    price: Number(item.price),
                    qty: Number(item.qty),
                    sku: item.sku || item.itemCode,
                    itemCode: item.sku || item.itemCode,
                    hsn: item.hsn || "30039011",
                    imageURL: item.imageURL || "",
                })),
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                photoURL: "",
                createdAt: serverTimestamp(),
            };

            // Save to payments collection using razorpay_order_id as document ID
            await setDoc(doc(db, "payments", razorpayOrderId.trim()), orderData);

            alert("Order added successfully!");
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error("Error adding order:", error);
            alert("Failed to add order: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold text-foreground">Add Manual Order</h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Copy from existing order */}
                    {existingOrders.length > 0 && (
                        <div className="space-y-2 p-4 rounded-lg bg-muted/50 border border-border/50">
                            <Label className="flex items-center gap-2 text-foreground font-medium">
                                <Copy className="h-4 w-4" />
                                Copy from existing order
                            </Label>
                            <select
                                className="w-full max-w-md px-3 py-2 border rounded-md bg-background"
                                defaultValue=""
                                onChange={(e) => {
                                    const idx = e.target.value;
                                    if (idx === "") return;
                                    copyFromOrder(existingOrders[Number(idx)]);
                                    e.target.value = "";
                                }}
                            >
                                <option value="">— Select an order to copy customer, address & products —</option>
                                {existingOrders.map((ord, idx) => {
                                    const label = ord.razorpay_order_id || ord.id || `Order ${idx + 1}`;
                                    const name = ord.name || ord.userName || "—";
                                    const email = ord.email || ord.userEmail || "";
                                    const amt = typeof ord.amount === "number"
                                        ? (ord.amount > 1000 ? (ord.amount / 100).toFixed(2) : ord.amount.toFixed(2))
                                        : "—";
                                    return (
                                        <option key={ord.razorpay_order_id || ord.id || idx} value={idx}>
                                            {name} • {email} • ₹{amt} ({label})
                                        </option>
                                    );
                                })}
                            </select>
                            <p className="text-xs text-muted-foreground">
                                Razorpay Order ID, Payment ID and Signature stay empty so you can enter the new order details.
                            </p>
                        </div>
                    )}

                    {/* Customer Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                            Customer Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Customer Name"
                                    className={errors.name ? "border-red-500" : ""}
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="phone">Phone *</Label>
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Phone Number"
                                    className={errors.phone ? "border-red-500" : ""}
                                />
                                {errors.phone && (
                                    <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email Address"
                                    className={errors.email ? "border-red-500" : ""}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                            Delivery Address
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Label htmlFor="line1">Address Line 1 *</Label>
                                <Input
                                    id="line1"
                                    value={line1}
                                    onChange={(e) => setLine1(e.target.value)}
                                    placeholder="Street Address"
                                    className={errors.line1 ? "border-red-500" : ""}
                                />
                                {errors.line1 && (
                                    <p className="text-sm text-red-500 mt-1">{errors.line1}</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="line2">Address Line 2</Label>
                                <Input
                                    id="line2"
                                    value={line2}
                                    onChange={(e) => setLine2(e.target.value)}
                                    placeholder="Apartment, Suite, etc."
                                />
                            </div>
                            <div>
                                <Label htmlFor="street">Street</Label>
                                <Input
                                    id="street"
                                    value={street}
                                    onChange={(e) => setStreet(e.target.value)}
                                    placeholder="Street Name"
                                />
                            </div>
                            <div>
                                <Label htmlFor="city">City *</Label>
                                <Input
                                    id="city"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="City"
                                    className={errors.city ? "border-red-500" : ""}
                                />
                                {errors.city && (
                                    <p className="text-sm text-red-500 mt-1">{errors.city}</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="state">State *</Label>
                                <Input
                                    id="state"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    placeholder="State"
                                    className={errors.state ? "border-red-500" : ""}
                                />
                                {errors.state && (
                                    <p className="text-sm text-red-500 mt-1">{errors.state}</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="pincode">Pincode *</Label>
                                <Input
                                    id="pincode"
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value)}
                                    placeholder="Pincode"
                                    className={errors.pincode ? "border-red-500" : ""}
                                />
                                {errors.pincode && (
                                    <p className="text-sm text-red-500 mt-1">{errors.pincode}</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="country">Country</Label>
                                <Input
                                    id="country"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    placeholder="Country"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Products */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-lg font-semibold text-foreground">Products</h3>
                            <Button
                                type="button"
                                onClick={addProduct}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add Product
                            </Button>
                        </div>
                        {errors.products && (
                            <p className="text-sm text-red-500">{errors.products}</p>
                        )}

                        {selectedProducts.map((product, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-12 gap-4 p-4 border rounded-lg bg-accent/30"
                            >
                                <div className="col-span-12 md:col-span-4">
                                    <Label>Select Product</Label>
                                    <select
                                        value={product.productId}
                                        onChange={(e) => updateProduct(index, "productId", e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                    >
                                        <option value="">-- Select Product --</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.title} - ₹{p.price}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-12 md:col-span-3">
                                    <Label>Product Name *</Label>
                                    <Input
                                        value={product.title}
                                        onChange={(e) => updateProduct(index, "title", e.target.value)}
                                        placeholder="Product Name"
                                        className={errors[`product_${index}_title`] ? "border-red-500" : ""}
                                    />
                                    {errors[`product_${index}_title`] && (
                                        <p className="text-sm text-red-500 mt-1">
                                            {errors[`product_${index}_title`]}
                                        </p>
                                    )}
                                </div>
                                <div className="col-span-6 md:col-span-2">
                                    <Label>Price *</Label>
                                    <Input
                                        type="number"
                                        value={product.price}
                                        onChange={(e) =>
                                            updateProduct(index, "price", e.target.value)
                                        }
                                        placeholder="Price"
                                        min="0"
                                        step="0.01"
                                        className={errors[`product_${index}_price`] ? "border-red-500" : ""}
                                    />
                                    {errors[`product_${index}_price`] && (
                                        <p className="text-sm text-red-500 mt-1">
                                            {errors[`product_${index}_price`]}
                                        </p>
                                    )}
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <Label>Quantity *</Label>
                                    <Input
                                        type="number"
                                        value={product.qty}
                                        onChange={(e) => updateProduct(index, "qty", e.target.value)}
                                        placeholder="Qty"
                                        min="1"
                                        className={errors[`product_${index}_qty`] ? "border-red-500" : ""}
                                    />
                                    {errors[`product_${index}_qty`] && (
                                        <p className="text-sm text-red-500 mt-1">
                                            {errors[`product_${index}_qty`]}
                                        </p>
                                    )}
                                </div>
                                <div className="col-span-2 md:col-span-1 flex items-end">
                                    <Button
                                        type="button"
                                        onClick={() => removeProduct(index)}
                                        variant="destructive"
                                        size="sm"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Razorpay Payment Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                            Razorpay Payment Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="razorpayOrderId">Razorpay Order ID *</Label>
                                <Input
                                    id="razorpayOrderId"
                                    value={razorpayOrderId}
                                    onChange={(e) => setRazorpayOrderId(e.target.value)}
                                    placeholder="order_xxxxx"
                                    className={errors.razorpayOrderId ? "border-red-500" : ""}
                                />
                                {errors.razorpayOrderId && (
                                    <p className="text-sm text-red-500 mt-1">
                                        {errors.razorpayOrderId}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="razorpayPaymentId">Razorpay Payment ID *</Label>
                                <Input
                                    id="razorpayPaymentId"
                                    value={razorpayPaymentId}
                                    onChange={(e) => setRazorpayPaymentId(e.target.value)}
                                    placeholder="pay_xxxxx"
                                    className={errors.razorpayPaymentId ? "border-red-500" : ""}
                                />
                                {errors.razorpayPaymentId && (
                                    <p className="text-sm text-red-500 mt-1">
                                        {errors.razorpayPaymentId}
                                    </p>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="razorpaySignature">Razorpay Signature *</Label>
                                <Input
                                    id="razorpaySignature"
                                    value={razorpaySignature}
                                    onChange={(e) => setRazorpaySignature(e.target.value)}
                                    placeholder="Payment Signature"
                                    className={errors.razorpaySignature ? "border-red-500" : ""}
                                />
                                {errors.razorpaySignature && (
                                    <p className="text-sm text-red-500 mt-1">
                                        {errors.razorpaySignature}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="amount">Total Amount (₹) *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={amount ? (Number(amount) / 100).toFixed(2) : ""}
                                    onChange={(e) =>
                                        setAmount((Number(e.target.value) * 100).toString())
                                    }
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className={errors.amount ? "border-red-500" : ""}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Amount in rupees (auto-calculated from products)
                                </p>
                                {errors.amount && (
                                    <p className="text-sm text-red-500 mt-1">{errors.amount}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button className="text-white" type="submit" disabled={loading}>
                            {loading ? "Adding..." : "Add Order"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

