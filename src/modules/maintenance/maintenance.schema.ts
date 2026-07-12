import { z } from "zod";

// Log-service form (plan §5). Status is chosen on create: ACTIVE sends the
// vehicle to IN_SHOP (Rule 9); CLOSED logs history without holding the vehicle.
export const MaintenanceInput = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  description: z.string().trim().min(1, "Description is required"),
  cost: z.coerce.number().min(0, "Cost cannot be negative"),
  status: z.enum(["ACTIVE", "CLOSED"]),
});
export type MaintenanceInput = z.input<typeof MaintenanceInput>;
