/** Compact delivery / returns info on product page. */
export default function ProductDeliveryCards() {
  const items = [
    {
      icon: "https://api.iconify.design/fluent:vehicle-ship-20-filled.svg",
      title: "Fast delivery",
      text: "Estimated 3–6 business days across India",
    },
    {
      icon: "https://api.iconify.design/f7:gobackward-15.svg",
      title: "Easy returns",
      text: "15-day return policy · See shipping page for details",
    },
    {
      icon: "https://api.iconify.design/mdi:headset.svg",
      title: "Real support",
      text: "Call or WhatsApp us Mon–Sat, 10 AM – 7 PM",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
      {items.map((item) => (
        <div
          key={item.title}
          className="flex gap-3 items-start rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3.5"
        >
          <span
            className="mask-item shrink-0 mt-0.5"
            style={{
              "--m-size": "1.5rem",
              "--m-bg": "var(--p-c)",
              "--m-url": `url(${item.icon})`,
            }}
          />
          <div>
            <p className="m-0 text-sm font-semibold text-slate-800">{item.title}</p>
            <p className="m-0 mt-0.5 text-xs text-slate-600 leading-relaxed">{item.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
