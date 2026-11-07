import { FULFILLMENT_STEPS, fulfillmentStepIndex, fulfillmentStatusMessage } from "../../utils/fulfillmentStatus";

export default function OrderTimeline({ status }) {
  const activeIndex = fulfillmentStepIndex(status);

  if (String(status || "").toLowerCase() === "cancelled") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
        <span className="mt-0.5 text-red-500 text-base leading-none">✕</span>
        <div>
          <p className="m-0 font-semibold text-sm text-red-700">Shipment cancelled</p>
          <p className="m-0 mt-1 text-xs text-red-500">This shipment was cancelled. Contact us if you have any questions.</p>
        </div>
      </div>
    );
  }

  return (
    <ol className="order-timeline list-none m-0 p-0">
      {FULFILLMENT_STEPS.map((step, index) => {
        const done = index <= activeIndex;
        const current = index === activeIndex;
        return (
          <li
            key={step.key}
            className={`order-timeline__step flex gap-4 pb-8 last:pb-0 ${done ? "order-timeline__step--done" : ""} ${current ? "order-timeline__step--current" : ""}`}
          >
            <div className="flex flex-col items-center shrink-0">
              <span
                className={`order-timeline__dot w-4 h-4 rounded-full border-2 ${
                  done ? "bg-[var(--p-c)] border-[var(--p-c)]" : "bg-white border-slate-300"
                }`}
              />
              {index < FULFILLMENT_STEPS.length - 1 && (
                <span
                  className={`order-timeline__line w-0.5 flex-1 min-h-[2.5rem] mt-1 ${
                    index < activeIndex ? "bg-[var(--p-c)]" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
            <div className="pt-0.5">
              <p className={`m-0 font-semibold text-sm ${current ? "text-[var(--p-c)]" : "text-slate-800"}`}>
                {step.label}
              </p>
              {current && (
                <p className="m-0 mt-1 text-xs text-slate-500">{fulfillmentStatusMessage(step.key)}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
