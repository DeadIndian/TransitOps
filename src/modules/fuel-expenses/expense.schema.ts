import { z } from "zod";
import { ExpenseCategory } from "@/generated/prisma/enums";

// Shared Zod schemas for the Fuel & Expenses domain (plan §6). Re-run inside the
// server actions so numeric > 0 and category ∈ {TOLL,MAINTENANCE,OTHER} can't be
// bypassed. Dates arrive as yyyy-mm-dd strings from <input type="date">.

const optionalDate = z
  .string()
  .optional()
  .refine((s) => !s || !Number.isNaN(Date.parse(s)), "Invalid date");

export const fuelLogInputSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  tripId: z.string().optional(), // optional link; blank → standalone log
  liters: z.coerce.number().positive("Liters must be greater than 0"),
  cost: z.coerce.number().positive("Cost must be greater than 0"),
  date: optionalDate,
});

export type FuelLogInput = z.infer<typeof fuelLogInputSchema>;

export const expenseInputSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  category: z.enum([
    ExpenseCategory.TOLL,
    ExpenseCategory.MAINTENANCE,
    ExpenseCategory.OTHER,
  ]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: optionalDate,
  notes: z.string().trim().max(200).optional(),
});

export type ExpenseInput = z.infer<typeof expenseInputSchema>;
