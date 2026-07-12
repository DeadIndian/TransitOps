"use server";

import { exportAnalyticsCsv } from "@/modules/reports/report.service";
import { AppError } from "@/core/errors/AppError";

// Server action for the Analytics CSV export (plan §7 exportAnalyticsCsv).
// Returns the CSV text; the client turns it into a Blob download. Role checked
// inside the service.
export type ExportResult =
  | { ok: true; csv: string }
  | { ok: false; error: string };

export async function exportAnalyticsCsvAction(): Promise<ExportResult> {
  try {
    const csv = await exportAnalyticsCsv();
    return { ok: true, csv };
  } catch (err) {
    if (err instanceof AppError) return { ok: false, error: err.message };
    return { ok: false, error: "Export failed. Please try again." };
  }
}
