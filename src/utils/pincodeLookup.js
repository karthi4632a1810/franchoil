import { phpApi, phpRoutes } from "../lib/phpApi";

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
];

export function normalizeIndianState(apiState) {
  const raw = String(apiState || "").trim();
  if (!raw) return "";

  const compact = (s) => s.toLowerCase().replace(/\s+/g, "");

  const exact = INDIAN_STATES.find((s) => s.toLowerCase() === raw.toLowerCase());
  if (exact) return exact;

  const loose = INDIAN_STATES.find((s) => compact(s) === compact(raw));
  if (loose) return loose;

  return raw;
}

function parsePostalPincodePayload(json) {
  const block = Array.isArray(json) ? json[0] : json;
  if (!block || String(block.Status || "") !== "Success") return null;

  const offices = block.PostOffice;
  if (!Array.isArray(offices) || offices.length === 0) return null;

  const first = offices[0];
  const district = String(first.District || "").trim();
  const state = normalizeIndianState(first.State);
  const city =
    district ||
    String(first.Region || first.Division || first.Block || "").trim();

  if (!city && !state) return null;

  return {
    city,
    state,
    district,
  };
}

async function fetchFromPostalApiDirect(digits) {
  const res = await fetch(`https://api.postalpincode.in/pincode/${digits}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return parsePostalPincodePayload(json);
}

/**
 * @param {string} pincode
 * @returns {Promise<{ city: string, state: string, district?: string } | null>}
 */
export async function fetchLocationByPincode(pincode) {
  const digits = String(pincode || "").replace(/\D/g, "");
  if (digits.length !== 6) return null;

  try {
    const { data } = await phpApi.get(`${phpRoutes.pincodeLookup}/${digits}`);
    if (data?.success && (data.city || data.state)) {
      return {
        city: String(data.city || "").trim(),
        state: normalizeIndianState(data.state),
        district: String(data.district || "").trim(),
      };
    }
  } catch {
    // Backend proxy failed — try public API from the browser.
  }

  try {
    return await fetchFromPostalApiDirect(digits);
  } catch {
    return null;
  }
}
