import { prisma } from "@/core/database/prisma";
import { ExpenseCategory } from "@/generated/prisma/enums";

// Data-access for the Fuel & Expenses domain (plan §6). Fuel logs and expenses
// share this file; the operational-cost rollup lives here too since it spans
// fuel_logs + maintenance_logs + expenses.

export function listFuelLogs() {
  return prisma.fuelLog.findMany({
    orderBy: { date: "desc" },
    include: { vehicle: { select: { registrationNumber: true } } },
  });
}

export function listExpenses() {
  return prisma.expense.findMany({
    orderBy: { date: "desc" },
    include: { vehicle: { select: { registrationNumber: true } } },
  });
}

// Vehicles + trips for the modal selects (plan §6: "selects from existing records").
export function listVehiclesForSelect() {
  return prisma.vehicle.findMany({
    orderBy: { registrationNumber: "asc" },
    select: { id: true, registrationNumber: true, name: true },
  });
}

export function listTripsForSelect() {
  return prisma.trip.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, source: true, destination: true },
  });
}

export function insertFuelLog(data: {
  vehicleId: string;
  tripId: string | null;
  liters: number;
  cost: number;
  date?: Date;
}) {
  return prisma.fuelLog.create({ data });
}

export function insertExpense(data: {
  vehicleId: string;
  category: ExpenseCategory;
  amount: number;
  date?: Date;
  notes?: string | null;
}) {
  return prisma.expense.create({ data });
}

// Operational Cost = Σ fuel_logs.cost + Σ maintenance_logs.cost
//                    + Σ expenses.amount WHERE category IN ('TOLL','OTHER').
// MAINTENANCE-category expenses are display-only and excluded here so
// maintenance is never double-counted (it comes from maintenance_logs).
export async function computeOperationalCost() {
  const [fuel, maintenance, expenses] = await Promise.all([
    prisma.fuelLog.aggregate({ _sum: { cost: true } }),
    prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { category: { in: [ExpenseCategory.TOLL, ExpenseCategory.OTHER] } },
    }),
  ]);

  const fuelCost = Number(fuel._sum.cost ?? 0);
  const maintenanceCost = Number(maintenance._sum.cost ?? 0);
  const expenseCost = Number(expenses._sum.amount ?? 0);

  return {
    fuel: fuelCost,
    maintenance: maintenanceCost,
    expenses: expenseCost,
    total: fuelCost + maintenanceCost + expenseCost,
  };
}
