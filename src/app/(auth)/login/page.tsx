import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/core/security/auth";
import { Role } from "@/generated/prisma/enums";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const ROLE_LABELS: Record<Role, string> = {
  FLEET_MANAGER: "Fleet Manager",
  DRIVER: "Driver",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
};

// Server action — signIn throws NEXT_REDIRECT on success (must propagate) and
// AuthError on bad credentials (→ ?error). Selected role must match (see auth.ts).
async function login(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) redirect("/login?error=1");
    throw error;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await auth()) redirect("/dashboard");
  const { error } = await searchParams;

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden md:flex flex-col justify-center gap-4 p-12 bg-brand text-ink border-r-[3px] border-ink">
        <div className="inline-block h-12 w-12 bg-ink" />
        <h1 className="font-comic font-bold text-[44px] leading-[46px]">TransitOps</h1>
        <p className="font-comic text-lg max-w-sm">One login, four roles. Serious fleet infrastructure in a Comic-Sans grin.</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 bg-[var(--bg)]">
        <Card className="w-full max-w-sm">
          <h2 className="font-comic font-bold text-2xl mb-4">Sign in</h2>
          <form action={login} className="flex flex-col gap-4">
            <Input name="email" type="email" label="Email" required autoComplete="email" />
            <Input name="password" type="password" label="Password" required autoComplete="current-password" />
            <Select name="role" label="Role" defaultValue="" required>
              <option value="" disabled>Select role…</option>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
            {error && (
              <p className="font-mono text-[11px] text-red border-2 border-red rounded-[4px] px-2 py-1">
                Invalid credentials.
              </p>
            )}
            <Button type="submit" className="w-full">Sign In</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
