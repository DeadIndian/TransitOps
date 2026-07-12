"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/core/database/prisma";
import { requireRole } from "@/core/security/rbac";
import { AppError } from "@/core/errors/AppError";
import { BusinessRuleError } from "@/core/errors/BusinessRuleError";
import { VehicleInput } from "./vehicle.schema";

// Server-action result the /vehicles form reads to show inline field errors
// (Rule 1 duplicate reg-no) without throwing across the boundary.
export type VehicleFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function parseForm(formData: FormData) {
  return VehicleInput.safeParse({
    registrationNumber: formData.get("registrationNumber"),
    name: formData.get("name"),
    type: formData.get("type"),
    maxLoadCapacityKg: formData.get("maxLoadCapacityKg"),
    odometerKm: formData.get("odometerKm"),
    acquisitionCost: formData.get("acquisitionCost"),
    region: formData.get("region"),
  });
}

function zodToFieldErrors(error: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

export async function createVehicle(
  _prev: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  try {
    await requireRole(["FLEET_MANAGER"]);
    const parsed = parseForm(formData);
    if (!parsed.success) return { ok: false, fieldErrors: zodToFieldErrors(parsed.error) };

    await prisma.vehicle.create({ data: parsed.data });
    revalidatePath("/vehicles");
    return { ok: true };
  } catch (err) {
    return toFormState(err);
  }
}

export async function updateVehicle(
  id: string,
  _prev: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  try {
    await requireRole(["FLEET_MANAGER"]);
    const parsed = parseForm(formData);
    if (!parsed.success) return { ok: false, fieldErrors: zodToFieldErrors(parsed.error) };

    await prisma.vehicle.update({ where: { id }, data: parsed.data });
    revalidatePath("/vehicles");
    return { ok: true };
  } catch (err) {
    return toFormState(err);
  }
}

// Retire → RETIRED (Rule 2). Illegal from ON_TRIP: a retired vehicle must not
// be mid-trip (complete/cancel the trip first), so guard against it.
export async function retireVehicle(id: string): Promise<void> {
  await requireRole(["FLEET_MANAGER"]);
  const vehicle = await prisma.vehicle.findUniqueOrThrow({ where: { id } });
  if (vehicle.status === "ON_TRIP")
    throw new BusinessRuleError(409, "Vehicle is on a trip — complete or cancel it first");
  if (vehicle.status === "RETIRED") return;

  await prisma.vehicle.update({ where: { id }, data: { status: "RETIRED" } });
  revalidatePath("/vehicles");
}

function toFormState(err: unknown): VehicleFormState {
  // Postgres unique violation on registrationNumber (Rule 1) → inline field error.
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return {
      ok: false,
      fieldErrors: { registrationNumber: "Registration number already exists" },
    };
  }
  if (err instanceof AppError) return { ok: false, error: err.message };
  console.error("Vehicle action failed:", err);
  return { ok: false, error: "Something went wrong" };
}
