import { AppShell } from "@/components/shell/AppShell";

// Dashboard sits outside the role groups (all roles land here), so it carries
// its own shell wrapper.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
