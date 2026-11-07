import { Link } from "react-router-dom";
import { ShieldCheck, Truck } from "lucide-react";
import logo from "/images/logo.webp";

export default function DashboardHeader() {
  return (
    <header className="dashboard-header sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link to="/" className="shrink-0 bg-white/95 rounded-lg px-3 py-1.5 shadow-md">
            <img className="h-9 sm:h-10 w-auto object-contain" src={logo} alt="Franch Global" />
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="trust-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Secure
            </span>
            <span className="trust-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold">
              <Truck className="w-3.5 h-3.5" />
              Free Delivery
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
