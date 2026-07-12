// Shared display formatters. Numbers never render in Comic — callers wrap these in
// the mono font (plan §2). Decimals arrive from Prisma as objects/strings, so coerce.

type Numeric = number | string | { toString(): string } | null | undefined;

function toNum(v: Numeric): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v.toString());
}

const currencyFmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatCurrency(v: Numeric): string {
  return currencyFmt.format(toNum(v));
}

export function formatNumber(v: Numeric, decimals = 0): string {
  return toNum(v).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatKm(v: Numeric): string {
  return `${formatNumber(v)} km`;
}

export function formatKmPerL(v: Numeric): string {
  const n = toNum(v);
  return n > 0 ? `${formatNumber(n, 2)} km/l` : "—";
}

export function formatDate(v: Date | string | null | undefined): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
}
