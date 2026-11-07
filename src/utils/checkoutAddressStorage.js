const STORAGE_KEY = "franch_saved_checkout";

export const ADDRESS_TYPES = ["Home", "Work", "Other"];

export const PINCODE_LENGTH_MESSAGE = "Please enter a 6-digit pincode";

export const emptyCheckoutForm = () => ({
  addressId: "",
  name: "",
  phone: "",
  email: "",
  address_type: "Home",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
});

export function formToSelectedAddress(form) {
  const f = form || {};
  return {
    name: String(f.name || "").trim(),
    phone: String(f.phone || "").replace(/\D/g, "").slice(0, 10),
    email: String(f.email || "").trim().toLowerCase(),
    line1: String(f.line1 || "").trim(),
    line2: String(f.line2 || "").trim(),
    street: String(f.landmark || f.street || "").trim(),
    landmark: String(f.landmark || "").trim(),
    area: String(f.line2 || "").trim(),
    city: String(f.city || "").trim(),
    state: String(f.state || "").trim(),
    pincode: String(f.pincode || "").trim(),
    country: String(f.country || "India").trim() || "India",
    address_type: String(f.address_type || "Home").trim(),
  };
}

export function selectedAddressToForm(addr = {}, profile = {}) {
  const base = emptyCheckoutForm();
  return {
    ...base,
    addressId: addr.id || base.addressId,
    name: addr.name || profile.name || base.name,
    phone: addr.phone || profile.phone || base.phone,
    email: addr.email || profile.email || base.email,
    address_type: addr.address_type || base.address_type,
    line1: addr.line1 || base.line1,
    line2: addr.line2 || addr.area || base.line2,
    landmark: addr.landmark || addr.street || base.landmark,
    city: addr.city || base.city,
    state: addr.state || base.state,
    pincode: addr.pincode || base.pincode,
    country: addr.country || base.country,
  };
}

export function getSavedCheckoutAddress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return selectedAddressToForm(parsed);
  } catch {
    return null;
  }
}

export function saveCheckoutAddressToLocal(form) {
  try {
    const payload = formToSelectedAddress(form);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...payload,
        phone: String(form.phone || "").trim(),
        email: String(form.email || "").trim(),
        updatedAt: new Date().toISOString(),
      })
    );
    return payload;
  } catch (e) {
    console.error("saveCheckoutAddressToLocal:", e);
    return formToSelectedAddress(form);
  }
}

export function validateCheckoutForm(form) {
  const errors = {};
  const name = String(form.name || "").trim();
  const phone = String(form.phone || "").replace(/\D/g, "");
  const email = String(form.email || "").trim();
  const line1 = String(form.line1 || "").trim();
  const city = String(form.city || "").trim();
  const state = String(form.state || "").trim();
  const pincode = String(form.pincode || "").replace(/\D/g, "");

  if (!name) errors.name = "Name is required";
  if (phone.length !== 10) errors.phone = "Enter a valid 10-digit mobile number";
  if (!email) {
    errors.email = "Email is required for order confirmation";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address";
  }
  if (!line1) errors.line1 = "Address line 1 is required";
  if (!city) errors.city = "City is required";
  if (!state) errors.state = "State is required";
  if (pincode.length !== 6) errors.pincode = PINCODE_LENGTH_MESSAGE;

  return errors;
}
