"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/Table";
import { formatCurrency, formatNumber } from "@/core/utils/formatters";
import { ExpenseCategory } from "@/generated/prisma/enums";
import {
  createFuelLogAction,
  createExpenseAction,
  type ActionResult,
} from "@/app/(financial-analyst)/expenses/actions";

export type Option = { id: string; label: string };
export type FuelRow = {
  id: string;
  vehicleReg: string;
  tripLabel: string | null;
  dateDisplay: string;
  liters: number;
  cost: number;
};
export type ExpenseRow = {
  id: string;
  vehicleReg: string;
  category: string;
  amount: number;
  dateDisplay: string;
  notes: string | null;
};
export type OperationalCost = {
  fuel: number;
  maintenance: number;
  expenses: number;
  total: number;
};

// category → pill color (TOLL blue, MAINTENANCE grey/display-only, OTHER orange).
const CATEGORY_COLOR = {
  TOLL: "blue",
  MAINTENANCE: "grey",
  OTHER: "orange",
} as const;

export function ExpensesClient({
  fuelLogs,
  expenses,
  cost,
  options,
}: {
  fuelLogs: FuelRow[];
  expenses: ExpenseRow[];
  cost: OperationalCost;
  options: { vehicles: Option[]; trips: Option[] };
}) {
  const [fuelOpen, setFuelOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-comic font-bold text-2xl">Fuel &amp; Expenses</h1>
      </div>

      {/* Total Operational Cost banner (orange highlight). */}
      <Card className="bg-orange border-ink flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wide text-ink">
            Total Operational Cost
          </div>
          <div className="font-comic font-bold text-3xl text-ink tabular-nums">
            {formatCurrency(cost.total)}
          </div>
        </div>
        <div className="font-mono text-[12px] text-ink/80">
          Fuel {formatCurrency(cost.fuel)} · Maintenance {formatCurrency(cost.maintenance)} ·
          Expenses {formatCurrency(cost.expenses)}
        </div>
      </Card>

      {/* Fuel Logs */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-comic font-bold text-lg">Fuel Logs</h2>
          <Button size="sm" onClick={() => setFuelOpen(true)}>+ Log Fuel</Button>
        </div>
        {fuelLogs.length === 0 ? (
          <Card className="text-center font-comic text-[var(--fg-dim)]">No fuel logs yet.</Card>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Vehicle</TH>
                <TH>Trip</TH>
                <TH>Date</TH>
                <TH className="text-right">Liters</TH>
                <TH className="text-right">Cost</TH>
              </TR>
            </THead>
            <TBody>
              {fuelLogs.map((f) => (
                <TR key={f.id}>
                  <TD className="font-mono text-sm">{f.vehicleReg}</TD>
                  <TD className="font-mono text-sm">{f.tripLabel ?? "—"}</TD>
                  <TD className="font-mono text-sm">{f.dateDisplay}</TD>
                  <TD className="font-mono text-right tabular-nums">{formatNumber(f.liters, 2)}</TD>
                  <TD className="font-mono text-right tabular-nums">{formatCurrency(f.cost)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </section>

      {/* Expenses */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-comic font-bold text-lg">Expenses</h2>
          <Button size="sm" onClick={() => setExpenseOpen(true)}>+ Add Expense</Button>
        </div>
        {expenses.length === 0 ? (
          <Card className="text-center font-comic text-[var(--fg-dim)]">No expenses recorded.</Card>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Vehicle</TH>
                <TH>Category</TH>
                <TH className="text-right">Amount</TH>
                <TH>Date</TH>
                <TH>Notes</TH>
              </TR>
            </THead>
            <TBody>
              {expenses.map((e) => (
                <TR key={e.id}>
                  <TD className="font-mono text-sm">{e.vehicleReg}</TD>
                  <TD>
                    <Pill
                      color={CATEGORY_COLOR[e.category as keyof typeof CATEGORY_COLOR] ?? "grey"}
                      label={e.category}
                    />
                  </TD>
                  <TD className="font-mono text-right tabular-nums">{formatCurrency(e.amount)}</TD>
                  <TD className="font-mono text-sm">{e.dateDisplay}</TD>
                  <TD className="font-comic text-sm">{e.notes ?? "—"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </section>

      <Modal open={fuelOpen} onClose={() => setFuelOpen(false)} title="Log Fuel">
        <FuelForm options={options} onDone={() => setFuelOpen(false)} />
      </Modal>
      <Modal open={expenseOpen} onClose={() => setExpenseOpen(false)} title="Add Expense">
        <ExpenseForm options={options} onDone={() => setExpenseOpen(false)} />
      </Modal>
    </div>
  );
}

// ── Modal forms (kept in-file; both are small and only used here) ──────────

function useFormSubmit(run: (payload: Record<string, string>) => Promise<ActionResult>) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(payload: Record<string, string>, onDone: () => void) {
    setFormError(null);
    setFieldErrors({});
    startTransition(async () => {
      const res = await run(payload);
      if (res.ok) {
        onDone();
        router.refresh();
      } else {
        setFormError(res.error);
        setFieldErrors(res.fieldErrors ?? {});
      }
    });
  }
  return { submit, fieldErrors, formError, pending };
}

function FuelForm({ options, onDone }: { options: { vehicles: Option[]; trips: Option[] }; onDone: () => void }) {
  const [v, setV] = useState({ vehicleId: "", tripId: "", liters: "", cost: "", date: "" });
  const { submit, fieldErrors, formError, pending } = useFormSubmit(createFuelLogAction);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(v, onDone);
      }}
      className="flex flex-col gap-3"
    >
      <Select label="Vehicle" name="vehicleId" value={v.vehicleId} onChange={set("vehicleId")} error={fieldErrors.vehicleId}>
        <option value="">Select vehicle…</option>
        {options.vehicles.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </Select>
      <Select label="Trip (optional)" name="tripId" value={v.tripId} onChange={set("tripId")}>
        <option value="">— none —</option>
        {options.trips.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Liters" name="liters" type="number" step="0.01" min={0} value={v.liters} onChange={set("liters")} error={fieldErrors.liters} />
        <Input label="Cost (₹)" name="cost" type="number" step="0.01" min={0} value={v.cost} onChange={set("cost")} error={fieldErrors.cost} />
      </div>
      <Input label="Date (optional)" name="date" type="date" value={v.date} onChange={set("date")} error={fieldErrors.date} />
      {formError && <p className="font-mono text-[12px] text-red border-2 border-red rounded-[4px] px-3 py-2">{formError}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onDone} disabled={pending}>Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Log Fuel"}</Button>
      </div>
    </form>
  );
}

function ExpenseForm({ options, onDone }: { options: { vehicles: Option[]; trips: Option[] }; onDone: () => void }) {
  const [v, setV] = useState({ vehicleId: "", category: ExpenseCategory.TOLL as string, amount: "", date: "", notes: "" });
  const { submit, fieldErrors, formError, pending } = useFormSubmit(createExpenseAction);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(v, onDone);
      }}
      className="flex flex-col gap-3"
    >
      <Select label="Vehicle" name="vehicleId" value={v.vehicleId} onChange={set("vehicleId")} error={fieldErrors.vehicleId}>
        <option value="">Select vehicle…</option>
        {options.vehicles.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Category" name="category" value={v.category} onChange={set("category")} error={fieldErrors.category}>
          {Object.values(ExpenseCategory).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Input label="Amount (₹)" name="amount" type="number" step="0.01" min={0} value={v.amount} onChange={set("amount")} error={fieldErrors.amount} />
      </div>
      <Input label="Date (optional)" name="date" type="date" value={v.date} onChange={set("date")} error={fieldErrors.date} />
      <Input label="Notes (optional)" name="notes" value={v.notes} onChange={set("notes")} error={fieldErrors.notes} />
      {v.category === ExpenseCategory.MAINTENANCE && (
        <p className="font-mono text-[11px] text-[var(--fg-dim)]">
          Maintenance expenses are display-only — excluded from Operational Cost (counted from service logs).
        </p>
      )}
      {formError && <p className="font-mono text-[12px] text-red border-2 border-red rounded-[4px] px-3 py-2">{formError}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onDone} disabled={pending}>Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Add Expense"}</Button>
      </div>
    </form>
  );
}
