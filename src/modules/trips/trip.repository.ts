import { prisma } from "@/core/database/prisma";
import type { TripStatus } from "@/generated/prisma/enums";

// Serializable DTOs (Decimal → number) for the Live Board and pickers.
export type TripRow = {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  vehicleLabel: string;
  driverLabel: string;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  actualDistanceKm: number | null;
  fuelConsumedL: number | null;
  status: TripStatus;
  dispatchedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
};

export type PickerVehicle = { id: string; label: string; maxLoadCapacityKg: number };
export type PickerDriver = { id: string; label: string };

export async function getTrips(): Promise<TripRow[]> {
  const rows = await prisma.trip.findMany({
    include: { vehicle: true, driver: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((t) => ({
    id: t.id,
    source: t.source,
    destination: t.destination,
    vehicleId: t.vehicleId,
    driverId: t.driverId,
    vehicleLabel: t.vehicle.registrationNumber,
    driverLabel: t.driver.name,
    cargoWeightKg: Number(t.cargoWeightKg),
    plannedDistanceKm: Number(t.plannedDistanceKm),
    actualDistanceKm: t.actualDistanceKm == null ? null : Number(t.actualDistanceKm),
    fuelConsumedL: t.fuelConsumedL == null ? null : Number(t.fuelConsumedL),
    status: t.status,
    dispatchedAt: t.dispatchedAt?.toISOString() ?? null,
    completedAt: t.completedAt?.toISOString() ?? null,
    cancelledAt: t.cancelledAt?.toISOString() ?? null,
  }));
}

// Available-only pickers filtered in SQL (Rules 2, 3, 4). Vehicles: AVAILABLE
// only. Drivers: AVAILABLE AND license not expired (compared to server today).
export async function getAvailableVehicles(): Promise<PickerVehicle[]> {
  const rows = await prisma.vehicle.findMany({
    where: { status: "AVAILABLE" },
    orderBy: { registrationNumber: "asc" },
  });
  return rows.map((v) => ({
    id: v.id,
    label: `${v.registrationNumber} — ${v.name}`,
    maxLoadCapacityKg: Number(v.maxLoadCapacityKg),
  }));
}

export async function getAvailableDrivers(): Promise<PickerDriver[]> {
  const rows = await prisma.driver.findMany({
    where: { status: "AVAILABLE", licenseExpiryDate: { gte: new Date() } },
    orderBy: { name: "asc" },
  });
  return rows.map((d) => ({ id: d.id, label: `${d.name} (${d.licenseNumber})` }));
}
