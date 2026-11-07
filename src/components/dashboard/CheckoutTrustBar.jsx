import visa from "/images/product/productpage/visa.webp";
import upi from "/images/product/productpage/upi.webp";
import master from "/images/product/productpage/master.webp";
import google_pay from "/images/product/productpage/google_pay.webp";
import paypal from "/images/product/productpage/paypal.webp";

const icons = [visa, master, paypal, google_pay, upi];

export default function CheckoutTrustBar() {
  return (
    <section className="dashboard-trust-bar poppins my-6 space-y-3">
      <div className="flex items-center gap-2 text-[var(--p-c)] font-semibold text-sm">
        <span
          className="mask-item inline-block shrink-0"
          style={{
            "--m-size": "1.25rem",
            "--m-bg": "var(--p-c)",
            "--m-url": "url(https://api.iconify.design/mingcute:safety-certificate-fill.svg)",
          }}
        />
        Secure checkout with trusted payment gateway
      </div>
      <div className="pay-icons flex items-center gap-2 flex-wrap justify-center">
        {icons.map((src) => (
          <img key={src} src={src} alt="" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12px] text-[var(--t-p-c)]">
        <div className="rounded-md border border-[var(--a-c-4)] px-3 py-2 text-center">
          Live order updates: Placed, Packed, Shipped, Delivered
        </div>
        <div className="rounded-md border border-[var(--a-c-4)] px-3 py-2 text-center">
          Support on WhatsApp and phone during business hours
        </div>
        <div className="rounded-md border border-[var(--a-c-4)] px-3 py-2 text-center">
          Clear shipping and return policies before checkout
        </div>
      </div>
    </section>
  );
}
