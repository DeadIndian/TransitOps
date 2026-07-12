import { signOut } from "@/core/security/auth";
import { Button } from "@/components/ui/Button";

// Top bar (plan §7): 56px, bottom border, user chip + sign-out. Server component;
// sign-out is an inline server action calling NextAuth's signOut.
export function Topbar({ name, role }: { name: string; role: string }) {
  return (
    <header className="h-14 shrink-0 flex items-center justify-end gap-4 px-6 border-b-[3px] border-ink bg-[var(--surface)]">
      <div className="flex items-center gap-2">
        <span className="inline-block h-7 w-7 bg-brand border-2 border-ink rounded-[3px]" />
        <div className="leading-tight">
          <div className="font-comic font-bold text-sm text-[var(--fg)]">{name}</div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-[var(--fg-dim)]">
            {role.replace(/_/g, " ")}
          </div>
        </div>
      </div>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <Button variant="secondary" size="sm" type="submit">
          Sign out
        </Button>
      </form>
    </header>
  );
}
