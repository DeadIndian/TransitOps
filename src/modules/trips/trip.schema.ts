import { z } from "zod";

// Create-trip form (plan §4). Cargo-vs-capacity is a cross-row rule (Rule 5)
// checked at dispatch against the locked vehicle, not here — this only validates
// shape. IDs are re-validated against live status inside the dispatch txn.
export const CreateTripInput = z.object({
  source: z.string().trim().min(1, "Source is required"),
  destination: z.string().trim().min(1, "Destination is required"),
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().min(1, "Driver is required"),
  cargoWeightKg: z.coerce.number().positive("Cargo weight must be greater than 0"),
  plannedDistanceKm: z.coerce.number().positive("Planned distance must be greater than 0"),
});
export type CreateTripInput = z.input<typeof CreateTripInput>;

// Completion captures operator input on the same request that writes the FuelLog
// and rolls the odometer (Rule 7).
export const CompleteTripInput = z.object({
  actualDistanceKm: z.coerce.number().positive("Actual distance must be greater than 0"),
  fuelConsumedL: z.coerce.number().positive("Fuel consumed must be greater than 0"),
  fuelCost: z.coerce.number().min(0, "Fuel cost cannot be negative"),
});
export type CompleteTripInput = z.input<typeof CompleteTripInput>;
