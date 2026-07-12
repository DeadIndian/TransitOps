"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  createDriver,
  updateDriver,
  setDriverStatus,
} from "@/modules/drivers/driver.service";
import { AppError } from "@/core/errors/AppError";

// Server actions for the Drivers screen. Each re-runs the service (role + Zod
// re-checked there), then revalidates the list. Errors come back as a plain
// serializable result the client renders inline — never thrown to the client.

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
  // Prisma unique-constraint (duplicate license number).
  if (typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002") {
    return {
      ok: false,
      error: "License number already exists.",
      fieldErrors: { licenseNumber: "Already registered" },
    };
  }
  if (err instanceof AppError) return { ok: false, error: err.message };
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function createDriverAction(input: unknown): Promise<ActionResult> {
  try {
    await createDriver(input);
    revalidatePath("/drivers");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function updateDriverAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    await updateDriver(id, input);
    revalidatePath("/drivers");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function setDriverStatusAction(
  id: string,
  status: string,
): Promise<ActionResult> {
  try {
    await setDriverStatus(id, { status });
    revalidatePath("/drivers");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}
