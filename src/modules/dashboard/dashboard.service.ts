import { Role, TripStatus, VehicleStatus, ExpenseCategory } from "@/generated/prisma/enums";
import type { VehicleStatus as VehicleStatusT } from "@/generated/prisma/enums";
import { requireRole } from "@/core/security/rbac";
import { prisma } from "@/core/database/prisma";

// Dashboard service (plan §7, Person A). The dashboard is the shared landing
// screen — every authenticated role reaches it — so reads pass ALL roles. All
// figures are derived live from the DB, never stored.
const ALL_ROLES = [
  Role.FLEET_MANAGER,
  Role.DRIVER,
  Role.SAFETY_OFFICER,
  Role.FINANCIAL_ANALYST,
];

export type DashboardKpis = {
  totalVehicles: number;
  activeTrips: number; // dispatched, in-flight
  completedTrips: number;
  vehiclesInShop: number;
  availableDrivers: number;
  expiredLicenses: number;
  operationalCost: number;
};

export type RecentTrip = {
  id: string;
  route: string;
  vehicle: string;
  driver: string;
  status: TripStatus;
  date: Date;
};

export type VehicleStatusCount = { status: VehicleStatusT; count: number };

// ── 7 KPI cards ───────────────────────────────────────────────────────────
export async function getDashboardKpis(): Promise<DashboardKpis> {
  await requireRole(ALL_ROLES);

  const now = new Date();
  const [
    totalVehicles,
    activeTrips,
    completedTrips,
    vehiclesInShop,
    availableDrivers,
    expiredLicenses,
    fuel,
    maintenance,
    expenses,
  ] = await Promise.all([
    prisma.vehicle.count(),
    prisma.trip.count({ where: { status: TripStatus.DISPATCHED } }),
    prisma.trip.count({ where: { status: TripStatus.COMPLETED } }),
    prisma.vehicle.count({ where: { status: VehicleStatus.IN_SHOP } }),
    prisma.driver.count({ where: { status: "AVAILABLE" } }),
    prisma.driver.count({ where: { licenseExpiryDate: { lt: now } } }),
    prisma.fuelLog.aggregate({ _sum: { cost: true } }),
    prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { category: { in: [ExpenseCategory.TOLL, ExpenseCategory.OTHER] } },
    }),
  ]);

  const operationalCost =
    Number(fuel._sum.cost ?? 0) +
    Number(maintenance._sum.cost ?? 0) +
    Number(expenses._sum.amount ?? 0);

  return {
    totalVehicles,
    activeTrips,
    completedTrips,
    vehiclesInShop,
    availableDrivers,
    expiredLicenses,
    operationalCost,
  };
}

// ── Recent Trips table (latest 8, any status) ──────────────────────────────
export async function getRecentTrips(limit = 8): Promise<RecentTrip[]> {
  await requireRole(ALL_ROLES);

  const trips = await prisma.trip.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      vehicle: { select: { registrationNumber: true } },
      driver: { select: { name: true } },
    },
  });

  return trips.map((t) => ({
    id: t.id,
    route: `${t.source} → ${t.destination}`,
    vehicle: t.vehicle.registrationNumber,
    driver: t.driver.name,
    status: t.status,
    date: t.completedAt ?? t.dispatchedAt ?? t.createdAt,
  }));
}

// ── Vehicle Status horizontal bar chart ─────────────────────────────────────
// Every status bucket in a fixed order so the chart shape is stable even at 0.
export async function getVehicleStatusCounts(): Promise<VehicleStatusCount[]> {
  await requireRole(ALL_ROLES);

  const grouped = await prisma.vehicle.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const byStatus = new Map(grouped.map((g) => [g.status, g._count._all]));
  const order: VehicleStatusT[] = [
    VehicleStatus.AVAILABLE,
    VehicleStatus.ON_TRIP,
    VehicleStatus.IN_SHOP,
    VehicleStatus.RETIRED,
  ];

  return order.map((status) => ({ status, count: byStatus.get(status) ?? 0 }));
}
