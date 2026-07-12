// Trip lifecycle stepper (plan §6): bordered dots joined by a thick rule.
// done = filled status color, active = orange, upcoming = surface. A cancelled
// trip turns the rule red. Generic over any ordered step list.

type StepState = "done" | "active" | "upcoming" | "cancelled";

export function Stepper({
  steps,
}: {
  steps: { label: string; state: StepState }[];
}) {
  return (
    <div className="flex items-center">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`h-6 w-6 border-[3px] border-ink rounded-[4px] ${
                step.state === "done"
                  ? "bg-green"
                  : step.state === "active"
                    ? "bg-brand shadow-brutal-sm"
                    : step.state === "cancelled"
                      ? "bg-red"
                      : "bg-[var(--surface)]"
              }`}
            />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-[var(--fg-dim)]">
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-1 w-10 mx-1 mb-5 ${
                step.state === "cancelled" ? "bg-red" : "bg-ink"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
