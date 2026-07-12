"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/core/database/prisma";
import type { Vehicle } from "@/generated/prisma/client";
import { requireRole } from "@/core/security/rbac";
import { AppError } from "@/core/errors/AppError";
import { BusinessRuleError } from "@/core/errors/BusinessRuleError";
import { MaintenanceInput } from "./maintenance.schema";

export type MaintenanceFormState = {
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

// Create a service record. An ACTIVE record sends the vehicle to IN_SHOP in the
// same transaction (Rule 9); opening on an On-Trip/Retired vehicle is rejected.
export async function createMaintenanceLog(
  _prev: MaintenanceFormState,
  formData: FormData,
): Promise<MaintenanceFormState> {
  try {
    await requireRole(["FLEET_MANAGER"]);
    const parsed = MaintenanceInput.safeParse({
      vehicleId: formData.get("vehicleId"),
      description: formData.get("description"),
      cost: formData.get("cost"),
      status: formData.get("status"),
    });
    if (!parsed.success) return { ok: false, fieldErrors: zodToFieldErrors(parsed.error) };
    const { vehicleId, description, cost, status } = parsed.data;

    await prisma.$transaction(async (tx) => {
      const [vehicle] = await tx.$queryRaw<Vehicle[]>`
        SELECT * FROM vehicles WHERE id = ${vehicleId} FOR UPDATE`;
      if (!vehicle) throw new BusinessRuleError(404, "Vehicle not found");
      if (vehicle.status === "ON_TRIP") throw new BusinessRuleError(409, "Vehicle is on a trip");
      if (vehicle.status === "RETIRED") throw new BusinessRuleError(409, "Vehicle is retired");

      await tx.maintenanceLog.create({
        data: { vehicleId, description, cost, status, closedAt: status === "CLOSED" ? new Date() : null },
      });
      // Only an ACTIVE record holds the vehicle in the shop (Rule 9).
      if (status === "ACTIVE" && vehicle.status !== "IN_SHOP") {
        await tx.vehicle.update({ where: { id: vehicleId }, data: { status: "IN_SHOP" } });
      }
    });
    revalidatePaths();
    return { ok: true };
  } catch (err) {
    return toFormState(err);
  }
}

// Close a record (Rule 10): set CLOSED + closedAt, and return the vehicle to
// AVAILABLE only if it is not Retired and no other ACTIVE log remains for it.
export async function closeMaintenanceLog(id: string): Promise<ActionResult> {
  try {
    await requireRole(["FLEET_MANAGER"]);
    await prisma.$transaction(async (tx) => {
      const log = await tx.maintenanceLog.findUniqueOrThrow({ where: { id } });
      if (log.status === "CLOSED") throw new BusinessRuleError(409, "Record already closed");

      await tx.maintenanceLog.update({
        where: { id },
        data: { status: "CLOSED", closedAt: new Date() },
      });

      const [vehicle] = await tx.$queryRaw<Vehicle[]>`
        SELECT * FROM vehicles WHERE id = ${log.vehicleId} FOR UPDATE`;
      const otherActive = await tx.maintenanceLog.count({
        where: { vehicleId: log.vehicleId, status: "ACTIVE", id: { not: id } },
      });
      if (vehicle && vehicle.status !== "RETIRED" && otherActive === 0) {
        await tx.vehicle.update({ where: { id: log.vehicleId }, data: { status: "AVAILABLE" } });
      }
    });
    revalidatePaths();
    return { ok: true };
  } catch (err) {
    return toActionResult(err);
  }
}

function revalidatePaths() {
  revalidatePath("/maintenance");
  revalidatePath("/vehicles");
  revalidatePath("/dashboard");
}

function toFormState(err: unknown): MaintenanceFormState {
  if (err instanceof AppError) return { ok: false, error: err.message };
  console.error("Maintenance action failed:", err);
  return { ok: false, error: "Something went wrong" };
}
function toActionResult(err: unknown): ActionResult {
  if (err instanceof AppError) return { ok: false, error: err.message };
  console.error("Maintenance action failed:", err);
  return { ok: false, error: "Something went wrong" };
}
