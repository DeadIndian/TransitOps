"use client";

import { useActionState, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pill } from "@/components/ui/Pill";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/Table";
import { MAINTENANCE_STATUS } from "@/core/utils/constants";
import { formatCurrency, formatDate } from "@/core/utils/formatters";
import type {
  MaintenanceRow,
  MaintenanceVehicle,
} from "@/modules/maintenance/maintenance.repository";
import {
  createMaintenanceLog,
  closeMaintenanceLog,
  type MaintenanceFormState,
} from "@/modules/maintenance/maintenance.service";

const EMPTY: MaintenanceFormState = { ok: false };

export function MaintenanceBoard({
  logs,
  vehicles,
}: {
  logs: MaintenanceRow[];
  vehicles: MaintenanceVehicle[];
}) {
  const [state, formAction, pending] = useActionState(createMaintenanceLog, EMPTY);
  const fe = state.fieldErrors ?? {};

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
      <Card className="h-fit">
        <h2 className="font-comic font-bold text-xl mb-3">Log Service</h2>
        {/* key resets the uncontrolled form after a successful submit. */}
        <form key={state.ok ? "done" : "form"} action={formAction} className="flex flex-col gap-3">
          <Select name="vehicleId" label="Vehicle" error={fe.vehicleId} defaultValue="" required>
            <option value="" disabled>
              {vehicles.length ? "Select vehicle…" : "None available"}
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </Select>
          <Input name="description" label="Description" error={fe.description} required />
          <Input name="cost" label="Cost" type="number" step="0.01" min="0" error={fe.cost} required />
          <Select name="status" label="Status" defaultValue="ACTIVE" error={fe.status}>
            <option value="ACTIVE">In Shop (Active)</option>
            <option value="CLOSED">Completed (Closed)</option>
          </Select>

          {state.error && <p className="font-mono text-[11px] text-red">{state.error}</p>}
          {state.ok && <p className="font-mono text-[11px] text-green">Service record saved.</p>}

          <Button type="submit" disabled={pending || vehicles.length === 0}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </form>
        <p className="font-mono text-[11px] text-[var(--fg-dim)] mt-3">
          Active → vehicle In Shop. Closing returns it to Available unless retired
          or another active record remains.
        </p>
      </Card>

      {logs.length === 0 ? (
        <Card>
          <p className="font-comic text-[var(--fg-dim)] py-8 text-center">No service records.</p>
        </Card>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Vehicle</TH>
              <TH>Description</TH>
              <TH className="text-right">Cost</TH>
              <TH>Opened</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {logs.map((m) => (
              <TR key={m.id}>
                <TD className="font-mono">{m.vehicleLabel}</TD>
                <TD className="font-comic">{m.description}</TD>
                <TD className="font-mono text-right tabular-nums">{formatCurrency(m.cost)}</TD>
                <TD className="font-mono text-[12px]">{formatDate(m.openedAt)}</TD>
                <TD>
                  <Pill color={MAINTENANCE_STATUS[m.status].color} label={MAINTENANCE_STATUS[m.status].label} />
                </TD>
                <TD className="text-right">
                  {m.status === "ACTIVE" && <CloseButton id={m.id} />}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}

function CloseButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setErr(null);
          const res = await closeMaintenanceLog(id);
          if (!res.ok) setErr(res.error ?? "Failed to close");
          setBusy(false);
        }}
      >
        {busy ? "…" : "Close"}
      </Button>
      {err && <span className="ml-2 font-mono text-[11px] text-red">{err}</span>}
    </>
  );
}
