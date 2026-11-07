import axios from "axios";

const isBrowser = typeof window !== "undefined";
const isFranchHost =
  isBrowser &&
  (window.location.hostname === "franchglobal.com" ||
    window.location.hostname.endsWith(".franchglobal.com"));

const baseURL = isFranchHost
  ? ""
  : (import.meta.env.VITE_API_BASE_URL || "http://localhost");

export const phpApi = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const phpRoutes = {
  authRegister: "/api/auth/register",
  authLogin: "/api/auth/login",
  authLogout: "/api/auth/logout",
  authMe: "/api/auth/me",
  authUpdateMe: "/api/auth/me",
  authResetPassword: "/api/auth/reset-password",
  authGoogle: "/api/auth/google",
  customerCart: "/api/customer/cart",
  customerFavorites: "/api/customer/favorites",
  createOrder: "/api/payments/razorpay/create-order",
  verifyPayment: "/api/payments/razorpay/verify",
  storeOrderInitiation: "/api/orders/initiation",
  trackMeta: "/api/meta/track",
  adminMenus: "/api/admin/menus",
  payments: "/api/payments",
  razorpayWebhooks: "/api/razorpay-webhooks",
  orderInitiations: "/api/order-initiations",
  razorpayOrderSnapshots: "/api/razorpay-order-snapshots",
  products: "/api/products",
  blogs: "/api/blogs",
  orders: "/api/orders",
  ordersMine: "/api/orders/mine",
  reviews: "/api/reviews",
  users: "/api/users",
  enquiries: "/api/enquiries",
  pincodeLookup: "/api/pincode",
  delhiveryServiceability: "/api/shipping/delhivery/serviceability",
  delhiveryTrack: "/api/shipping/delhivery/track",
  delhiveryCreateOrder: "/api/shipping/delhivery/create-order",
  delhiveryCancel: "/api/shipping/delhivery/cancel",
  delhiveryAutoDispatchSetting: "/api/shipping/delhivery/auto-dispatch-setting",
};
