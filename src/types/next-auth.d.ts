import type { Role } from "@/generated/prisma/enums";
import { DefaultSession } from "next-auth";

// Put the user's role on the session + JWT so RBAC reads it type-safely.
declare module "next-auth" {
  interface Session {
    user: { role: Role } & DefaultSession["user"];
  }
  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
  }
}
