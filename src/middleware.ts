import { NextResponse } from "next/server";

export function middleware() {
  // TODO: RBAC/auth redirect wiring later
  return NextResponse.next();
}

export const config = { matcher: [] };
