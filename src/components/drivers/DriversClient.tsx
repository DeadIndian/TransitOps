"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Modal } from "@/components/ui/Modal";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/Table";
import { DRIVER_STATUS, type PillColor } from "@/core/utils/constants";
import { DriverStatus } from "@/generated/prisma/enums";
import { formatNumber } from "@/core/utils/formatters";
import { DriverForm, type DriverFormValues } from "@/components/drivers/DriverForm";
import { setDriverStatusAction } from "@/app/(safety-officer)/drivers/actions";

export type DriverRow = {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryISO: string; // yyyy-mm-dd, for the date input
  expiryDisplay: string;
  contactNumber: string;
  safetyScore: number;
  status: DriverStatus;
  expired: boolean;
};

// Safety score → pill color band (plan §3 Safety StatusPill).
function safetyColor(score: number): PillColor {
  if (score >= 80) return "green";
  if (score >= 60) return "orange";
  return "red";
}

const TOGGLE_STATUSES: { value: DriverStatus; label: string }[] = [
  { value: DriverStatus.AVAILABLE, label: "Available" },
  { value: DriverStatus.OFF_DUTY, label: "Off Duty" },
  { value: DriverStatus.SUSPENDED, label: "Suspended" },
];

export function DriversClient({ drivers }: { drivers: DriverRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<DriverFormValues | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [rowError, setRowError] = useState<string | null>(null);

  const expiredCount = drivers.filter((d) => d.expired).length;

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(d: DriverRow) {
    setEditing({
      id: d.id,
      name: d.name,
      licenseNumber: d.licenseNumber,
      licenseCategory: d.licenseCategory,
      licenseExpiryDate: d.licenseExpiryISO,
      contactNumber: d.contactNumber,
      safetyScore: String(d.safetyScore),
    });
    setModalOpen(true);
  }
  function onFormDone() {
    setModalOpen(false);
    router.refresh();
  }

  function changeStatus(id: string, status: DriverStatus) {
    setRowError(null);
    startTransition(async () => {
      const res = await setDriverStatusAction(id, status);
      if (res.ok) router.refresh();
      else setRowError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-comic font-bold text-2xl">Drivers &amp; Safety</h1>
          {expiredCount > 0 && (
            <p className="font-mono text-[12px] text-ink bg-orange border-2 border-ink rounded-[4px] px-2 py-1 mt-1 inline-block">
              ⚠ {expiredCount} driver{expiredCount > 1 ? "s" : ""} need license renewal
            </p>
          )}
        </div>
        <Button onClick={openAdd}>+ Add Driver</Button>
      </div>

      {rowError && (
        <p className="font-mono text-[12px] text-red border-2 border-red rounded-[4px] px-3 py-2">
          {rowError}
        </p>
      )}

      {drivers.length === 0 ? (
        <Card className="text-center font-comic text-[var(--fg-dim)]">
          No drivers on file.
        </Card>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Driver</TH>
              <TH>License No</TH>
              <TH>Category</TH>
              <TH>Expiry</TH>
              <TH>Contact</TH>
              <TH>Safety</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {drivers.map((d) => {
              const onTrip = d.status === DriverStatus.ON_TRIP;
              return (
                <TR key={d.id} className={d.expired ? "bg-orange/20" : ""}>
                  <TD className="font-comic font-bold">{d.name}</TD>
                  <TD className="font-mono text-sm">{d.licenseNumber}</TD>
                  <TD className="font-mono text-sm">{d.licenseCategory}</TD>
                  <TD className="font-mono text-sm">
                    {d.expiryDisplay}
                    {d.expired && (
                      <span className="ml-1 font-bold text-red">· Expired</span>
                    )}
                  </TD>
                  <TD className="font-mono text-sm">{d.contactNumber}</TD>
                  <TD>
                    <Pill color={safetyColor(d.safetyScore)} label={formatNumber(d.safetyScore)} />
                  </TD>
                  <TD>
                    <Pill color={DRIVER_STATUS[d.status].color} label={DRIVER_STATUS[d.status].label} />
                  </TD>
                  <TD>
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      {onTrip ? (
                        <span className="font-mono text-[11px] text-[var(--fg-dim)]">
                          on trip — locked
                        </span>
                      ) : (
                        TOGGLE_STATUSES.map((t) => (
                          <button
                            key={t.value}
                            onClick={() => changeStatus(d.id, t.value)}
                            disabled={pending || d.status === t.value}
                            className={`font-mono text-[10px] uppercase border-2 border-ink rounded-[3px] px-1.5 py-0.5 ${
                              d.status === t.value
                                ? "bg-ink text-paper"
                                : "bg-[var(--surface)] hover:bg-brand/20"
                            } disabled:cursor-default`}
                          >
                            {t.label}
                          </button>
                        ))
                      )}
                      <Button size="sm" variant="secondary" onClick={() => openEdit(d)}>
                        Edit
                      </Button>
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing?.id ? "Edit Driver" : "Add Driver"}
      >
        <DriverForm initial={editing ?? undefined} onDone={onFormDone} />
      </Modal>
    </div>
  );
}
