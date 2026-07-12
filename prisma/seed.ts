import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Demo password shared across the 4 role accounts.
const DEMO_PASSWORD = "transit123";

// Idempotent seed (plan §"Seed Data Strategy"): upsert the entities keyed on their
// unique columns, then rebuild the transactional rows so a re-run resets cleanly.
async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const now = new Date();
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 86_400_000);

  // ── Users (one per role) ────────────────────────────────────────────
  const users = [
    { name: "Manny Fleet", email: "manager@transitops.dev", role: "FLEET_MANAGER" as const },
    { name: "Dana Driver", email: "driver@transitops.dev", role: "DRIVER" as const },
    { name: "Sam Safety", email: "safety@transitops.dev", role: "SAFETY_OFFICER" as const },
    { name: "Fran Finance", email: "finance@transitops.dev", role: "FINANCIAL_ANALYST" as const },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, passwordHash },
      create: { ...u, passwordHash },
    });
  }
  const driverUser = await prisma.user.findUniqueOrThrow({ where: { email: "driver@transitops.dev" } });

  // ── Vehicles (6, statuses spread) ───────────────────────────────────
  const vehicles = [
    { registrationNumber: "VAN-05", name: "Ford Transit", type: "Van", maxLoadCapacityKg: 500, odometerKm: 42000, acquisitionCost: 1800000, status: "AVAILABLE" as const, region: "West" },
    { registrationNumber: "TRUCK-11", name: "Tata LPT", type: "Truck", maxLoadCapacityKg: 9000, odometerKm: 128000, acquisitionCost: 3500000, status: "ON_TRIP" as const, region: "North" },
    { registrationNumber: "MINI-03", name: "Maruti Eeco", type: "Mini", maxLoadCapacityKg: 600, odometerKm: 31000, acquisitionCost: 700000, status: "IN_SHOP" as const, region: "South" },
    { registrationNumber: "VAN-09", name: "Mahindra Supro", type: "Van", maxLoadCapacityKg: 750, odometerKm: 58000, acquisitionCost: 1200000, status: "AVAILABLE" as const, region: "East" },
    { registrationNumber: "TRUCK-22", name: "Ashok Leyland", type: "Truck", maxLoadCapacityKg: 12000, odometerKm: 205000, acquisitionCost: 4200000, status: "AVAILABLE" as const, region: "West" },
    { registrationNumber: "VAN-14", name: "Force Traveller", type: "Van", maxLoadCapacityKg: 550, odometerKm: 99000, acquisitionCost: 1500000, status: "RETIRED" as const, region: "North" },
  ];
  const vehicleByReg: Record<string, string> = {};
  for (const v of vehicles) {
    const row = await prisma.vehicle.upsert({
      where: { registrationNumber: v.registrationNumber },
      update: v,
      create: v,
    });
    vehicleByReg[v.registrationNumber] = row.id;
  }

  // ── Drivers (5; one expired license, one suspended) ─────────────────
  const drivers = [
    { name: "Alex Rao", licenseNumber: "LMV-1001", licenseCategory: "LMV", licenseExpiryDate: daysFromNow(400), contactNumber: "9000000001", safetyScore: 96, status: "AVAILABLE" as const, userId: driverUser.id },
    { name: "John Mathew", licenseNumber: "HMV-2002", licenseCategory: "HMV", licenseExpiryDate: daysFromNow(220), contactNumber: "9000000002", safetyScore: 88, status: "ON_TRIP" as const, userId: null },
    { name: "Priya Nair", licenseNumber: "LMV-3003", licenseCategory: "LMV", licenseExpiryDate: daysFromNow(-10), contactNumber: "9000000003", safetyScore: 74, status: "AVAILABLE" as const, userId: null }, // expired → gated
    { name: "Suresh Kumar", licenseNumber: "HMV-4004", licenseCategory: "HMV", licenseExpiryDate: daysFromNow(150), contactNumber: "9000000004", safetyScore: 51, status: "SUSPENDED" as const, userId: null },
    { name: "Meera Iyer", licenseNumber: "LMV-5005", licenseCategory: "LMV", licenseExpiryDate: daysFromNow(600), contactNumber: "9000000005", safetyScore: 100, status: "AVAILABLE" as const, userId: null },
  ];
  const driverByLicense: Record<string, string> = {};
  for (const d of drivers) {
    const row = await prisma.driver.upsert({
      where: { licenseNumber: d.licenseNumber },
      update: d,
      create: d,
    });
    driverByLicense[d.licenseNumber] = row.id;
  }

  // ── Rebuild transactional rows (children first for FKs) ──────────────
  await prisma.fuelLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();

  // Trips (4): DISPATCHED (locks TRUCK-11 + John), COMPLETED (real distance/fuel),
  // DRAFT, CANCELLED — so every pill and the analytics KPIs render populated.
  const dispatched = await prisma.trip.create({
    data: {
      source: "Mumbai", destination: "Pune",
      vehicleId: vehicleByReg["TRUCK-11"], driverId: driverByLicense["HMV-2002"],
      cargoWeightKg: 7200, plannedDistanceKm: 150, status: "DISPATCHED", dispatchedAt: daysFromNow(-1),
    },
  });
  const completed = await prisma.trip.create({
    data: {
      source: "Delhi", destination: "Jaipur",
      vehicleId: vehicleByReg["VAN-05"], driverId: driverByLicense["LMV-1001"],
      cargoWeightKg: 400, plannedDistanceKm: 280, actualDistanceKm: 290, fuelConsumedL: 35,
      status: "COMPLETED", dispatchedAt: daysFromNow(-6), completedAt: daysFromNow(-5),
    },
  });
  await prisma.trip.create({
    data: {
      source: "Chennai", destination: "Bengaluru",
      vehicleId: vehicleByReg["VAN-09"], driverId: driverByLicense["LMV-5005"],
      cargoWeightKg: 500, plannedDistanceKm: 350, status: "DRAFT",
    },
  });
  await prisma.trip.create({
    data: {
      source: "Kolkata", destination: "Ranchi",
      vehicleId: vehicleByReg["TRUCK-22"], driverId: driverByLicense["LMV-5005"],
      cargoWeightKg: 8000, plannedDistanceKm: 400, status: "CANCELLED", cancelledAt: daysFromNow(-2),
    },
  });

  // Maintenance: one ACTIVE keeps MINI-03 IN_SHOP; one CLOSED on VAN-05.
  await prisma.maintenanceLog.create({
    data: { vehicleId: vehicleByReg["MINI-03"], description: "Clutch replacement", cost: 4500, status: "ACTIVE", openedAt: daysFromNow(-3) },
  });
  await prisma.maintenanceLog.create({
    data: { vehicleId: vehicleByReg["VAN-05"], description: "Oil change", cost: 3000, status: "CLOSED", openedAt: daysFromNow(-20), closedAt: daysFromNow(-19) },
  });

  // Fuel logs: the completed trip's fuel + a couple standalone refuels.
  await prisma.fuelLog.create({
    data: { vehicleId: vehicleByReg["VAN-05"], tripId: completed.id, liters: 35, cost: 3500, date: daysFromNow(-5) },
  });
  await prisma.fuelLog.create({
    data: { vehicleId: vehicleByReg["TRUCK-11"], tripId: dispatched.id, liters: 60, cost: 6600, date: daysFromNow(-1) },
  });
  await prisma.fuelLog.create({
    data: { vehicleId: vehicleByReg["VAN-09"], liters: 40, cost: 4000, date: daysFromNow(-8) },
  });

  // Expenses (TOLL/OTHER feed Operational Cost; MAINTENANCE is display-only).
  await prisma.expense.createMany({
    data: [
      { vehicleId: vehicleByReg["TRUCK-11"], category: "TOLL", amount: 1200, date: daysFromNow(-1), notes: "NH toll" },
      { vehicleId: vehicleByReg["VAN-05"], category: "OTHER", amount: 800, date: daysFromNow(-5), notes: "Parking" },
      { vehicleId: vehicleByReg["MINI-03"], category: "MAINTENANCE", amount: 4500, date: daysFromNow(-3), notes: "Mirror of maintenance log (display-only)" },
    ],
  });

  console.log("Seed complete: 4 users, 6 vehicles, 5 drivers, 4 trips + logs/expenses.");
  console.log(`Demo login password: ${DEMO_PASSWORD}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
