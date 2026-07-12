import { auth } from "@/core/security/auth";
import {
  getDashboardKpis,
  getRecentTrips,
  getVehicleStatusCounts,
} from "@/modules/dashboard/dashboard.service";
import { formatCurrency, formatDate } from "@/core/utils/formatters";
import { TRIP_STATUS, VEHICLE_STATUS } from "@/core/utils/constants";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { BarChart, type Bar } from "@/components/finance/BarChart";
import { Pill } from "@/components/ui/Pill";
import { Card } from "@/components/ui/Card";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/Table";

// Dashboard — the shared landing screen every role reaches after login (plan §7,
// Person A). Server component: 7 KPI cards, Recent Trips table, Vehicle Status
// chart, all derived live from the DB. RBAC re-checked inside each service call.
export default async function DashboardPage() {
  const session = await auth();
  const [kpis, recentTrips, statusCounts] = await Promise.all([
    getDashboardKpis(),
    getRecentTrips(),
    getVehicleStatusCounts(),
  ]);

  const statusBars: Bar[] = statusCounts.map((s) => ({
    label: VEHICLE_STATUS[s.status].label,
    value: s.count,
    display: String(s.count),
  }));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-comic font-bold text-2xl">
          Welcome, {session?.user?.name ?? "there"} 👋
        </h1>
        <p className="font-comic text-[var(--fg-dim)] mt-1">
          Fleet operations at a glance.
        </p>
      </div>

      {/* 7 KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Vehicles" value={String(kpis.totalVehicles)} color="brand" />
        <KpiCard label="Active Trips" value={String(kpis.activeTrips)} hint="dispatched, in-flight" color="blue" />
        <KpiCard label="Completed Trips" value={String(kpis.completedTrips)} color="green" />
        <KpiCard label="Vehicles In Shop" value={String(kpis.vehiclesInShop)} color="orange" />
        <KpiCard label="Available Drivers" value={String(kpis.availableDrivers)} color="green" />
        <KpiCard
          label="Expired Licenses"
          value={String(kpis.expiredLicenses)}
          hint={kpis.expiredLicenses > 0 ? "needs attention" : "all valid"}
          color={kpis.expiredLicenses > 0 ? "redpink" : "green"}
        />
        <KpiCard label="Operational Cost" value={formatCurrency(kpis.operationalCost)} hint="fuel + maint + tolls/other" color="orange" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Trips */}
        <Card className="lg:col-span-2 flex flex-col gap-3">
          <h3 className="font-comic font-bold text-lg">Recent Trips</h3>
          {recentTrips.length === 0 ? (
            <p className="font-comic text-[var(--fg-dim)] text-sm">No trips yet.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Route</TH>
                  <TH>Vehicle</TH>
                  <TH>Driver</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Date</TH>
                </TR>
              </THead>
              <TBody>
                {recentTrips.map((t) => (
                  <TR key={t.id}>
                    <TD className="font-comic">{t.route}</TD>
                    <TD className="font-mono text-[13px]">{t.vehicle}</TD>
                    <TD className="font-comic">{t.driver}</TD>
                    <TD>
                      <Pill color={TRIP_STATUS[t.status].color} label={TRIP_STATUS[t.status].label} />
                    </TD>
                    <TD className="font-mono text-right text-[13px]">{formatDate(t.date)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        {/* Vehicle Status chart */}
        <BarChart
          title="Vehicle Status"
          bars={statusBars}
          orientation="horizontal"
          emptyText="No vehicles yet."
        />
      </div>
    </div>
  );
}
