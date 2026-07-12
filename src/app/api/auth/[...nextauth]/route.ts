import { NextResponse } from "next/server";

// TODO: replace with NextAuth handlers once auth provider chosen
export async function GET() {
  return NextResponse.json({ error: "not configured" }, { status: 501 });
}

export const POST = GET;
