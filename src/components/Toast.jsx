import { useEffect } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose, message]);

  const isSuccess = type === "success";
  const isError = type === "error";

  return (
    <div
      className="fixed top-5 left-1/2 z-[99999999999] -translate-x-1/2 flex items-center gap-2.5 px-5 py-3 rounded-full shadow-lg poppins text-sm font-medium text-white animate-in fade-in slide-in-from-top-2"
      style={{
        background: isSuccess
          ? "linear-gradient(135deg, #15803d 0%, #166534 100%)"
          : isError
            ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
            : "#374151",
        minWidth: "min(92vw, 320px)",
        maxWidth: "min(92vw, 480px)",
      }}
      role="status"
      aria-live="polite"
    >
      {isSuccess && <CheckCircle2 className="w-5 h-5 shrink-0" strokeWidth={2.25} aria-hidden />}
      {isError && <AlertCircle className="w-5 h-5 shrink-0" strokeWidth={2.25} aria-hidden />}
      <span className="leading-snug">{message}</span>
    </div>
  );
}
