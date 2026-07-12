import { Role, TripStatus, VehicleStatus, ExpenseCategory } from "@/generated/prisma/enums";
import { requireRole } from "@/core/security/rbac";
import { prisma } from "@/core/database/prisma";

// Analytics service (plan §7). All metrics are DERIVED, never stored, so they
// never drift when a fuel log or expense changes. Fleet Manager + Financial
// Analyst may read; the same rollups back the CSV export.

const READ_ROLES = [Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST];

export type AnalyticsKpis = {
  fuelEfficiency: number | null; // km/l, null when no fuel (→ "—")
  fleetUtilization: number; // %
  operationalCost: number;
};

export type MonthlyCost = { month: string; total: number };
export type VehicleCost = { vehicleId: string; label: string; total: number };

// ── KPIs ────────────────────────────────────────────────────────────────
export async function getAnalyticsKpis(): Promise<AnalyticsKpis> {
  await requireRole(READ_ROLES);

  const [tripAgg, onTrip, nonRetired, fuel, maintenance, expenses] = await Promise.all([
    prisma.trip.aggregate({
      where: { status: TripStatus.COMPLETED },
      _sum: { actualDistanceKm: true, fuelConsumedL: true },
    }),
    prisma.vehicle.count({ where: { status: VehicleStatus.ON_TRIP } }),
    prisma.vehicle.count({ where: { status: { not: VehicleStatus.RETIRED } } }),
    prisma.fuelLog.aggregate({ _sum: { cost: true } }),
    prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { category: { in: [ExpenseCategory.TOLL, ExpenseCategory.OTHER] } },
    }),
  ]);

  const dist = Number(tripAgg._sum.actualDistanceKm ?? 0);
  const liters = Number(tripAgg._sum.fuelConsumedL ?? 0);
  const fuelEfficiency = liters > 0 ? dist / liters : null;

  const fleetUtilization = nonRetired > 0 ? (onTrip / nonRetired) * 100 : 0;

  const operationalCost =
    Number(fuel._sum.cost ?? 0) +
    Number(maintenance._sum.cost ?? 0) +
    Number(expenses._sum.amount ?? 0);

  return { fuelEfficiency, fleetUtilization, operationalCost };
}

// ── Monthly Operational Cost ──────────────────────────────────────────────
// Σ fuel + Σ maintenance + Σ expenses(TOLL,OTHER) bucketed by calendar month.
// Done in JS: three small pulls, summed into a YYYY-MM map (dataset is demo-sized).
export async function getMonthlyOperationalCost(): Promise<MonthlyCost[]> {
  await requireRole(READ_ROLES);

  const [fuel, maintenance, expenses] = await Promise.all([
    prisma.fuelLog.findMany({ select: { date: true, cost: true } }),
    prisma.maintenanceLog.findMany({ select: { openedAt: true, cost: true } }),
    prisma.expense.findMany({
      where: { category: { in: [ExpenseCategory.TOLL, ExpenseCategory.OTHER] } },
      select: { date: true, amount: true },
    }),
  ]);

  const buckets = new Map<string, number>();
  const add = (d: Date, amount: number) => {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, (buckets.get(key) ?? 0) + amount);
  };

  fuel.forEach((f) => add(f.date, Number(f.cost)));
  maintenance.forEach((m) => add(m.openedAt, Number(m.cost)));
  expenses.forEach((e) => add(e.date, Number(e.amount)));

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));
}

// ── Top Costliest Vehicles ────────────────────────────────────────────────
// Per-vehicle cost = fuel + maintenance (plan §Derived). Ranked desc, top 5.
export async function getTopCostliestVehicles(limit = 5): Promise<VehicleCost[]> {
  await requireRole(READ_ROLES);

  const [vehicles, fuelByVehicle, maintByVehicle] = await Promise.all([
    prisma.vehicle.findMany({ select: { id: true, registrationNumber: true } }),
    prisma.fuelLog.groupBy({ by: ["vehicleId"], _sum: { cost: true } }),
    prisma.maintenanceLog.groupBy({ by: ["vehicleId"], _sum: { cost: true } }),
  ]);

  const totals = new Map<string, number>();
  fuelByVehicle.forEach((r) => totals.set(r.vehicleId, (totals.get(r.vehicleId) ?? 0) + Number(r._sum.cost ?? 0)));
  maintByVehicle.forEach((r) => totals.set(r.vehicleId, (totals.get(r.vehicleId) ?? 0) + Number(r._sum.cost ?? 0)));

  const labelById = new Map(vehicles.map((v) => [v.id, v.registrationNumber]));

  return [...totals.entries()]
    .map(([vehicleId, total]) => ({
      vehicleId,
      label: labelById.get(vehicleId) ?? vehicleId.slice(0, 8),
      total,
    }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

// ── CSV export (plan §7 data write: exportAnalyticsCsv) ───────────────────
// Serializes the same result set: KPI rows + per-vehicle cost rows. Built by
// hand (no PapaParse dep) — values are numbers/short strings, quoted+escaped.
function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function exportAnalyticsCsv(): Promise<string> {
  await requireRole(READ_ROLES);

  const [kpis, monthly, vehicles] = await Promise.all([
    getAnalyticsKpis(),
    getMonthlyOperationalCost(),
    getTopCostliestVehicles(1000),
  ]);

  const lines: string[] = [];
  lines.push(["section", "label", "value"].map(csvCell).join(","));
  lines.push(["kpi", "Fuel Efficiency (km/l)", kpis.fuelEfficiency == null ? "" : kpis.fuelEfficiency.toFixed(2)].map(csvCell).join(","));
  lines.push(["kpi", "Fleet Utilization (%)", kpis.fleetUtilization.toFixed(1)].map(csvCell).join(","));
  lines.push(["kpi", "Operational Cost", kpis.operationalCost.toFixed(2)].map(csvCell).join(","));
  monthly.forEach((m) => lines.push(["monthly_cost", m.month, m.total.toFixed(2)].map(csvCell).join(",")));
  vehicles.forEach((v) => lines.push(["vehicle_cost", v.label, v.total.toFixed(2)].map(csvCell).join(",")));

  return lines.join("\n");
}
