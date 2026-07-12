import { Role } from "@/generated/prisma/enums";
import { requireRole } from "@/core/security/rbac";
import { fuelLogInputSchema } from "./expense.schema";
import * as repo from "./fuelExpense.repository";

// Fuel-log service (plan §6). Financial Analyst owns Fuel & Expenses CRUD.
// Reads are shared with the Analytics-capable roles for cost attribution.

const CRUD_ROLES = [Role.FINANCIAL_ANALYST];
const READ_ROLES = [Role.FINANCIAL_ANALYST, Role.FLEET_MANAGER];

export async function getFuelLogs() {
  await requireRole(READ_ROLES);
  return repo.listFuelLogs();
}

export async function createFuelLog(raw: unknown) {
  await requireRole(CRUD_ROLES);
  const input = fuelLogInputSchema.parse(raw);
  return repo.insertFuelLog({
    vehicleId: input.vehicleId,
    tripId: input.tripId ? input.tripId : null,
    liters: input.liters,
    cost: input.cost,
    date: input.date ? new Date(input.date) : undefined,
  });
}
