import {
  getAnalyticsKpis,
  getMonthlyOperationalCost,
  getTopCostliestVehicles,
} from "@/modules/reports/report.service";
import { formatCurrency, formatKmPerL, formatNumber } from "@/core/utils/formatters";
import { StatCard } from "@/components/finance/StatCard";
import { BarChart, type Bar } from "@/components/finance/BarChart";
import { ExportButton } from "@/components/finance/ExportButton";

// Analytics — server component (plan §7). All KPIs/charts are derived live from
// the DB; nothing is stored. Charts use the CSS-div fallback (no Recharts dep).
export default async function ReportsPage() {
  const [kpis, monthly, topVehicles] = await Promise.all([
    getAnalyticsKpis(),
    getMonthlyOperationalCost(),
    getTopCostliestVehicles(),
  ]);

  const monthlyBars: Bar[] = monthly.map((m) => ({
    label: m.month,
    value: m.total,
    display: formatCurrency(m.total),
  }));
  const vehicleBars: Bar[] = topVehicles.map((v) => ({
    label: v.label,
    value: v.total,
    display: formatCurrency(v.total),
  }));

  const hasData = monthlyBars.length > 0 || vehicleBars.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-comic font-bold text-2xl">Analytics</h1>
        <ExportButton disabled={!hasData} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Fuel Efficiency"
          value={kpis.fuelEfficiency == null ? "—" : formatKmPerL(kpis.fuelEfficiency)}
          hint="completed trips: Σ distance ÷ Σ fuel"
          color="green"
        />
        <StatCard
          label="Fleet Utilization"
          value={`${formatNumber(kpis.fleetUtilization, 1)}%`}
          hint="on-trip ÷ non-retired vehicles"
          color="blue"
        />
        <StatCard
          label="Operational Cost"
          value={formatCurrency(kpis.operationalCost)}
          hint="fuel + maintenance + tolls/other"
          color="orange"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart
          title="Monthly Operational Cost"
          bars={monthlyBars}
          orientation="vertical"
          emptyText="No cost data yet."
        />
        <BarChart
          title="Top Costliest Vehicles"
          bars={vehicleBars}
          orientation="horizontal"
          emptyText="No vehicle costs yet."
        />
      </div>
    </div>
  );
}
