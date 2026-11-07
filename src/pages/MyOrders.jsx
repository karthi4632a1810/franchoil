import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronRight } from "lucide-react";
import { phpApi, phpRoutes } from "../lib/phpApi";
import RequireAuth from "../components/RequireAuth";
import { fulfillmentLabel } from "../utils/fulfillmentStatus";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function getOrderPrimaryItem(order) {
  const sources = [order?.items, order?.cart, order?.line_items];
  for (const src of sources) {
    if (Array.isArray(src) && src.length > 0) return src[0];
  }
  return null;
}

function getOrderItemsCount(order) {
  const sources = [order?.items, order?.cart, order?.line_items];
  for (const src of sources) {
    if (Array.isArray(src) && src.length > 0) return src.length;
  }
  return 0;
}

function resolveOrderImage(primaryItem) {
  const raw =
    primaryItem?.imageURL ||
    primaryItem?.imageUrl ||
    primaryItem?.image ||
    primaryItem?.images?.[0] ||
    "";

  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const normalized = raw.startsWith("/") ? raw : `/${raw}`;

  // Backward compatibility: old test data used /product-images/product-images/*
  // but localhost serves product assets from /images/product/* (public folder).
  if (normalized.startsWith("/product-images/product-images/")) {
    return normalized.replace("/product-images/product-images/", "/images/product/");
  }

  return normalized;
}

function resolveOrderProductName(primaryItem) {
  return (
    primaryItem?.title ||
    primaryItem?.name ||
    primaryItem?.product_name ||
    primaryItem?.sku ||
    "Product"
  );
}

function MyOrdersContent() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await phpApi.get(phpRoutes.ordersMine, { params: { pageSize: 200 } });
        if (!mounted) return;
        setOrders(Array.isArray(data?.orders) ? data.orders : []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.error || e?.message || "Could not load orders.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 poppins py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 m-0">My orders</h1>
          <p className="text-slate-600 mt-2 m-0 text-sm">
            Sign in on any device to see orders linked to your account.
          </p>
        </div>

        {loading && <p className="text-slate-500 text-sm">Loading your orders…</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-sm">
            <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-700 font-medium m-0">No orders yet</p>
            <p className="text-slate-500 text-sm mt-2 m-0">When you complete a purchase while signed in, it will appear here.</p>
            <Link
              to="/products"
              className="inline-block mt-6 px-6 py-2.5 rounded-lg bg-[var(--p-c)] text-white text-sm font-medium hover:opacity-90"
            >
              Shop products
            </Link>
          </div>
        )}

        <ul className="space-y-3 list-none m-0 p-0">
          {orders.map((order) => {
            const total = Number(order.totalAmount) || 0;
            const orderLabel = order.id ? `#${order.id}` : "";
            const primaryItem = getOrderPrimaryItem(order);
            const productImage = resolveOrderImage(primaryItem);
            const productName = resolveOrderProductName(primaryItem);
            const itemCount = getOrderItemsCount(order);
            return (
              <li key={order.id}>
                <Link
                  to={`/my-orders/${order.id}`}
                  className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-[var(--p-c)] hover:shadow-md transition-all"
                >
                  <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {productImage ? (
                      <img src={productImage} alt={productName} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="m-0 font-semibold text-slate-900">
                      {orderLabel ? `Order ${orderLabel}` : "Order"}
                    </p>
                    <p className="m-0 text-sm text-slate-700 truncate">
                      {productName}
                      {itemCount > 1 ? ` +${itemCount - 1} more` : ""}
                    </p>
                    <p className="m-0 text-sm text-slate-500 mt-0.5">{formatDate(order.createdAt)}</p>
                    <p className="m-0 text-xs text-[var(--p-c)] font-medium mt-1">
                      {fulfillmentLabel(order.fulfillmentStatus)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <p className="m-0 font-bold text-slate-900">₹{total.toFixed(2)}</p>
                      <p className="m-0 text-xs text-slate-500">Track</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default function MyOrders() {
  return (
    <RequireAuth>
      <MyOrdersContent />
    </RequireAuth>
  );
}
