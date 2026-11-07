import { useState, useCallback, useRef } from "react";
import { Truck, CheckCircle2, XCircle, Loader2, MapPin } from "lucide-react";
import { phpApi, phpRoutes } from "../../lib/phpApi";

/**
 * Delhivery pincode delivery check widget.
 * Shows whether a pincode is serviceable, COD availability, etc.
 */
export default function PincodeServiceabilityCheck() {
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // null | { serviceable, cod, district, ... }
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  const checkPincode = useCallback(async (code) => {
    const digits = code.replace(/\D/g, "");
    if (digits.length !== 6) {
      setResult(null);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const { data } = await phpApi.get(phpRoutes.delhiveryServiceability, {
        params: { pincode: digits },
      });

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Could not check serviceability");
      }
    } catch (e) {
      setError(e?.response?.data?.error || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(val);
    setResult(null);
    setError("");

    // Debounce: auto-check after 6 digits with a small delay
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length === 6) {
      debounceRef.current = setTimeout(() => checkPincode(val), 350);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    checkPincode(pincode);
  };

  return (
    <div className="mt-4 p-4 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-blue-50/40 to-white">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pincode}
            onChange={handleChange}
            placeholder="Enter delivery pincode"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
            aria-label="Delivery pincode"
          />
        </div>
        <button
          type="submit"
          disabled={pincode.length !== 6 || loading}
          className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Truck className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Check</span>
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className={`mt-3 p-3 rounded-xl text-sm ${result.serviceable
          ? "bg-emerald-50 border border-emerald-200"
          : "bg-red-50 border border-red-200"}`}
        >
          {result.serviceable ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                Delivery available to {result.pincode}
                {result.district ? ` (${result.district})` : ""}
              </div>
              <div className="flex flex-wrap gap-2 ml-6">
                {result.prepaid && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    ✓ Online Payment
                  </span>
                )}
                {result.cod && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                    ✓ Cash on Delivery
                  </span>
                )}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                  Est. 3–6 business days
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 font-bold text-red-700">
              <XCircle className="w-4.5 h-4.5 text-red-500" />
              Sorry, delivery is not available to {result.pincode}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-2 text-xs text-red-600 font-medium m-0">{error}</p>
      )}
    </div>
  );
}
