import { Card } from "@/components/ui/Card";

// CSS-div bar chart (plan §Charts fallback — the escape hatch when Recharts isn't
// worth a dependency). Brutalist: black-outlined hard-fill bars. Horizontal by
// default (ranked lists); vertical for time series. Pure presentational.

export type Bar = { label: string; value: number; display: string };

export function BarChart({
  title,
  bars,
  orientation = "horizontal",
  emptyText = "No data yet.",
}: {
  title: string;
  bars: Bar[];
  orientation?: "horizontal" | "vertical";
  emptyText?: string;
}) {
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <Card className="flex flex-col gap-3">
      <h3 className="font-comic font-bold text-lg">{title}</h3>
      {bars.length === 0 ? (
        <p className="font-comic text-[var(--fg-dim)] text-sm">{emptyText}</p>
      ) : orientation === "horizontal" ? (
        <div className="flex flex-col gap-2">
          {bars.map((b) => (
            <div key={b.label} className="flex items-center gap-2">
              <span className="w-24 shrink-0 font-mono text-[11px] truncate">{b.label}</span>
              <div className="flex-1 bg-panel-3 border-2 border-ink rounded-[3px] h-6 overflow-hidden">
                <div
                  className="h-full bg-brand border-r-2 border-ink"
                  style={{ width: `${Math.max(4, (b.value / max) * 100)}%` }}
                />
              </div>
              <span className="w-24 shrink-0 text-right font-mono text-[11px] tabular-nums">{b.display}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-end gap-2 h-40">
          {bars.map((b) => (
            <div key={b.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="font-mono text-[10px] tabular-nums">{b.display}</span>
              <div
                className="w-full bg-brand border-2 border-ink rounded-t-[3px]"
                style={{ height: `${Math.max(4, (b.value / max) * 100)}%` }}
              />
              <span className="font-mono text-[10px] text-[var(--fg-dim)]">{b.label}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
