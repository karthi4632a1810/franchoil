import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Package, ExternalLink } from "lucide-react";
import { phpApi, phpRoutes } from "../lib/phpApi";
import RequireAuth from "../components/RequireAuth";
import OrderTimeline from "../components/orders/OrderTimeline";
import DelhiveryLiveTracking from "../components/orders/DelhiveryLiveTracking";
import { fulfillmentLabel, showCourierTracking } from "../utils/fulfillmentStatus";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function OrderTrackContent() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        let orderData = null;
        try {
          const { data } = await phpApi.get(`${phpRoutes.ordersMine}/${orderId}`);
          orderData = data?.order || null;
        } catch {
          // Fall back to public order lookup if user is not logged in or guest checkout
          const { data } = await phpApi.get(`/api/orders/public/${orderId}`);
          orderData = data?.order || null;
        }
        if (!mounted) return;
        if (!orderData) {
          setError("Order not found or tracking not available.");
        } else {
          setOrder(orderData);
        }
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.error || e?.message || "Order not found.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [orderId]);

  if (loading) {
    return <p className="text-slate-500 text-sm p-8 text-center">Loading order details…</p>;
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <p className="text-red-600 font-medium">{error || "Order not found"}</p>
        <Link to="/products" className="inline-block mt-4 text-[var(--p-c)] font-medium">
          Continue shopping
        </Link>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const total = Number(order.totalAmount || order.amount) || 0;
  const orderLabel = order.id ? `#${order.id}` : "";
  const address = order.selectedAddress || order.address || {};
  const addressLine = [
    address.line1 || address.address,
    address.line2 || address.area,
    address.city,
    address.state,
    address.pincode || address.zipcode,
    address.country || "India",
  ]
    .filter(Boolean)
    .join(", ");

  const awb = (order.awbNumber || "").trim();
  const hasDelhiveryTracking = !!awb;
  const isTrackable = showCourierTracking(order.fulfillmentStatus);
  const courierUrl = order.trackingUrl || (awb ? `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}` : "");

  return (
    <div className="min-h-screen bg-slate-50 poppins py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-[var(--p-c)] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to store
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900 m-0">
                  {orderLabel ? `Order ${orderLabel}` : "Order Details"}
                </h1>
                <p className="text-sm text-slate-500 m-0 mt-1">Placed on {formatDate(order.createdAt)}</p>
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-green-50 text-green-800 border border-green-200">
                {fulfillmentLabel(order.fulfillmentStatus)}
              </span>
            </div>
          </div>

          {/* Static Timeline */}
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800 m-0 mb-4 uppercase tracking-wide">Delivery progress</h2>
            <OrderTimeline status={order.fulfillmentStatus} />
          </div>

          {/* Delhivery AWB Banner & Link */}
          {hasDelhiveryTracking && (
            <div className="p-6 border-b border-slate-100 bg-emerald-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider m-0">Delhivery Express</p>
                  <p className="text-sm text-slate-800 m-0 mt-1">
                    AWB Tracking Number: <strong className="font-mono text-emerald-700">{awb}</strong>
                  </p>
                </div>
                {courierUrl && (
                  <a
                    href={courierUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm whitespace-nowrap"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Track on Delhivery
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Delhivery Live Tracking Scan Data */}
          {hasDelhiveryTracking && isTrackable && (
            <div className="border-b border-slate-100">
              <DelhiveryLiveTracking waybill={awb} />
            </div>
          )}

          {/* Delivery Address */}
          {addressLine && (
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xs font-bold text-slate-600 m-0 mb-2 uppercase tracking-wide">Delivery Address</h2>
              {order.customerName && <p className="text-sm font-semibold text-slate-900 m-0">{order.customerName}</p>}
              <p className="text-sm text-slate-600 m-0 mt-1">{addressLine}</p>
            </div>
          )}

          {/* Items */}
          <div className="p-6">
            <h2 className="text-sm font-semibold text-slate-800 m-0 mb-3 uppercase tracking-wide">Items ordered</h2>
            <ul className="list-none m-0 p-0 space-y-3">
              {items.map((item, idx) => (
                <li key={`${item.sku}-${idx}`} className="flex gap-3 items-center">
                  <div className="w-12 h-12 rounded bg-slate-100 shrink-0 overflow-hidden flex items-center justify-center border border-slate-200">
                    {item.imageURL ? (
                      <img src={item.imageURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="m-0 text-sm font-medium text-slate-900 truncate">{item.title}</p>
                    <p className="m-0 text-xs text-slate-500">
                      Qty {item.qty} × ₹{Number(item.price || 0).toFixed(2)}
                    </p>
                  </div>
                  <p className="m-0 text-sm font-semibold text-slate-900">₹{Number(item.total || (item.price * item.qty) || 0).toFixed(2)}</p>
                </li>
              ))}
            </ul>
            <p className="m-0 mt-4 pt-4 border-t border-slate-100 text-right font-bold text-slate-900 text-base">
              Total Paid: ₹{total.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderTrackDetail() {
  return <OrderTrackContent />;
}

