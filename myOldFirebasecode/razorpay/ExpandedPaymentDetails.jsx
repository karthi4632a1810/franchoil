import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ShoppingCart, CreditCard, MapPin, Key } from "lucide-react";

export function ExpandedPaymentDetails({ order }) {
    return (
        <div className="p-6 animate-in slide-in-from-top-2 duration-200">
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Cart Items */}
                <Card className="border-border/50 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                            <ShoppingCart className="h-4 w-4 text-green-700" />
                            Cart Items
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {order.cart?.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-4 p-3 rounded-lg bg-accent/30 border border-border/30"
                            >
                                <img
                                    src={item.imageURL}
                                    alt={item.title}
                                    className="w-14 h-14 rounded-lg object-cover border border-border/50"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground truncate">{item.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Qty {item.qty} × ₹{item.price}
                                    </p>
                                </div>
                                <div className="font-semibold text-foreground">
                                    ₹{item.qty * item.price}
                                </div>
                            </div>
                        ))}
                        {(!order.cart || order.cart.length === 0) && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No cart items
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Payment & Address Info */}
                <div className="space-y-4">
                    {/* Payment Info */}
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                                <CreditCard className="h-4 w-4 text-green-700" />
                                Payment Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 font-mono text-xs text-muted-foreground bg-accent/30 p-4 rounded-lg border border-border/30">
                                <p className="break-all">
                                    <span className="font-semibold text-foreground">Name:</span>{" "}
                                    {order?.name || "Customer"}
                                </p>
                                <p className="break-all">
                                    <span className="font-semibold text-foreground">Phone:</span>{" "}
                                    {order.phone || "N/A"}
                                </p>
                                <p className="break-all">
                                    <span className="font-semibold text-foreground">Email:</span>{" "}
                                    {order.email || "N/A"}
                                </p>
                                <p className="break-all">
                                    <span className="font-semibold text-foreground">Order:</span>{" "}
                                    {order.razorpay_order_id}
                                </p>
                                <p className="break-all">
                                    <span className="font-semibold text-foreground">Payment:</span>{" "}
                                    {order.razorpay_payment_id}
                                </p>
                                <p>
                                    <span className="font-semibold text-foreground">Amount:</span>{" "}
                                    ₹{(order.amount / 100).toFixed(2)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address */}
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                                <MapPin className="h-4 w-4 text-green-700" />
                                Delivery Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm leading-relaxed bg-accent/30 p-4 rounded-lg border border-border/30 text-muted-foreground">
                                {order.selectedAddress ? (
                                    <>
                                        <p>{order.selectedAddress.line1}</p>
                                        {(order.selectedAddress.line2 || order.selectedAddress.area) && (
                                            <p>{order.selectedAddress.area || order.selectedAddress.line2}</p>
                                        )}
                                        <p>
                                            {order.selectedAddress.street}, {order.selectedAddress.city}
                                        </p>
                                        <p>
                                            {order.selectedAddress.state} – {order.selectedAddress.pincode}
                                        </p>
                                        <p>{order.selectedAddress.country}</p>
                                    </>
                                ) : (
                                    <p className="text-center py-2">No address provided</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Signature */}
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                                <Key className="h-4 w-4 text-green-700" />
                                Razorpay Signature
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="font-mono text-[10px] break-all text-muted-foreground bg-accent/30 p-4 rounded-lg border border-border/30">
                                {order.razorpay_signature || "N/A"}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}