// Shared dashboard KPI card (plan §7, Person A's foundation slot): colored top
// strip + big mono number + optional hint. The dashboard's 7-card grid uses it.
const strips = {
  brand: "bg-brand",
  blue: "bg-blue",
  green: "bg-green",
  orange: "bg-orange",
  redpink: "bg-redpink",
} as const;

export function KpiCard({
  label,
  value,
  hint,
  color = "brand",
}: {
  label: string;
  value: string;
  hint?: string;
  color?: keyof typeof strips;
}) {
  return (
    <div className="border-[3px] border-ink rounded-[4px] shadow-brutal bg-[var(--surface)] overflow-hidden">
      <div className={`h-2 ${strips[color]} border-b-[3px] border-ink`} />
      <div className="p-4 flex flex-col gap-1">
        <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--fg-dim)]">{label}</span>
        <span className="font-comic font-bold text-3xl tabular-nums">{value}</span>
        {hint && <span className="font-mono text-[11px] text-[var(--fg-dim)]">{hint}</span>}
      </div>
    </div>
  );
}
