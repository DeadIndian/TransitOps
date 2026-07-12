import { Role, DriverStatus } from "@/generated/prisma/enums";
import { requireRole } from "@/core/security/rbac";
import { BusinessRuleError } from "@/core/errors/BusinessRuleError";
import {
  driverInputSchema,
  setDriverStatusSchema,
  type DriverInput,
} from "./driver.schema";
import * as repo from "./driver.repository";

// Drivers & Safety domain service (plan §3). Reads open to the two CRUD roles;
// every mutation re-checks the role (defense-in-depth beyond proxy.ts) and
// re-validates input with the shared Zod schema.

const CRUD_ROLES = [Role.SAFETY_OFFICER, Role.FLEET_MANAGER];

export async function getDrivers() {
  await requireRole(CRUD_ROLES);
  return repo.listDrivers();
}

function toRow(input: DriverInput) {
  return {
    name: input.name,
    licenseNumber: input.licenseNumber.toUpperCase(),
    licenseCategory: input.licenseCategory,
    licenseExpiryDate: new Date(input.licenseExpiryDate),
    contactNumber: input.contactNumber,
    safetyScore: input.safetyScore,
  };
}

export async function createDriver(raw: unknown) {
  await requireRole(CRUD_ROLES);
  const input = driverInputSchema.parse(raw);
  return repo.insertDriver(toRow(input));
}

export async function updateDriver(id: string, raw: unknown) {
  await requireRole(CRUD_ROLES);
  const input = driverInputSchema.parse(raw);
  return repo.updateDriverRow(id, toRow(input));
}

// Available / Off Duty / Suspended only. A driver currently ON_TRIP is locked —
// their status flips back to Available only when the trip completes/cancels.
export async function setDriverStatus(id: string, raw: unknown) {
  await requireRole(CRUD_ROLES);
  const { status } = setDriverStatusSchema.parse(raw);

  const driver = await repo.findDriverById(id);
  if (!driver) throw new BusinessRuleError(404, "Driver not found");
  if (driver.status === DriverStatus.ON_TRIP)
    throw new BusinessRuleError(
      409,
      "Driver is on a trip — status changes automatically when the trip ends",
    );

  return repo.updateDriverStatus(id, status);
}
