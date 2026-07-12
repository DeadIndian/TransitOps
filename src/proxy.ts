import { NextResponse } from "next/server";
import { auth } from "@/core/security/auth";
import { canAccessRoute } from "@/core/security/rbac";

// Next 16 renamed `middleware` → `proxy` (Node runtime by default), so the
// full auth config (Prisma + bcrypt) can run here directly — no edge split.
// Route-level RBAC: unauthenticated → /login; wrong role → /dashboard.
export default auth((req) => {
  const role = req.auth?.user?.role;
  const { pathname } = req.nextUrl;

  if (!role) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (!canAccessRoute(pathname, role)) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
  return NextResponse.next();
});

// Run on everything except API routes, static assets, and the public login page.
export const config = {
  matcher: ["/((?!api|login|_next/static|_next/image|favicon.ico).*)"],
};
