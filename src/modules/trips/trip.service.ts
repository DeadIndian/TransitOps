"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/core/database/prisma";
import type { Vehicle, Driver, Trip } from "@/generated/prisma/client";
import { requireRole } from "@/core/security/rbac";
import { AppError } from "@/core/errors/AppError";
import { BusinessRuleError } from "@/core/errors/BusinessRuleError";
import { CreateTripInput, CompleteTripInput } from "./trip.schema";

export type TripFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};
export type ActionResult = { ok: boolean; error?: string };

function zodToFieldErrors(error: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0] ?? "form")] ??= issue.message;
  return out;
}

// Create a DRAFT trip. Cargo ≤ capacity is enforced here as an early check
// (Rule 5) and again authoritatively against the locked vehicle at dispatch.
export async function createTrip(
  _prev: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  try {
    await requireRole(["DRIVER"]);
    const parsed = CreateTripInput.safeParse({
      source: formData.get("source"),
      destination: formData.get("destination"),
      vehicleId: formData.get("vehicleId"),
      driverId: formData.get("driverId"),
      cargoWeightKg: formData.get("cargoWeightKg"),
      plannedDistanceKm: formData.get("plannedDistanceKm"),
    });
    if (!parsed.success) return { ok: false, fieldErrors: zodToFieldErrors(parsed.error) };
    const data = parsed.data;

    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle || vehicle.status !== "AVAILABLE")
      return { ok: false, fieldErrors: { vehicleId: "Vehicle is not available" } };
    if (data.cargoWeightKg > Number(vehicle.maxLoadCapacityKg)) {
      const over = data.cargoWeightKg - Number(vehicle.maxLoadCapacityKg);
      return { ok: false, fieldErrors: { cargoWeightKg: `Cargo exceeds capacity by ${over} kg` } };
    }

    await prisma.trip.create({
      data: {
        source: data.source,
        destination: data.destination,
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        cargoWeightKg: data.cargoWeightKg,
        plannedDistanceKm: data.plannedDistanceKm,
      },
    });
    revalidatePath("/trips");
    return { ok: true };
  } catch (err) {
    return toFormState(err);
  }
}

const today = () => new Date();

// Rule 6: one transaction flips trip→DISPATCHED and vehicle+driver→ON_TRIP,
// after re-validating against the locked rows (Rules 2,3,4,5).
export async function dispatchTrip(tripId: string): Promise<ActionResult> {
  try {
    await requireRole(["DRIVER"]);
    await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUniqueOrThrow({ where: { id: tripId } });
      if (trip.status !== "DRAFT") throw new BusinessRuleError(409, "Trip already dispatched");

      const [vehicle] = await tx.$queryRaw<Vehicle[]>`
        SELECT * FROM vehicles WHERE id = ${trip.vehicleId} FOR UPDATE`;
      const [driver] = await tx.$queryRaw<Driver[]>`
        SELECT * FROM drivers WHERE id = ${trip.driverId} FOR UPDATE`;
      if (!vehicle || !driver) throw new BusinessRuleError(422, "Vehicle or driver missing");

      if (vehicle.status !== "AVAILABLE") throw new BusinessRuleError(422, "Vehicle not available");
      if (driver.status !== "AVAILABLE") throw new BusinessRuleError(422, "Driver not available");
      // A license can lapse while a driver still reads AVAILABLE (Rule 3), so
      // re-check expiry against the server clock at dispatch time.
      if (new Date(driver.licenseExpiryDate) < today())
        throw new BusinessRuleError(422, "Driver ineligible: license expired");
      if (Number(trip.cargoWeightKg) > Number(vehicle.maxLoadCapacityKg))
        throw new BusinessRuleError(422, "Cargo weight exceeds vehicle capacity");

      await tx.trip.update({
        where: { id: trip.id },
        data: { status: "DISPATCHED", dispatchedAt: new Date() },
      });
      await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "ON_TRIP" } });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: "ON_TRIP" } });
    });
    revalidatePaths();
    return { ok: true };
  } catch (err) {
    return toActionResult(err);
  }
}

// Rule 7: complete → capture inputs, write FuelLog, roll odometer, restore both.
export async function completeTrip(
  tripId: string,
  _prev: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  try {
    await requireRole(["DRIVER"]);
    const parsed = CompleteTripInput.safeParse({
      actualDistanceKm: formData.get("actualDistanceKm"),
      fuelConsumedL: formData.get("fuelConsumedL"),
      fuelCost: formData.get("fuelCost"),
    });
    if (!parsed.success) return { ok: false, fieldErrors: zodToFieldErrors(parsed.error) };
    const { actualDistanceKm, fuelConsumedL, fuelCost } = parsed.data;

    await prisma.$transaction(async (tx) => {
      const [trip] = await tx.$queryRaw<Trip[]>`
        SELECT * FROM trips WHERE id = ${tripId} FOR UPDATE`;
      if (!trip) throw new BusinessRuleError(404, "Trip not found");
      if (trip.status !== "DISPATCHED") throw new BusinessRuleError(409, "Trip is not active");

      await tx.trip.update({
        where: { id: trip.id },
        data: { status: "COMPLETED", actualDistanceKm, fuelConsumedL, completedAt: new Date() },
      });
      await tx.fuelLog.create({
        data: { vehicleId: trip.vehicleId, tripId: trip.id, liters: fuelConsumedL, cost: fuelCost },
      });

      const [veh] = await tx.$queryRaw<Vehicle[]>`
        SELECT * FROM vehicles WHERE id = ${trip.vehicleId} FOR UPDATE`;
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "AVAILABLE", odometerKm: Number(veh.odometerKm) + Number(actualDistanceKm) },
      });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } });
    });
    revalidatePaths();
    return { ok: true };
  } catch (err) {
    return toFormState(err);
  }
}

// Rule 8: cancel a DISPATCHED trip restores both to AVAILABLE; a DRAFT cancel
// held no locks so only the status flips.
export async function cancelTrip(tripId: string): Promise<ActionResult> {
  try {
    await requireRole(["DRIVER"]);
    await prisma.$transaction(async (tx) => {
      const [trip] = await tx.$queryRaw<Trip[]>`
        SELECT * FROM trips WHERE id = ${tripId} FOR UPDATE`;
      if (!trip) throw new BusinessRuleError(404, "Trip not found");
      if (trip.status === "COMPLETED" || trip.status === "CANCELLED")
        throw new BusinessRuleError(409, "Trip is already closed");

      const wasDispatched = trip.status === "DISPATCHED";
      await tx.trip.update({
        where: { id: trip.id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      if (wasDispatched) {
        await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "AVAILABLE" } });
        await tx.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } });
      }
    });
    revalidatePaths();
    return { ok: true };
  } catch (err) {
    return toActionResult(err);
  }
}

// A status flip touches trips, the fleet, and driver rosters — refresh all three.
function revalidatePaths() {
  revalidatePath("/trips");
  revalidatePath("/vehicles");
  revalidatePath("/dashboard");
}

function toFormState(err: unknown): TripFormState {
  if (err instanceof AppError) return { ok: false, error: err.message };
  console.error("Trip action failed:", err);
  return { ok: false, error: "Something went wrong" };
}
function toActionResult(err: unknown): ActionResult {
  if (err instanceof AppError) return { ok: false, error: err.message };
  console.error("Trip action failed:", err);
  return { ok: false, error: "Something went wrong" };
}
