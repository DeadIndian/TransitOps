"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { exportAnalyticsCsvAction } from "@/app/(financial-analyst)/reports/actions";

// Export CSV button (plan §7). Calls the export action, then triggers a client
// download of the returned CSV. Disabled while empty or generating.
export function ExportButton({ disabled }: { disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const res = await exportAnalyticsCsvAction();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "transitops-analytics.csv";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={onClick} disabled={disabled || pending}>
        {pending ? "Generating…" : "Export CSV"}
      </Button>
      {error && <span className="font-mono text-[11px] text-red">{error}</span>}
    </div>
  );
}
