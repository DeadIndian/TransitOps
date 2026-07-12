import { Role } from "@/generated/prisma/enums";
import { requireRole } from "@/core/security/rbac";
import { expenseInputSchema } from "./expense.schema";
import * as repo from "./fuelExpense.repository";

// Expense service + operational-cost rollup (plan §6). Financial Analyst owns
// writes; Fleet Manager may read for cost attribution / analytics.

const CRUD_ROLES = [Role.FINANCIAL_ANALYST];
const READ_ROLES = [Role.FINANCIAL_ANALYST, Role.FLEET_MANAGER];

export async function getExpenses() {
  await requireRole(READ_ROLES);
  return repo.listExpenses();
}

export async function createExpense(raw: unknown) {
  await requireRole(CRUD_ROLES);
  const input = expenseInputSchema.parse(raw);
  return repo.insertExpense({
    vehicleId: input.vehicleId,
    category: input.category,
    amount: input.amount,
    date: input.date ? new Date(input.date) : undefined,
    notes: input.notes ? input.notes : null,
  });
}

// Σ fuel + Σ maintenance + Σ expenses(TOLL,OTHER) — the /expenses banner value.
export async function getOperationalCost() {
  await requireRole(READ_ROLES);
  return repo.computeOperationalCost();
}

// Vehicle + trip option lists for the modal selects.
export async function getFormOptions() {
  await requireRole(CRUD_ROLES);
  const [vehicles, trips] = await Promise.all([
    repo.listVehiclesForSelect(),
    repo.listTripsForSelect(),
  ]);
  return { vehicles, trips };
}
