// KPI stat card for the Analytics screen (plan §7). Colored top strip + big mono
// number. Kept in the finance namespace so it doesn't collide with the shared
// dashboard KpiCard (Person A's foundation slot).

const strips = {
  brand: "bg-brand",
  blue: "bg-blue",
  green: "bg-green",
  orange: "bg-orange",
} as const;

export function StatCard({
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
