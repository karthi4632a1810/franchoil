const readCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift() || null;
  return null;
};

export const getMetaAttributionPayload = () => {
  if (typeof window === "undefined") {
    return {};
  }

  return {
    fbp: readCookie("_fbp"),
    fbc: readCookie("_fbc"),
    client_user_agent: navigator.userAgent || "",
    event_source_url: window.location.href,
  };
};

