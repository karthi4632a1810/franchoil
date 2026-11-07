import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function RequireAuth({ children }) {
  const { user, loading, isCustomerLoggedIn } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center poppins">
        <span className="web_loading" />
      </div>
    );
  }

  if (user?.isAdmin) {
    return <Navigate to="/admin/panel" replace />;
  }

  if (!user || user.isAnonymous || !isCustomerLoggedIn) {
    return <Navigate to="/login" replace state={{ returnTo: location.pathname }} />;
  }

  return children;
}
