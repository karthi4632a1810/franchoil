import { useEffect, useState } from "react";
import { MapPin, Package, Truck, Clock, CheckCircle2, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { phpApi, phpRoutes } from "../../lib/phpApi";
import { delhiveryStatusToFulfillment, fulfillmentLabel } from "../../utils/fulfillmentStatus";

function formatScanTime(timeStr) {
  if (!timeStr) return "";
  const d = new Date(timeStr);
  if (Number.isNaN(d.getTime())) return timeStr;
  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Determine icon + color based on scan status text */
function getScanIcon(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("delivered")) return { icon: CheckCircle2, color: "text-emerald-600" };
  if (s.includes("out for delivery") || s === "ofd") return { icon: Truck, color: "text-blue-600" };
  if (s.includes("in transit") || s.includes("dispatched")) return { icon: Truck, color: "text-indigo-600" };
  if (s.includes("picked up") || s.includes("pickup")) return { icon: Package, color: "text-amber-600" };
  return { icon: MapPin, color: "text-slate-500" };
}

/**
 * Real-time tracking component that fetches Delhivery tracking data
 * and displays a scan-by-scan journey log.
 */
export default function DelhiveryLiveTracking({ waybill }) {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllScans, setShowAllScans] = useState(false);

  const fetchTracking = async () => {
    if (!waybill) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await phpApi.get(phpRoutes.delhiveryTrack, {
        params: { waybill },
      });
      if (data.success && data.found) {
        setTracking(data);
      } else {
        setError(data.message || "Tracking data not available yet");
      }
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to fetch tracking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waybill]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-6 text-slate-500 text-sm">
        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        Fetching live tracking from Delhivery…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500 m-0">{error}</p>
        <button
          onClick={fetchTracking}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      </div>
    );
  }

  if (!tracking) return null;

  const fulfillment = delhiveryStatusToFulfillment(tracking.status);
  const scans = Array.isArray(tracking.scans) ? tracking.scans : [];
  const visibleScans = showAllScans ? scans : scans.slice(0, 5);

  return (
    <div className="space-y-0">
      {/* Status Summary Card */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 m-0 mb-2 uppercase tracking-wide">
              Live tracking
            </h2>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-xs ${
                fulfillment === "delivered"
                  ? "bg-emerald-100 text-emerald-800"
                  : fulfillment === "out_for_delivery"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800"
              }`}>
                {fulfillment === "delivered" ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Truck className="w-3.5 h-3.5" />
                )}
                {fulfillmentLabel(fulfillment)}
              </span>
            </div>
          </div>

          <button
            onClick={fetchTracking}
            className="text-xs text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 transition"
            title="Refresh tracking"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Meta info row */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tracking.currentLocation && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="m-0 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Location</p>
              <p className="m-0 mt-1 text-sm font-semibold text-slate-800">{tracking.currentLocation}</p>
            </div>
          )}
          {tracking.origin && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="m-0 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Origin</p>
              <p className="m-0 mt-1 text-sm font-semibold text-slate-800">{tracking.origin}</p>
            </div>
          )}
          {tracking.destination && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="m-0 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Destination</p>
              <p className="m-0 mt-1 text-sm font-semibold text-slate-800">{tracking.destination}</p>
            </div>
          )}
          {tracking.estimatedDelivery && (
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="m-0 text-[10px] font-bold text-blue-400 uppercase tracking-wider">Est. Delivery</p>
              <p className="m-0 mt-1 text-sm font-bold text-blue-800">{formatScanTime(tracking.estimatedDelivery)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Scan Journey Timeline */}
      {scans.length > 0 && (
        <div className="p-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider m-0 mb-4">
            Shipment journey ({scans.length} updates)
          </h3>
          <ol className="list-none m-0 p-0 space-y-0">
            {visibleScans.map((scan, idx) => {
              const { icon: Icon, color } = getScanIcon(scan.status || scan.activity);
              const isFirst = idx === 0;
              const isLast = idx === visibleScans.length - 1;

              return (
                <li key={idx} className="flex gap-3.5 relative">
                  {/* Vertical line */}
                  {!isLast && (
                    <span
                      className="absolute left-[11px] top-[26px] w-0.5 bg-slate-200"
                      style={{ height: "calc(100% - 6px)" }}
                    />
                  )}

                  {/* Dot / Icon */}
                  <div className={`shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                    isFirst ? "bg-emerald-100" : "bg-slate-100"
                  }`}>
                    <Icon className={`w-3.5 h-3.5 ${isFirst ? "text-emerald-600" : color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-5 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className={`m-0 text-sm ${isFirst ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                          {scan.activity || scan.status || "Update"}
                        </p>
                        {scan.location && (
                          <p className="m-0 mt-0.5 text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {scan.location}
                          </p>
                        )}
                        {scan.remarks && scan.remarks !== scan.activity && (
                          <p className="m-0 mt-0.5 text-xs text-slate-400 italic">{scan.remarks}</p>
                        )}
                      </div>
                      {scan.time && (
                        <span className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatScanTime(scan.time)}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {scans.length > 5 && (
            <button
              onClick={() => setShowAllScans(!showAllScans)}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer bg-transparent border-none p-0 mt-1"
            >
              {showAllScans ? "Show less" : `Show all ${scans.length} updates`}
            </button>
          )}
        </div>
      )}

      {/* External tracking link */}
      {tracking.trackingUrl && (
        <div className="px-6 pb-6">
          <a
            href={tracking.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition"
          >
            <ExternalLink className="w-4 h-4" />
            View on Delhivery website
          </a>
        </div>
      )}
    </div>
  );
}
