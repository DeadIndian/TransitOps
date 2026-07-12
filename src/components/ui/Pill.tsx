import type { PillColor } from "@/core/utils/constants";

const fills: Record<PillColor, string> = {
  green: "bg-green",
  blue: "bg-blue",
  orange: "bg-orange",
  redpink: "bg-redpink",
  red: "bg-red",
  grey: "bg-grey",
};

// Status pill: black border, solid status fill, black text, mono uppercase (plan §6).
// One component; `color` switches the fill. Feed it VEHICLE_STATUS[...] etc.
export function Pill({ color, label }: { color: PillColor; label: string }) {
  return (
    <span
      className={`inline-block border-2 border-ink rounded-[4px] px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wide text-ink ${fills[color]}`}
    >
      {label}
    </span>
  );
}
