import { NextResponse } from "next/server";
import { AppError } from "./AppError";

// Maps any thrown error to a JSON response — the single place API route handlers
// convert exceptions into responses. Unknown errors become an opaque 500.
export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode });
  }
  console.error("Unhandled error:", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
