import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "./useAuth";

export default function useRequireCustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isCustomerLoggedIn } = useAuth();

  const requireCustomerLogin = useCallback(
    (returnTo) => {
      if (isCustomerLoggedIn) return true;
      const target =
        returnTo ??
        `${location.pathname}${location.search}${location.hash || ""}`;
      navigate("/login", { state: { returnTo: target } });
      return false;
    },
    [isCustomerLoggedIn, location.pathname, location.search, location.hash, navigate]
  );

  return { isCustomerLoggedIn, requireCustomerLogin };
}
