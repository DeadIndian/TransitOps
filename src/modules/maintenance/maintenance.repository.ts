import { prisma } from "@/core/database/prisma";
import type { MaintenanceStatus } from "@/generated/prisma/enums";

export type MaintenanceRow = {
  id: string;
  vehicleId: string;
  vehicleLabel: string;
  description: string;
  cost: number;
  status: MaintenanceStatus;
  openedAt: string;
  closedAt: string | null;
};

export type MaintenanceVehicle = { id: string; label: string };

export async function getMaintenanceLogs(): Promise<MaintenanceRow[]> {
  const rows = await prisma.maintenanceLog.findMany({
    include: { vehicle: true },
    orderBy: { openedAt: "desc" },
  });
  return rows.map((m) => ({
    id: m.id,
    vehicleId: m.vehicleId,
    vehicleLabel: m.vehicle.registrationNumber,
    description: m.description,
    cost: Number(m.cost),
    status: m.status,
    openedAt: m.openedAt.toISOString(),
    closedAt: m.closedAt?.toISOString() ?? null,
  }));
}

// A vehicle can only enter the shop from AVAILABLE or IN_SHOP — Retired and
// On-Trip are excluded from the picker (plan §5, Rule 9 guard).
export async function getVehiclesForMaintenance(): Promise<MaintenanceVehicle[]> {
  const rows = await prisma.vehicle.findMany({
    where: { status: { in: ["AVAILABLE", "IN_SHOP"] } },
    orderBy: { registrationNumber: "asc" },
  });
  return rows.map((v) => ({ id: v.id, label: `${v.registrationNumber} — ${v.name}` }));
}
