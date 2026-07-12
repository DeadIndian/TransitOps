import { redirect } from "next/navigation";
import { auth } from "@/core/security/auth";
import { navFor } from "@/core/security/rbac";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

// Authenticated app shell (plan §7): sidebar + topbar + content grid. Every
// role-group layout wraps its children in this. Reads the session server-side;
// proxy.ts already gates routes, this is the render-time role source.
export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar items={navFor(session.user.role)} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar name={session.user.name ?? "User"} role={session.user.role} />
        <main className="flex-1 p-4 sm:p-6 max-w-[1280px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
