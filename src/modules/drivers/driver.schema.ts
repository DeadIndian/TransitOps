import { z } from "zod";
import { LICENSE_CATEGORIES } from "@/core/utils/constants";
import { DriverStatus } from "@/generated/prisma/enums";

// Shared Zod schema — powers the client form AND re-runs inside the server
// action, so validation (category ∈ {LMV,HMV}, safety 0–100, expiry required)
// can never be bypassed by the client (plan §Validation).

export const driverInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  licenseNumber: z.string().trim().min(1, "License number is required").max(40),
  licenseCategory: z.enum(LICENSE_CATEGORIES, {
    errorMap: () => ({ message: "Category must be LMV or HMV" }),
  }),
  // date-only string from <input type="date">.
  licenseExpiryDate: z
    .string()
    .min(1, "License expiry is required")
    .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date"),
  contactNumber: z.string().trim().min(1, "Contact is required").max(20),
  safetyScore: z.coerce.number().min(0, "Min 0").max(100, "Max 100"),
});

export type DriverInput = z.infer<typeof driverInputSchema>;

// Status toggle — only these three are user-settable; ON_TRIP is system-only
// (set by the dispatcher), never from the Drivers screen (plan §3).
export const settableDriverStatuses = [
  DriverStatus.AVAILABLE,
  DriverStatus.OFF_DUTY,
  DriverStatus.SUSPENDED,
] as const;

export const setDriverStatusSchema = z.object({
  status: z.enum([
    DriverStatus.AVAILABLE,
    DriverStatus.OFF_DUTY,
    DriverStatus.SUSPENDED,
  ]),
});
