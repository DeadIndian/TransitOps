import type {
  VehicleStatus,
  DriverStatus,
  TripStatus,
  MaintenanceStatus,
} from "@/generated/prisma/enums";

// Design-system pill colors (maps to the status tokens in globals.css §3).
export type PillColor =
  | "green"
  | "blue"
  | "orange"
  | "redpink"
  | "red"
  | "grey";

// One status → { label, color } map per entity. UI reads this so pill styling and
// labels stay consistent across every screen (dashboard, fleet, trips, drivers…).
export const VEHICLE_STATUS: Record<VehicleStatus, { label: string; color: PillColor }> = {
  AVAILABLE: { label: "Available", color: "green" },
  ON_TRIP: { label: "On Trip", color: "blue" },
  IN_SHOP: { label: "In Shop", color: "orange" },
  RETIRED: { label: "Retired", color: "redpink" },
};

export const DRIVER_STATUS: Record<DriverStatus, { label: string; color: PillColor }> = {
  AVAILABLE: { label: "Available", color: "green" },
  ON_TRIP: { label: "On Trip", color: "blue" },
  OFF_DUTY: { label: "Off Duty", color: "grey" },
  SUSPENDED: { label: "Suspended", color: "orange" },
};

export const TRIP_STATUS: Record<TripStatus, { label: string; color: PillColor }> = {
  DRAFT: { label: "Draft", color: "grey" },
  DISPATCHED: { label: "Dispatched", color: "blue" },
  COMPLETED: { label: "Completed", color: "green" },
  CANCELLED: { label: "Cancelled", color: "red" },
};

// Maintenance status surfaces in the UI as In Shop / Completed (see plan §5.5).
export const MAINTENANCE_STATUS: Record<MaintenanceStatus, { label: string; color: PillColor }> = {
  ACTIVE: { label: "In Shop", color: "orange" },
  CLOSED: { label: "Completed", color: "green" },
};

// Zod-validated value sets shared client + server (plan: type ∈ ..., category ∈ {LMV,HMV}).
export const VEHICLE_TYPES = ["Van", "Truck", "Mini"] as const;
export const LICENSE_CATEGORIES = ["LMV", "HMV"] as const;
