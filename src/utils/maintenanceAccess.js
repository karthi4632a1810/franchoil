const COOKIE_NAME =
  import.meta.env.VITE_MAINTENANCE_COOKIE_NAME || "site_access";
const COOKIE_SECRET = String(
  import.meta.env.VITE_MAINTENANCE_COOKIE_SECRET || ""
).trim();
const ACCESS_QUERY_KEY =
  import.meta.env.VITE_MAINTENANCE_ACCESS_QUERY || "site_access";

export function isMaintenanceEnabled() {
  return (
    String(import.meta.env.VITE_APP_MAINTENANCE ?? "false").trim().toLowerCase() ===
    "true"
  );
}

function readCookie(name) {
  if (typeof document === "undefined") return "";
  const prefix = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split(";").map((c) => c.trim());
  for (const part of parts) {
    if (part.startsWith(prefix)) {
      return decodeURIComponent(part.slice(prefix.length));
    }
  }
  return "";
}

export function setMaintenanceBypassCookie(secret = COOKIE_SECRET) {
  if (!secret || typeof document === "undefined") return false;

  const maxAge = 60 * 60 * 24 * 7; // 7 days
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";

  document.cookie = `${encodeURIComponent(COOKIE_NAME)}=${encodeURIComponent(secret)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  return true;
}

export function hasMaintenanceBypass() {
  if (!COOKIE_SECRET) return false;
  const value = readCookie(COOKIE_NAME);
  if (!value) return false;
  return value === COOKIE_SECRET;
}

/**
 * Visit `/?site_access=YOUR_SECRET` once to store the bypass cookie in the browser.
 */
export function applyMaintenanceAccessFromUrl() {
  if (typeof window === "undefined" || !COOKIE_SECRET) return false;

  const params = new URLSearchParams(window.location.search);
  const fromQuery = String(params.get(ACCESS_QUERY_KEY) || "").trim();
  if (!fromQuery || fromQuery !== COOKIE_SECRET) return false;

  setMaintenanceBypassCookie(fromQuery);

  params.delete(ACCESS_QUERY_KEY);
  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", nextUrl);

  return true;
}

if (typeof window !== "undefined") {
  applyMaintenanceAccessFromUrl();
}
