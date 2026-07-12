import { getFuelLogs } from "@/modules/fuel-expenses/fuel.service";
import {
  getExpenses,
  getOperationalCost,
  getFormOptions,
} from "@/modules/fuel-expenses/expense.service";
import { formatDate } from "@/core/utils/formatters";
import {
  ExpensesClient,
  type FuelRow,
  type ExpenseRow,
} from "@/components/finance/ExpensesClient";

// Fuel & Expenses — server component (plan §6). Reads via the services
// (role-checked), serializes Decimals/Dates, and hands plain rows + the
// operational-cost rollup + select options to the client.
export default async function ExpensesPage() {
  const [fuelLogs, expenses, cost, options] = await Promise.all([
    getFuelLogs(),
    getExpenses(),
    getOperationalCost(),
    getFormOptions(),
  ]);

  const fuelRows: FuelRow[] = fuelLogs.map((f) => ({
    id: f.id,
    vehicleReg: f.vehicle.registrationNumber,
    tripLabel: f.tripId ? f.tripId.slice(0, 8) : null,
    dateDisplay: formatDate(f.date),
    liters: Number(f.liters),
    cost: Number(f.cost),
  }));

  const expenseRows: ExpenseRow[] = expenses.map((e) => ({
    id: e.id,
    vehicleReg: e.vehicle.registrationNumber,
    category: e.category,
    amount: Number(e.amount),
    dateDisplay: formatDate(e.date),
    notes: e.notes,
  }));

  const vehicleOpts = options.vehicles.map((v) => ({
    id: v.id,
    label: `${v.registrationNumber} — ${v.name}`,
  }));
  const tripOpts = options.trips.map((t) => ({
    id: t.id,
    label: `${t.source} → ${t.destination}`,
  }));

  return (
    <ExpensesClient
      fuelLogs={fuelRows}
      expenses={expenseRows}
      cost={cost}
      options={{ vehicles: vehicleOpts, trips: tripOpts }}
    />
  );
}
