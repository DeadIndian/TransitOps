import Link from "next/link";
import type { Role } from "@/generated/prisma/enums";
import { navFor } from "@/core/security/rbac";

// Fixed left rail, ink background, RBAC-filtered nav (plan §7). Server component —
// receives the role from the shell so it renders only permitted items.
export function Sidebar({ role }: { role: Role }) {
  return (
    <aside className="w-[220px] shrink-0 bg-ink border-r-[3px] border-ink text-paper flex flex-col">
      <div className="flex items-center gap-2 px-4 h-14 border-b-[3px] border-paper/20">
        <span className="inline-block h-6 w-6 bg-brand border-2 border-paper rounded-[3px]" />
        <span className="font-comic font-bold text-lg">TransitOps</span>
      </div>
      <nav className="flex flex-col p-2 gap-1">
        {navFor(role).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-[4px] font-comic hover:bg-panel-3 transition-transform hover:translate-x-0.5"
          >
            <span aria-hidden className="text-brand">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
