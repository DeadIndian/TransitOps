import { z } from "zod";
import { VEHICLE_TYPES } from "@/core/utils/constants";

// One Zod schema drives the form validation client-side and re-runs inside the
// server action (plan §Validation). Reg no is uppercased so the DB @unique check
// (Rule 1) is effectively case-insensitive.
export const VehicleInput = z.object({
  registrationNumber: z
    .string()
    .trim()
    .min(1, "Registration number is required")
    .transform((s) => s.toUpperCase()),
  name: z.string().trim().min(1, "Name is required"),
  type: z.enum(VEHICLE_TYPES),
  maxLoadCapacityKg: z.coerce.number().positive("Capacity must be greater than 0"),
  odometerKm: z.coerce.number().min(0, "Odometer cannot be negative"),
  acquisitionCost: z.coerce.number().min(0, "Cost cannot be negative"),
  region: z
    .string()
    .trim()
    .optional()
    .transform((s) => (s ? s : null)),
});

export type VehicleInput = z.input<typeof VehicleInput>;
export type VehicleData = z.output<typeof VehicleInput>;
