import { Role } from "@/generated/prisma/enums";
import { BusinessRuleError } from "@/core/errors/BusinessRuleError";
import { auth } from "./auth";

// ── RBAC matrix (plan §6) ──────────────────────────────────────────────
// '✓' = full CRUD, 'view' = read-only, '-' = no access.
export type Access = "crud" | "view" | "none";
export type Domain =
  | "fleet"
  | "drivers"
  | "trips"
  | "expenses"
  | "maintenance"
  | "analytics";

export const MATRIX: Record<Role, Record<Domain, Access>> = {
  FLEET_MANAGER: { fleet: "crud", drivers: "crud", trips: "view", expenses: "none", maintenance: "crud", analytics: "crud" },
  DRIVER:        { fleet: "view", drivers: "none", trips: "crud", expenses: "none", maintenance: "none", analytics: "none" },
  SAFETY_OFFICER:{ fleet: "none", drivers: "crud", trips: "view", expenses: "none", maintenance: "none", analytics: "none" },
  FINANCIAL_ANALYST:{ fleet: "view", drivers: "none", trips: "none", expenses: "crud", maintenance: "none", analytics: "crud" },
};

// ── Sidebar nav ────────────────────────────────────────────────────────
// href matches the on-disk route folders (source of truth for what resolves).
// A role sees an item if it has any access (view or crud) to that domain.
export type NavItem = { href: string; label: string; icon: string; domain: Domain | null };

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "▦", domain: null },
  { href: "/vehicles", label: "Fleet", icon: "▤", domain: "fleet" },
  { href: "/drivers", label: "Drivers", icon: "▥", domain: "drivers" },
  { href: "/trips", label: "Trips", icon: "▧", domain: "trips" },
  { href: "/maintenance", label: "Maintenance", icon: "▨", domain: "maintenance" },
  { href: "/expenses", label: "Fuel & Expenses", icon: "▩", domain: "expenses" },
  { href: "/reports", label: "Analytics", icon: "▣", domain: "analytics" },
];

export function navFor(role: Role): NavItem[] {
  return NAV_ITEMS.filter((i) => i.domain === null || MATRIX[role][i.domain] !== "none");
}

// ── Route gate (used by proxy.ts) ──────────────────────────────────────
// Any authenticated role may reach /dashboard and unknown paths; the six
// protected route prefixes require the domain to be non-'none' for the role.
export function canAccessRoute(pathname: string, role: Role): boolean {
  const guarded: { prefix: string; domain: Domain }[] = [
    { prefix: "/vehicles", domain: "fleet" },
    { prefix: "/drivers", domain: "drivers" },
    { prefix: "/trips", domain: "trips" },
    { prefix: "/maintenance", domain: "maintenance" },
    { prefix: "/expenses", domain: "expenses" },
    { prefix: "/reports", domain: "analytics" },
  ];
  const hit = guarded.find((g) => pathname.startsWith(g.prefix));
  return hit ? MATRIX[role][hit.domain] !== "none" : true;
}

// ── Server-action guard (the authoritative check, plan §6) ─────────────
// A mutating action passes only the CRUD-capable roles; a read passes all
// roles with any access. Throws 401/403 mapped to a response by errorHandler.
export async function requireRole(allowed: Role[]) {
  const session = await auth();
  if (!session?.user) throw new BusinessRuleError(401, "Not authenticated");
  if (!allowed.includes(session.user.role))
    throw new BusinessRuleError(403, "Forbidden");
  return session;
}
