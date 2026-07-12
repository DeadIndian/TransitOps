import { getDrivers } from "@/modules/drivers/driver.service";
import { formatDate } from "@/core/utils/formatters";
import { DriversClient, type DriverRow } from "@/components/drivers/DriversClient";
import type { DriverStatus } from "@/generated/prisma/enums";

// Drivers & Safety — server component. Reads via the service (role-checked),
// serializes Prisma Decimals/Dates to plain values, and flags expired licenses
// (licenseExpiryDate < today, Rule 3 visual side) for the client table.
export default async function DriversPage() {
  const drivers = await getDrivers();

  // Compare on date only so a license expiring today isn't flagged early.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const rows: DriverRow[] = drivers.map((d) => ({
    id: d.id,
    name: d.name,
    licenseNumber: d.licenseNumber,
    licenseCategory: d.licenseCategory,
    licenseExpiryISO: d.licenseExpiryDate.toISOString().slice(0, 10),
    expiryDisplay: formatDate(d.licenseExpiryDate),
    contactNumber: d.contactNumber,
    safetyScore: Number(d.safetyScore),
    status: d.status as DriverStatus,
    expired: d.licenseExpiryDate < startOfToday,
  }));

  return <DriversClient drivers={rows} />;
}
