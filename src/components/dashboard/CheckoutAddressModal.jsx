import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Lock, Loader2, Truck, MapPin, Plus, Pencil, Check } from "lucide-react";
import "../../css/checkoutAddressModal.css";
import {
  ADDRESS_TYPES,
  emptyCheckoutForm,
  PINCODE_LENGTH_MESSAGE,
  selectedAddressToForm,
  validateCheckoutForm,
} from "../../utils/checkoutAddressStorage";
import { formatAddressSummary } from "../../utils/customerAddresses";
import {
  INDIAN_STATES,
  fetchLocationByPincode,
} from "../../utils/pincodeLookup";
import { phpApi, phpRoutes } from "../../lib/phpApi";
import visa from "/images/product/productpage/visa.webp";
import upi from "/images/product/productpage/upi.webp";
import master from "/images/product/productpage/master.webp";
import google_pay from "/images/product/productpage/google_pay.webp";
import paypal from "/images/product/productpage/paypal.webp";

const paymentIcons = [visa, master, paypal, google_pay, upi];

export default function CheckoutAddressModal({
  isOpen,
  onClose,
  initialForm,
  savedAddresses = [],
  initialSelectedId = null,
  accountSync = false,
  onSaveToAccount,
  totalCost,
  loading,
  onConfirm,
}) {
  const [form, setForm] = useState(emptyCheckoutForm);
  const [errors, setErrors] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [addressMode, setAddressMode] = useState("select");
  const [saveLoading, setSaveLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const formSectionRef = useRef(null);
  const [pincodeHint, setPincodeHint] = useState("");
  const [serviceabilityHint, setServiceabilityHint] = useState(null); // { ok: bool, text: string }
  const pincodeRequestRef = useRef(0);
  const formRef = useRef(form);

  const savedAddressKey = useMemo(
    () => savedAddresses.map((a) => a.id).join(","),
    [savedAddresses]
  );

  const listAddresses = useMemo(() => savedAddresses, [savedAddresses]);

  const hasPersistedSaved = savedAddresses.length > 0;

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    if (isOpen) {
      const nextForm = { ...emptyCheckoutForm(), ...initialForm };
      setForm(nextForm);
      const firstId =
        initialSelectedId ||
        (savedAddresses.length > 0 ? savedAddresses[0]?.id : null) ||
        null;
      setSelectedId(firstId);
      setAddressMode("select");
      if (firstId && savedAddresses.length > 0) {
        const picked = savedAddresses.find((a) => a.id === firstId);
        if (picked) {
          setForm({
            ...selectedAddressToForm(picked, {
              name: nextForm.name,
              phone: nextForm.phone,
              email: nextForm.email,
            }),
            addressId: picked.id,
          });
        }
      }
      setErrors({});
      setPincodeHint("");
      setServiceabilityHint(null);
      setPincodeLoading(false);
    }
  }, [isOpen, initialForm, initialSelectedId, savedAddressKey, savedAddresses]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.classList.add("checkout-modal-open");
    document.body.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("checkout-modal-open");
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    const digits = String(form.pincode || "").replace(/\D/g, "");
    if (digits.length !== 6) {
      setPincodeLoading(false);
      if (digits.length < 6) { setPincodeHint(""); setServiceabilityHint(null); }
      return;
    }

    const requestId = ++pincodeRequestRef.current;
    const timer = window.setTimeout(async () => {
      setPincodeLoading(true);
      setPincodeHint("");
      setServiceabilityHint(null);

      const location = await fetchLocationByPincode(digits);
      if (requestId !== pincodeRequestRef.current) return;

      setPincodeLoading(false);

      if (!location?.city && !location?.state) {
        const current = formRef.current;
        const hasManual =
          String(current.city || "").trim() && String(current.state || "").trim();
        if (hasManual) {
          setPincodeHint(
            "Auto-fill unavailable — please confirm city and state."
          );
        } else {
          setPincodeHint("");
          setErrors((prevErr) => ({
            ...prevErr,
            pincode:
              "Could not auto-fill city/state. Enter them manually — we deliver across India.",
          }));
        }
        return;
      }


      setForm((prev) => ({
        ...prev,
        city: location.city || prev.city,
        state: location.state || prev.state,
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.pincode;
        delete next.city;
        delete next.state;
        return next;
      });
      setPincodeHint(
        `Auto-filled: ${location.city || ""}${location.city && location.state ? ", " : ""}${location.state || ""}`
      );

      // Delhivery serviceability check (informational, does not block checkout)
      try {
        const { data: svc } = await phpApi.get(phpRoutes.delhiveryServiceability, {
          params: { pincode: digits },
        });
        if (requestId !== pincodeRequestRef.current) return;
        if (svc?.success) {
          if (svc.serviceable) {
            const codText = svc.cod ? " · COD available" : "";
            setServiceabilityHint({ ok: true, text: `✅ Delivery available to ${digits}${codText}` });
          } else {
            setServiceabilityHint({ ok: false, text: `⚠️ Delivery may not be available to ${digits} — we will contact you to arrange.` });
          }
        } else {
          setServiceabilityHint(null);
        }
      } catch {
        setServiceabilityHint(null);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [form.pincode]);

  const handlePincodeChange = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setField("pincode", digits);
    setPincodeHint("");
    setServiceabilityHint(null);

    if (digits.length > 0 && digits.length < 6) {
      setErrors((prev) => ({
        ...prev,
        pincode: PINCODE_LENGTH_MESSAGE,
      }));
      return;
    }

    setErrors((prev) => {
      if (prev.pincode !== PINCODE_LENGTH_MESSAGE) return prev;
      const next = { ...prev };
      delete next.pincode;
      return next;
    });
  };

  const handlePincodeBlur = () => {
    const digits = String(form.pincode || "").replace(/\D/g, "");
    if (digits.length > 0 && digits.length < 6) {
      setErrors((prev) => ({
        ...prev,
        pincode: PINCODE_LENGTH_MESSAGE,
      }));
    }
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const showFormFields = addressMode === "edit" || addressMode === "new";

  function selectSavedAddress(addr, { keepFormHidden = true } = {}) {
    const profile = {
      name: addr.name || form.name,
      phone: addr.phone || form.phone,
      email: addr.email || form.email,
    };
    setSelectedId(addr.id);
    if (keepFormHidden) {
      setAddressMode("select");
    }
    setForm({
      ...selectedAddressToForm(addr, profile),
      addressId: addr.id,
    });
    setErrors({});
  }

  useEffect(() => {
    if (!isOpen || savedAddresses.length === 0 || addressMode !== "select") return;
    const id = selectedId || form.addressId;
    if (id && savedAddresses.some((a) => a.id === id)) return;
    const pick =
      savedAddresses.find((a) => a.id === initialSelectedId) ||
      savedAddresses[savedAddresses.length - 1];
    if (pick) {
      selectSavedAddress(pick, { keepFormHidden: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync list after Save
  }, [savedAddressKey, isOpen, addressMode]);

  const goToSelectMode = () => {
    setAddressMode("select");
    setErrors({});
    const id = selectedId || form.addressId;
    if (id) {
      const addr = listAddresses.find((a) => a.id === id);
      if (addr) {
        selectSavedAddress(addr, { keepFormHidden: true });
      }
    }
  };

  const startNewAddress = () => {
    setSelectedId(null);
    setAddressMode("new");
    setForm({
      ...emptyCheckoutForm(),
      name: form.name,
      phone: form.phone,
      email: form.email,
      addressId: "",
    });
    setErrors({});
    window.requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const editSelectedAddress = () => {
    const id = selectedId || form.addressId;
    const addr = listAddresses.find((a) => a.id === id);
    if (addr) {
      selectSavedAddress(addr, { keepFormHidden: false });
    }
    setAddressMode("edit");
    window.requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const formSectionTitle =
    addressMode === "new"
      ? "Add new address"
      : addressMode === "edit"
        ? "Edit address"
        : "Address details";

  const buildConfirmMeta = () => {
    const rawId = form.addressId || selectedId || null;
    const editingId =
      rawId && !String(rawId).startsWith("draft-") ? rawId : null;
    return {
      formPayload: { ...form, addressId: editingId || "" },
      meta: {
        selectedId: editingId,
        editingId,
        saveToAccount: true,
      },
    };
  };

  const handleSaveToAccount = async () => {
    if (!onSaveToAccount) return;
    const validation = validateCheckoutForm(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const { formPayload, meta } = buildConfirmMeta();
    setSaveLoading(true);
    try {
      await onSaveToAccount(formPayload, meta);
      setAddressMode("select");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (addressMode !== "select") {
      setErrors({
        _form: "Please save your address first, then pay.",
      });
      formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (!selectedId && !String(form.line1 || "").trim()) {
      setErrors({
        _form: "Please select an address or add a new one and save it.",
      });
      return;
    }
    const validation = validateCheckoutForm(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    const { formPayload, meta } = buildConfirmMeta();
    onConfirm(formPayload, meta);
  };

  const busy = loading || saveLoading;
  const canPay =
    addressMode === "select" &&
    Boolean(selectedId || String(form.line1 || "").trim());

  if (!isOpen) return null;

  return createPortal(
    <div
      className="checkout-modal-backdrop poppins"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="checkout-modal">
        <button
          type="button"
          className="checkout-modal__close"
          onClick={onClose}
          disabled={loading}
          aria-label="Close"
        >
          <X className="w-5 h-5" strokeWidth={2} />
        </button>

        <form className="checkout-modal__form" onSubmit={handleSubmit}>
          <header className="checkout-modal__intro-card">
            <h2 id="checkout-modal-title">Delivery Address</h2>
            <p>Select an address to deliver to. Tap Edit or Add new to change details.</p>
          </header>

          <div className="checkout-modal__address-panel">
            <div className="checkout-modal__address-panel-head">
              <h3 className="checkout-modal__card-title">Select delivery address</h3>
              <p className="checkout-modal__address-panel-hint">
                {hasPersistedSaved
                  ? "Tap an address to select it for this order."
                  : "No saved addresses yet. Tap Add new, fill the form, and Save."}
              </p>
            </div>

            <div className="checkout-modal__address-actions" role="tablist" aria-label="Address actions">
              <button
                type="button"
                role="tab"
                aria-selected={addressMode === "select"}
                className={`checkout-modal__action-tab${addressMode === "select" && listAddresses.length > 0 ? " checkout-modal__action-tab--active" : ""}`}
                onClick={goToSelectMode}
                disabled={busy}
              >
                <Check className="w-4 h-4" aria-hidden />
                Select
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={addressMode === "new"}
                className={`checkout-modal__action-tab${addressMode === "new" ? " checkout-modal__action-tab--active" : ""}`}
                onClick={startNewAddress}
                disabled={busy}
              >
                <Plus className="w-4 h-4" aria-hidden />
                Add new
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={addressMode === "edit"}
                className={`checkout-modal__action-tab${addressMode === "edit" ? " checkout-modal__action-tab--active" : ""}`}
                onClick={editSelectedAddress}
                disabled={busy || (!selectedId && !form.addressId)}
              >
                <Pencil className="w-4 h-4" aria-hidden />
                Edit
              </button>
            </div>

            {listAddresses.length > 0 ? (
              <ul className="checkout-modal__saved-list">
                {listAddresses.map((addr) => {
                  const active = selectedId === addr.id;
                  const label = addr.label || addr.address_type || "Home";
                  return (
                    <li key={addr.id}>
                      <div
                        className={`checkout-modal__saved-item${active ? " checkout-modal__saved-item--active" : ""}`}
                      >
                        <button
                          type="button"
                          className="checkout-modal__saved-select"
                          onClick={() => selectSavedAddress(addr)}
                          disabled={busy}
                        >
                          <span className="checkout-modal__saved-radio" aria-hidden />
                          <span className="checkout-modal__saved-body">
                            <span className="checkout-modal__saved-label">
                              <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden />
                              {label}
                              {addr.name ? ` · ${addr.name}` : ""}
                            </span>
                            <span className="checkout-modal__saved-line">
                              {formatAddressSummary(addr)}
                            </span>
                            {addr.pincode && (
                              <span className="checkout-modal__saved-pin">
                                PIN {addr.pincode}
                              </span>
                            )}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="checkout-modal__saved-edit-btn"
                          onClick={() => {
                            selectSavedAddress(addr, { keepFormHidden: false });
                            setAddressMode("edit");
                            window.requestAnimationFrame(() => {
                              formSectionRef.current?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                            });
                          }}
                          disabled={busy}
                          aria-label={`Edit ${label} address`}
                        >
                          <Pencil className="w-4 h-4" aria-hidden />
                          Edit
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="checkout-modal__address-empty">
                No saved addresses yet. Tap <strong>Add new</strong>, then fill the form and Save.
              </p>
            )}
          </div>

          {errors._form && (
            <p className="checkout-modal__form-banner-err">{errors._form}</p>
          )}

          {showFormFields && (
          <div ref={formSectionRef} className="checkout-modal__form-section">
            <h3 className="checkout-modal__form-section-title">{formSectionTitle}</h3>
          <div className="checkout-modal__cards-row">
            <div className="checkout-modal__card">
              <h3 className="checkout-modal__card-title">Contact Details</h3>
              <div className="checkout-modal__grid checkout-modal__grid--2">
                <div className="checkout-modal__field">
                  <label htmlFor="co-name">Full Name</label>
                  <input
                    id="co-name"
                    className="checkout-modal__input"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="Enter full name"
                    autoComplete="name"
                  />
                  {errors.name && <p className="checkout-modal__err">{errors.name}</p>}
                </div>

                <div className="checkout-modal__field">
                  <label htmlFor="co-phone">Phone Number</label>
                  <input
                    id="co-phone"
                    className="checkout-modal__input"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) =>
                      setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="10-digit mobile"
                    autoComplete="tel"
                  />
                  {errors.phone && <p className="checkout-modal__err">{errors.phone}</p>}
                </div>
              </div>

              <div className="checkout-modal__field">
                <label htmlFor="co-email">Email</label>
                <input
                  id="co-email"
                  className="checkout-modal__input"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <p className="checkout-modal__help">
                  Order confirmation will be sent to this email.
                </p>
                {errors.email && <p className="checkout-modal__err">{errors.email}</p>}
              </div>

              <div className="checkout-modal__field">
                <label htmlFor="co-type">Address Type</label>
                <select
                  id="co-type"
                  className="checkout-modal__input checkout-modal__select"
                  value={form.address_type}
                  onChange={(e) => setField("address_type", e.target.value)}
                >
                  {ADDRESS_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="checkout-modal__card">
              <h3 className="checkout-modal__card-title">Location</h3>
              <div className="checkout-modal__grid checkout-modal__grid--2">
                <div className="checkout-modal__field">
                  <label htmlFor="co-city">City</label>
                  <input
                    id="co-city"
                    className="checkout-modal__input"
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                    placeholder="Enter city"
                    autoComplete="address-level2"
                  />
                  {errors.city && <p className="checkout-modal__err">{errors.city}</p>}
                </div>

                <div className="checkout-modal__field">
                  <label htmlFor="co-state">State</label>
                  <select
                    id="co-state"
                    className="checkout-modal__input checkout-modal__select"
                    value={form.state}
                    onChange={(e) => setField("state", e.target.value)}
                    autoComplete="address-level1"
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                    {form.state &&
                      !INDIAN_STATES.includes(form.state) && (
                        <option value={form.state}>{form.state}</option>
                      )}
                  </select>
                  {errors.state && <p className="checkout-modal__err">{errors.state}</p>}
                </div>
              </div>

              <div className="checkout-modal__field">
                <label htmlFor="co-pincode">Pincode</label>
                <div className="checkout-modal__pincode-wrap">
                  <input
                    id="co-pincode"
                    className="checkout-modal__input"
                    inputMode="numeric"
                    maxLength={6}
                    value={form.pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    onBlur={handlePincodeBlur}
                    placeholder="Enter 6-digit pincode"
                    autoComplete="postal-code"
                    aria-busy={pincodeLoading}
                  />
                  {pincodeLoading && (
                    <Loader2
                      className="checkout-modal__pincode-spinner"
                      aria-hidden
                    />
                  )}
                </div>
                {pincodeHint && !errors.pincode && (
                  <p className="checkout-modal__pincode-ok">{pincodeHint}</p>
                )}
                {serviceabilityHint && !errors.pincode && (
                  <p
                    className="checkout-modal__pincode-ok"
                    style={{ color: serviceabilityHint.ok ? undefined : "#b45309" }}
                  >
                    {serviceabilityHint.text}
                  </p>
                )}
                {errors.pincode && <p className="checkout-modal__err">{errors.pincode}</p>}
              </div>
            </div>
          </div>

          <div className="checkout-modal__card checkout-modal__card--wide">
            <h3 className="checkout-modal__card-title">Address Details</h3>
            <div className="checkout-modal__field">
              <label htmlFor="co-line1">Address Line 1</label>
              <textarea
                id="co-line1"
                className="checkout-modal__textarea"
                rows={3}
                value={form.line1}
                onChange={(e) => setField("line1", e.target.value)}
                placeholder="House name, door number, street"
                autoComplete="address-line1"
              />
              <p className="checkout-modal__help">
                For doorstep delivery, include your house or door number here.
              </p>
              {errors.line1 && <p className="checkout-modal__err">{errors.line1}</p>}
            </div>

            <div className="checkout-modal__grid checkout-modal__grid--2">
              <div className="checkout-modal__field">
                <label htmlFor="co-line2">Address Line 2</label>
                <input
                  id="co-line2"
                  className="checkout-modal__input"
                  value={form.line2}
                  onChange={(e) => setField("line2", e.target.value)}
                  placeholder="Area, village, apartment"
                  autoComplete="address-line2"
                />
              </div>

              <div className="checkout-modal__field">
                <label htmlFor="co-landmark">Landmark</label>
                <input
                  id="co-landmark"
                  className="checkout-modal__input"
                  value={form.landmark}
                  onChange={(e) => setField("landmark", e.target.value)}
                  placeholder="Near temple, bus stop, etc."
                />
              </div>
            </div>
          </div>

            <div className="checkout-modal__form-actions">
              <button
                type="button"
                className="checkout-modal__form-cancel"
                disabled={busy}
                onClick={goToSelectMode}
              >
                Cancel
              </button>
              {onSaveToAccount ? (
                <button
                  type="button"
                  className="checkout-modal__form-save"
                  disabled={busy}
                  onClick={handleSaveToAccount}
                >
                  {saveLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className="checkout-modal__form-save"
                  disabled={busy}
                  onClick={() => {
                    const validation = validateCheckoutForm(form);
                    if (Object.keys(validation).length > 0) {
                      setErrors(validation);
                      return;
                    }
                    goToSelectMode();
                  }}
                >
                  Save
                </button>
              )}
            </div>
          </div>
          )}

          <div className="checkout-modal__delivery-row">
            <span className="flex items-center gap-2">
              <Truck className="w-4 h-4" strokeWidth={1.75} />
              Home delivery
            </span>
            <b>Free</b>
          </div>

          <div className="checkout-modal__foot">
            <div className="checkout-modal__total-box">
              <span>Order total</span>
              <span className="checkout-modal__total-price">₹{totalCost}</span>
            </div>

            <div className="checkout-modal__payments">
              {paymentIcons.map((src) => (
                <img key={src} src={src} alt="" />
              ))}
            </div>

            <button type="submit" className="checkout-modal__pay-btn" disabled={busy || !canPay}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Opening secure payment…
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" strokeWidth={2} />
                  Pay now · ₹{totalCost}
                </>
              )}
            </button>

            <p className="checkout-modal__secure">Secured by Razorpay</p>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
