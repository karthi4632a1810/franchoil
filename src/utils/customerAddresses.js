import { formToSelectedAddress, selectedAddressToForm } from "./checkoutAddressStorage.js";

export function newAddressId() {
  return `addr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Detect legacy single address vs address book on user or raw JSON. */
export function parseAddressBook(source) {
  if (!source || typeof source !== "object") {
    return { addresses: [], selectedId: null };
  }

  if (Array.isArray(source.addresses)) {
    const addresses = source.addresses
      .filter((a) => a && typeof a === "object")
      .map((a) => normalizeSavedAddress(a))
      .filter((a) => a.line1 || a.city || a.pincode);

    let selectedId = source.selectedAddressId || source.selectedId || null;
    if (selectedId && !addresses.some((a) => a.id === selectedId)) {
      selectedId = addresses[0]?.id || null;
    }
    if (!selectedId && addresses.length > 0) {
      selectedId = addresses[0].id;
    }

    return { addresses, selectedId };
  }

  if (looksLikeAddress(source)) {
    const addr = normalizeSavedAddress({ ...source, id: source.id || newAddressId() });
    return { addresses: [addr], selectedId: addr.id };
  }

  return { addresses: [], selectedId: null };
}

export function parseAddressBookFromUser(user) {
  if (!user) return { addresses: [], selectedId: null };

  if (Array.isArray(user.addresses)) {
    if (user.addresses.length > 0) {
      return parseAddressBook({
        addresses: user.addresses,
        selectedAddressId: user.selectedAddressId,
      });
    }
    if (user.address && looksLikeAddress(user.address)) {
      return parseAddressBook(user.address);
    }
    return { addresses: [], selectedId: null };
  }

  return parseAddressBook(user.address);
}

export function getSelectedSavedAddress(book) {
  const { addresses, selectedId } = book || {};
  if (!addresses?.length) return null;
  if (selectedId) {
    const found = addresses.find((a) => a.id === selectedId);
    if (found) return found;
  }
  return addresses[0];
}

export function formatAddressSummary(addr) {
  if (!addr) return "";
  const parts = [
    addr.line1,
    addr.line2,
    addr.landmark,
    addr.city,
    addr.state,
    addr.pincode,
  ].filter(Boolean);
  return parts.join(", ");
}

function looksLikeAddress(obj) {
  return Boolean(
    String(obj.line1 || obj.address || "").trim() ||
      String(obj.city || "").trim() ||
      String(obj.pincode || "").trim()
  );
}

export function normalizeSavedAddress(row = {}) {
  const type = String(row.address_type || row.label || "Home").trim() || "Home";
  return {
    id: String(row.id || "").trim() || newAddressId(),
    label: type,
    address_type: type,
    name: String(row.name || "").trim(),
    phone: String(row.phone || "").replace(/\D/g, "").slice(0, 10),
    email: String(row.email || "").trim().toLowerCase(),
    line1: String(row.line1 || row.address || "").trim(),
    line2: String(row.line2 || row.area || "").trim(),
    street: String(row.street || row.landmark || "").trim(),
    landmark: String(row.landmark || row.street || "").trim(),
    area: String(row.area || row.line2 || "").trim(),
    city: String(row.city || "").trim(),
    state: String(row.state || "").trim(),
    pincode: String(row.pincode || row.zipcode || "").trim(),
    country: String(row.country || "India").trim() || "India",
  };
}

/** Merge checkout form into address book (new or update). */
function resolveAddressId(editingId, formId) {
  const raw = editingId || formId || "";
  if (!raw || String(raw).startsWith("draft-")) {
    return newAddressId();
  }
  return raw;
}

export function upsertAddressFromForm(book, form, { editingId = null, setSelected = true } = {}) {
  const record = {
    ...formToSelectedAddress(form),
    id: resolveAddressId(editingId, form.addressId),
    label: form.address_type || "Home",
    address_type: form.address_type || "Home",
  };

  let addresses = [...(book?.addresses || [])];
  const idx = addresses.findIndex((a) => a.id === record.id);

  if (idx >= 0) {
    addresses[idx] = { ...addresses[idx], ...record };
  } else {
    addresses.push(record);
  }

  const selectedId = setSelected ? record.id : book?.selectedId || record.id;

  return { addresses, selectedId };
}

export function buildAuthMeAddressPayload(form, user, meta = {}) {
  const book = parseAddressBookFromUser(user);
  const merged = upsertAddressFromForm(book, form, {
    editingId: meta.editingId || null,
    setSelected: true,
  });

  return {
    name: String(form.name || user?.name || "").trim(),
    phone: String(form.phone || user?.phone || "").replace(/\D/g, "").slice(0, 10),
    email: String(form.email || user?.email || "").trim().toLowerCase(),
    addresses: merged.addresses,
    selectedAddressId: meta.selectedId || merged.selectedId,
  };
}

export function addressBookToInitialForm(book, profile = {}) {
  const selected = getSelectedSavedAddress(book);
  if (selected) {
    const form = selectedAddressToForm(selected, profile);
    return { ...form, addressId: selected.id };
  }
  return selectedAddressToForm({}, profile);
}
