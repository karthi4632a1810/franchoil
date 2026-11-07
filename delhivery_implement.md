# Delhivery Full Integration Plan

## Current State

Your project already has a **partial Delhivery integration**:

| Feature | Status |
|---|---|
| API credentials in `.env` | ✅ Configured (token, client code, pickup location) |
| Create order endpoint (`/api/shipping/delhivery/create-order`) | ✅ Working in [index.php](file:///c:/KARTHIKEYAN/TVK/transvaal-franchglobal/backend-php/public/index.php#L4126-L4181) |
| Admin "Ship Now" with Delhivery carrier selector | ✅ Working in [OrdersTable.jsx](file:///c:/KARTHIKEYAN/TVK/transvaal-franchglobal/src/components/razorpay/OrdersTable.jsx#L465-L509) and [AdminDashboard.jsx](file:///c:/KARTHIKEYAN/TVK/transvaal-franchglobal/src/pages/AdminDashboard.jsx#L1615) |
| Waybill extraction + tracking URL generation | ✅ Working |
| Customer order tracking page | ✅ Basic (redirects to Delhivery website) |
| **Pincode serviceability check** | ❌ **Missing** |
| **Real-time tracking via Delhivery API** | ❌ **Missing** (only links to external site) |
| **Auto-save AWB + tracking URL to order DB** | ❌ **Missing** (manual paste required) |
| **Shipping cost estimation** | ❌ **Missing** |
| **Order cancellation via Delhivery API** | ❌ **Missing** |
| **Delhivery webhook receiver** | ❌ **Missing** |
| **NDR (Non-Delivery Report) management** | ❌ **Missing** |

## Proposed Changes

The integration is organized into **6 phases**, ordered by priority. Each phase is independent — you can approve all or pick specific ones.

---

### Phase 1: Pincode Serviceability Check (Customer-facing)

> Before checkout, validate if Delhivery can deliver to the customer's pincode and whether COD is available.

#### [NEW] Backend: Delhivery pincode serviceability proxy

**File:** [MODIFY] [index.php](file:///c:/KARTHIKEYAN/TVK/transvaal-franchglobal/backend-php/public/index.php)

Add a new endpoint: `GET /api/shipping/delhivery/serviceability?pincode=600001`

- Calls Delhivery API: `GET {DELHIVERY_BASE_URL}/c/api/pin-codes/json/?filter_codes={pincode}`
- Returns: `{ serviceable: true/false, prepaid: true/false, cod: true/false, city: "...", state: "..." }`
- Caches results in a simple PHP array/file cache (pincodes rarely change) to avoid hitting Delhivery on every keystroke

#### [MODIFY] Frontend: Pincode check in product buy-box

**Files:**
- [MODIFY] [ProductBuyBox.jsx](file:///c:/KARTHIKEYAN/TVK/transvaal-franchglobal/src/components/product/ProductBuyBox.jsx) — Add a "Check delivery availability" input field with pincode, showing ✅ Deliverable / ❌ Not serviceable + estimated delivery time
- [MODIFY] [phpApi.js](file:///c:/KARTHIKEYAN/TVK/transvaal-franchglobal/src/lib/phpApi.js) — Add `delhiveryServiceability` route
- [MODIFY] [CheckoutAddressModal.jsx](file:///c:/KARTHIKEYAN/TVK/transvaal-franchglobal/src/components/dashboard/CheckoutAddressModal.jsx) — Validate pincode serviceability before allowing checkout

**UX:**
- Small input field below the "Buy Now" button with a truck icon
- Debounced API call after 6 digits entered
- Shows: "✅ Delivery available to 600001 (Chennai)" or "❌ Sorry, delivery not available to this pincode"
- If COD available, shows "Cash on Delivery available" badge

---

### Phase 2: Auto-link AWB & Tracking After Ship Now (Admin)

> When admin clicks "Ship Now → Delhivery", auto-save the waybill + tracking URL to the order in the database (no more manual paste).

#### [MODIFY] [index.php](file:///c:/KARTHIKEYAN/TVK/transvaal-franchglobal/backend-php/public/index.php)

Update the existing `/api/shipping/delhivery/create-order` endpoint:
- After successful Delhivery order creation, **automatically update** the order in the `payments` table:
  - Set `awb_number` = waybill
  - Set `tracking_url` = `https://www.delhivery.com/track/package/{waybill}`
  - Set `fulfillment_status` = `"shipped"`
- Send the shipping confirmation email automatically (re-use the existing email template)

#### [MODIFY] [OrdersTable.jsx](file:///c:/KARTHIKEYAN/TVK/transvaal-franchglobal/src/components/razorpay/OrdersTable.jsx)

- After successful Delhivery ship, update the local order state to reflect `shipped` + AWB without requiring page reload
- Show a success toast instead of `alert()`

---

### Phase 3: Real-Time Tracking via Delhivery API (Customer-facing)

> Instead of redirecting to Delhivery's external website, show live tracking data inside the website.

#### [NEW] Backend: Tracking proxy endpoint

**File:** [MODIFY] [index.php](file:///c:/KARTHIKEYAN/TVK/transvaal-franchglobal/backend-php/public/index.php)

Add: `GET /api/shipping/delhivery/track?waybill={waybill}`

- Calls Delhivery API: `GET {DELHIVERY_BASE_URL}/api/v1/packages/json/?waybill={waybill}`
- Auth: `Authorization: Token {DELHIVERY_API_TOKEN}`
- Returns normalized tracking data:
  ```json
  {
    "waybill": "123456789",
    "status": "In Transit",
    "origin": "Chennai",
    "destination": "Mumbai",
    "estimatedDelivery": "2026-08-23",
    "currentLocation": "Hyderabad Hub",
    "scans": [
      { "time": "...", "location": "...", "status": "...", "remarks": "..." }
    ]
  }
  ```

#### [MODIFY] [OrderTrackDetail.jsx](file:///c:/KARTHIKEYAN/TVK/transvaal-franchglobal/src/pages/OrderTrackDetail.jsx)

- If order has a Delhivery waybill, fetch live tracking from our backend proxy
- Replace the static `OrderTimeline` with a **dynamic timeline** populated from Delhivery scan events
- Show current location, estimated delivery date, and a scan-by-scan journey log
- Keep the "Track on courier site" button as a fallback

#### [MODIFY] [fulfillmentStatus.js](file:///c:/KARTHIKEYAN/TVK/transvaal-franchglobal/src/utils/fulfillmentStatus.js)

- Add mapping from Delhivery status strings (`Manifested`, `In Transit`, `Out For Delivery`, `Delivered`, `RTO`) to internal fulfillment steps

---

### Phase 4: Delhivery Webhook Receiver (Auto-update order status)

> Delhivery pushes real-time status updates to your server, so orders auto-update without manual admin intervention.

#### [NEW] Backend: Webhook endpoint

**File:** [MODIFY] [index.php](file:///c:/KARTHIKEYAN/TVK/transvaal-franchglobal/backend-php/public/index.php)

Add: `POST /api/webhooks/delhivery`

- Receives Delhivery push notifications (JSON payload with waybill, status, scan data)
- Looks up the order by `awb_number` in `payments` table
- Auto-updates `fulfillment_status`:
  - `Manifested` / `Picked Up` → `shipped`
  - `In Transit` → `in_transit`
  - `Delivered` → `delivered`
  - `RTO` → flag for admin review
- Sends customer email on status change (shipped → in_transit → delivered)
- Logs all webhook payloads for debugging

> [!IMPORTANT]
> **Delhivery webhook setup requires coordination with Delhivery.** You need to email `lastmile-integration@delhivery.com` with your webhook URL (`https://franchglobal.com/api/webhooks/delhivery`) and they take 5–6 working days to configure it.

---

### Phase 5: Order Cancellation via Delhivery API (Admin)

> Allow admin to cancel a Delhivery shipment directly from the dashboard.

#### [MODIFY] [index.php](file:///c:/KARTHIKEYAN/TVK/transvaal-franchglobal/backend-php/public/index.php)

Add: `POST /api/shipping/delhivery/cancel`

- Calls Delhivery API: `POST {DELHIVERY_BASE_URL}/api/p/edit`
- Body: `{ "waybill": "...", "cancellation": true }`
- Updates order status to `cancelled` in DB
- Only allowed for orders in `Manifested` or `In Transit` status

#### [MODIFY] [OrdersTable.jsx](file:///c:/KARTHIKEYAN/TVK/transvaal-franchglobal/src/components/razorpay/OrdersTable.jsx) / [AdminDashboard.jsx](file:///c:/KARTHIKEYAN/TVK/transvaal-franchglobal/src/pages/AdminDashboard.jsx)

- Add a "Cancel Shipment" button (with confirmation dialog) for orders that have a Delhivery waybill and are in cancellable status

---

### Phase 6: Shipping Cost Estimation (Optional / Future)

> Show estimated shipping cost to the customer before checkout.

#### [NEW] Backend endpoint

Add: `GET /api/shipping/delhivery/estimate?origin_pin=600001&dest_pin=400001&weight=0.5`

- Calls Delhivery Freight Estimation API
- Returns estimated cost and delivery timeline

> [!NOTE]
> This API may require additional permissions from Delhivery. Check with your Delhivery account manager.

---

## Open Questions

> [!IMPORTANT]
> **Q1: Which phases do you want to implement?** I recommend starting with **Phases 1–3** as they have the most customer impact. Phases 4–6 can be added later.

> [!IMPORTANT]  
> **Q2: Do you want COD (Cash on Delivery) support?** Your current checkout only supports Razorpay prepaid payments. Phase 1 checks COD availability — but to actually support COD orders, the checkout flow would need significant changes. Should I include COD order flow in this plan?

> [!IMPORTANT]
> **Q3: The `DELHIVERY_BASE_URL` in your `.env` is `https://track.delhivery.com` — is this the production URL or staging?** Staging uses `https://staging-express.delhivery.com`. Make sure you're using the right one for testing vs production.

> [!IMPORTANT]
> **Q4: Auto-ship after payment?** Currently admin manually clicks "Ship Now". Do you want to auto-create a Delhivery shipment immediately after successful payment (fully automated), or keep it manual?

---

## Verification Plan

### Automated Tests
- Test the pincode serviceability endpoint with known serviceable and non-serviceable pincodes
- Test the create-order endpoint with sample order data
- Test the tracking proxy with a known waybill

### Manual Verification
- Place a test order and verify the full flow: pincode check → payment → ship now → tracking
- Verify the pincode check UI on the product page
- Verify the live tracking page with real waybill data
- Test with both serviceable and non-serviceable pincodes
