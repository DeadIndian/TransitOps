import { prisma } from "@/core/database/prisma";
import type { VehicleStatus } from "@/generated/prisma/enums";

// Prisma returns Decimal objects that can't cross the server→client boundary,
// so the repository maps rows to plain-number DTOs the UI can render directly.
export type VehicleRow = {
  id: string;
  registrationNumber: string;
  name: string;
  type: string;
  maxLoadCapacityKg: number;
  odometerKm: number;
  acquisitionCost: number;
  status: VehicleStatus;
  region: string | null;
};

export type VehicleFilters = {
  type?: string;
  status?: VehicleStatus;
  search?: string;
};

function toRow(v: {
  id: string;
  registrationNumber: string;
  name: string;
  type: string;
  maxLoadCapacityKg: unknown;
  odometerKm: unknown;
  acquisitionCost: unknown;
  status: VehicleStatus;
  region: string | null;
}): VehicleRow {
  return {
    id: v.id,
    registrationNumber: v.registrationNumber,
    name: v.name,
    type: v.type,
    maxLoadCapacityKg: Number(v.maxLoadCapacityKg),
    odometerKm: Number(v.odometerKm),
    acquisitionCost: Number(v.acquisitionCost),
    status: v.status,
    region: v.region,
  };
}

export async function getVehicles(filters: VehicleFilters = {}): Promise<VehicleRow[]> {
  const rows = await prisma.vehicle.findMany({
    where: {
      type: filters.type || undefined,
      status: filters.status || undefined,
      registrationNumber: filters.search
        ? { contains: filters.search, mode: "insensitive" }
        : undefined,
    },
    orderBy: { registrationNumber: "asc" },
  });
  return rows.map(toRow);
}

export async function getVehicleById(id: string): Promise<VehicleRow | null> {
  const v = await prisma.vehicle.findUnique({ where: { id } });
  return v ? toRow(v) : null;
}
