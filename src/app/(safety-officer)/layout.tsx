import { AppShell } from "@/components/shell/AppShell";

// Role route-group layout — wraps pages in the authenticated shell. RBAC route
// gating lives in proxy.ts; AppShell resolves the session role for nav render.
export default function RoleGroupLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
