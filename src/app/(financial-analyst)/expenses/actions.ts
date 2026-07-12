"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { createFuelLog } from "@/modules/fuel-expenses/fuel.service";
import { createExpense } from "@/modules/fuel-expenses/expense.service";
import { AppError } from "@/core/errors/AppError";

// Server actions for the Fuel & Expenses screen. Service re-checks role + Zod;
// errors return as a serializable result rendered inline in the modal.

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function fail(err: unknown): ActionResult {
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }
  if (err instanceof AppError) return { ok: false, error: err.message };
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function createFuelLogAction(input: unknown): Promise<ActionResult> {
  try {
    await createFuelLog(input);
    revalidatePath("/expenses");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function createExpenseAction(input: unknown): Promise<ActionResult> {
  try {
    await createExpense(input);
    revalidatePath("/expenses");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}
