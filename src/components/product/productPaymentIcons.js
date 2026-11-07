import visa from "/images/product/productpage/visa.webp";
import upi from "/images/product/productpage/upi.webp";
import master from "/images/product/productpage/master.webp";
import googlePay from "/images/product/productpage/google_pay.webp";

/** Payment logos shown on Buy now (UPI / cards / Google Pay). */
export const PRODUCT_PAYMENT_ICONS = [
  { src: upi, label: "UPI" },
  { src: googlePay, label: "Google Pay" },
  { src: visa, label: "Visa" },
  { src: master, label: "Mastercard" },
];

/** Three chips on the CTA pill (like PhonePe / GPay / card). */
export const CTA_PAYMENT_ICONS = PRODUCT_PAYMENT_ICONS.slice(0, 3);
