import { createContext, useContext, useEffect, useState, useCallback, useMemo, createElement } from "react";
import { phpApi, phpRoutes } from "../lib/phpApi";
import { getAnonymousUser } from "../utils/localStorageUser";

const AuthContext = createContext(null);

function apiErrorMessage(error, fallback) {
  if (error?.response?.status === 404) {
    return "Authentication service unavailable (404 Not Found). Please check backend deployment.";
  }
  const apiErr = error?.response?.data?.error || error?.response?.data?.message;
  if (typeof apiErr === "string" && apiErr.trim() && !apiErr.trim().startsWith("<")) {
    return apiErr;
  }
  return error?.message || fallback;
}

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[data-google-identity="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google SDK")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google SDK"));
    document.head.appendChild(script);
  });
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadSession = async () => {
      try {
        const { data } = await phpApi.get(phpRoutes.authMe);
        if (!mounted) return;
        if (data?.user) {
          setUser(data.user);
        } else {
          setUser(getAnonymousUser());
        }
      } catch (e) {
        if (!mounted) return;
        setError(e);
        setUser(getAnonymousUser());
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadSession();
    return () => {
      mounted = false;
    };
  }, []);

  const signInGoogle = useCallback(async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error("Google sign-in is not configured. Missing VITE_GOOGLE_CLIENT_ID.");
    }

    await loadGoogleScript();

    return new Promise((resolve, reject) => {
      // 1. Primary: Use Google OAuth2 token client popup flow for button clicks
      if (window.google?.accounts?.oauth2?.initTokenClient) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: "email profile openid",
            callback: async (tokenResponse) => {
              if (tokenResponse?.error) {
                reject(new Error(tokenResponse.error_description || tokenResponse.error || "Google sign-in was cancelled"));
                return;
              }
              if (!tokenResponse?.access_token) {
                reject(new Error("No access token returned from Google."));
                return;
              }
              try {
                const { data } = await phpApi.post(phpRoutes.authGoogle, {
                  accessToken: tokenResponse.access_token,
                });
                if (!data?.user) throw new Error("Google login failed");
                setUser(data.user);
                resolve({ user: data.user });
              } catch (e) {
                reject(new Error(apiErrorMessage(e, "Google login failed")));
              }
            },
            error_callback: (err) => {
              reject(new Error(err?.message || "Google popup error"));
            },
          });
          client.requestAccessToken({ prompt: "consent" });
          return;
        } catch (err) {
          // Fallback to ID token flow below
        }
      }

      // 2. Fallback: Google Credential flow
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            const credential = response?.credential;
            if (!credential) {
              reject(new Error("Google did not return a credential."));
              return;
            }
            try {
              const { data } = await phpApi.post(phpRoutes.authGoogle, { credential });
              if (!data?.user) throw new Error("Google login failed");
              setUser(data.user);
              resolve({ user: data.user });
            } catch (e) {
              reject(new Error(apiErrorMessage(e, "Google login failed")));
            }
          },
          auto_select: false,
        });
        window.google.accounts.id.prompt((notification) => {
          if (notification?.isNotDisplayed?.()) {
            reject(new Error("Google One-Tap is not displayed. Please check Google authorized origins."));
          }
        });
      } else {
        reject(new Error("Google SDK unavailable."));
      }
    });
  }, []);

  const signIn = useCallback(async (identifier, password) => {
    setError(null);
    let data;
    const normalized = String(identifier || "").trim();
    try {
      ({ data } = await phpApi.post(phpRoutes.authLogin, {
        email: normalized,
        loginId: normalized,
        identifier: normalized,
        password,
      }));
    } catch (e) {
      throw new Error(apiErrorMessage(e, "Login failed"));
    }
    if (!data?.user) throw new Error("Login failed");
    setUser(data.user);
    return { user: data.user };
  }, []);

  const register = useCallback(async (email, password, displayName, clientId = "") => {
    setError(null);
    let data;
    try {
      ({ data } = await phpApi.post(phpRoutes.authRegister, {
        email,
        password,
        name: displayName || "",
        clientId: String(clientId || "").trim(),
      }));
    } catch (e) {
      throw new Error(apiErrorMessage(e, "Register failed"));
    }
    if (!data?.user) throw new Error("Register failed");
    setUser(data.user);
    return data.user;
  }, []);

  const resetPassword = useCallback(async (email) => {
    setError(null);
    try {
      await phpApi.post(phpRoutes.authResetPassword, { email });
    } catch (e) {
      throw new Error(apiErrorMessage(e, "Password reset failed"));
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await phpApi.post(phpRoutes.authLogout);
    } finally {
      const anonUser = getAnonymousUser();
      setUser(anonUser);
    }
  }, []);

  const signInAnonymouslyUser = useCallback(async () => {
    const anonUser = getAnonymousUser();
    setUser((current) => (current && !current.isAnonymous ? current : anonUser));
    return anonUser;
  }, []);

  const linkAnonymousToEmail = useCallback(async (email, password) => {
    const anon = getAnonymousUser();
    const result = await phpApi.post(phpRoutes.authRegister, {
      email,
      password,
      name: anon?.name || "",
    });
    if (!result?.data?.user) {
      throw new Error("Failed to link account");
    }
    setUser(result.data.user);
    return result.data.user;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await phpApi.get(phpRoutes.authMe);
      if (data?.user) {
        setUser(data.user);
        return data.user;
      }
      setUser(getAnonymousUser());
      return getAnonymousUser();
    } catch {
      return null;
    }
  }, []);

  const isLoggedIn = !!user && !user.isAnonymous;
  const isCustomerLoggedIn = isLoggedIn && !user?.isAdmin;

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isLoggedIn,
      isCustomerLoggedIn,
      signInGoogle,
      signIn,
      register,
      resetPassword,
      logout,
      signInAnonymouslyUser,
      linkAnonymousToEmail,
      refreshUser,
    }),
    [
      user,
      loading,
      error,
      isLoggedIn,
      isCustomerLoggedIn,
      signInGoogle,
      signIn,
      register,
      resetPassword,
      logout,
      signInAnonymouslyUser,
      linkAnonymousToEmail,
    ]
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export default function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
