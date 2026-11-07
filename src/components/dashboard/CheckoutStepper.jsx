import { ShoppingBag, CreditCard, Package } from "lucide-react";

export default function CheckoutStepper() {
  const steps = [
    { label: "Cart", icon: ShoppingBag, active: true, done: true },
    { label: "Payment", icon: CreditCard, active: true, done: false },
    { label: "Delivered", icon: Package, active: false, done: false },
  ];

  return (
    <div className="flex justify-center py-5 px-2">
      <div className="dashboard-stepper poppins">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-center gap-1 sm:gap-2">
              <div className={`dashboard-step ${step.active ? "dashboard-step--active" : ""}`}>
                <span className="dashboard-step-dot">
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`dashboard-step-line ${step.done ? "dashboard-step-line--done" : ""}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
