import { prisma } from "@/core/database/prisma";
import type { DriverStatus } from "@/generated/prisma/enums";

// Thin data-access layer for drivers (plan §modules). All Prisma access for the
// driver domain routes through here; the service holds the business rules.

export function listDrivers() {
  return prisma.driver.findMany({ orderBy: { name: "asc" } });
}

export function findDriverById(id: string) {
  return prisma.driver.findUnique({ where: { id } });
}

export function insertDriver(data: {
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: Date;
  contactNumber: string;
  safetyScore: number;
}) {
  return prisma.driver.create({ data });
}

export function updateDriverRow(
  id: string,
  data: {
    name: string;
    licenseNumber: string;
    licenseCategory: string;
    licenseExpiryDate: Date;
    contactNumber: string;
    safetyScore: number;
  },
) {
  return prisma.driver.update({ where: { id }, data });
}

export function updateDriverStatus(id: string, status: DriverStatus) {
  return prisma.driver.update({ where: { id }, data: { status } });
}
