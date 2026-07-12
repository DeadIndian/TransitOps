"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/Table";
import { VEHICLE_STATUS, VEHICLE_TYPES } from "@/core/utils/constants";
import { formatCurrency, formatNumber } from "@/core/utils/formatters";
import type { VehicleRow } from "@/modules/vehicles/vehicle.repository";
import {
  createVehicle,
  updateVehicle,
  retireVehicle,
  type VehicleFormState,
} from "@/modules/vehicles/vehicle.service";

const EMPTY: VehicleFormState = { ok: false };

export function VehicleRegistry({
  vehicles,
  canEdit,
}: {
  vehicles: VehicleRow[];
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState<VehicleRow | null>(null);
  const [creating, setCreating] = useState(false);
  const open = creating || editing !== null;

  return (
    <div className="flex flex-col gap-3">
      {canEdit && (
        <div className="flex justify-end">
          <Button onClick={() => setCreating(true)}>+ Add Vehicle</Button>
        </div>
      )}

      {vehicles.length === 0 ? (
        <p className="font-comic text-[var(--fg-dim)] py-8 text-center">
          No vehicles registered — add your first.
        </p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Reg No</TH>
              <TH>Name</TH>
              <TH>Type</TH>
              <TH className="text-right">Capacity kg</TH>
              <TH className="text-right">Odometer km</TH>
              <TH className="text-right">Acq Cost</TH>
              <TH>Status</TH>
              {canEdit && <TH className="text-right">Actions</TH>}
            </TR>
          </THead>
          <TBody>
            {vehicles.map((v) => (
              <TR key={v.id}>
                <TD className="font-mono">{v.registrationNumber}</TD>
                <TD className="font-comic">{v.name}</TD>
                <TD className="font-comic">{v.type}</TD>
                <TD className="font-mono text-right tabular-nums">{formatNumber(v.maxLoadCapacityKg)}</TD>
                <TD className="font-mono text-right tabular-nums">{formatNumber(v.odometerKm)}</TD>
                <TD className="font-mono text-right tabular-nums">{formatCurrency(v.acquisitionCost)}</TD>
                <TD>
                  <Pill color={VEHICLE_STATUS[v.status].color} label={VEHICLE_STATUS[v.status].label} />
                </TD>
                {canEdit && (
                  <TD className="text-right whitespace-nowrap">
                    <div className="inline-flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setEditing(v)}>
                        Edit
                      </Button>
                      {v.status !== "RETIRED" && <RetireButton id={v.id} />}
                    </div>
                  </TD>
                )}
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {open && (
        <VehicleModal
          vehicle={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function RetireButton({ id }: { id: string }) {
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <Button
        size="sm"
        variant="danger"
        disabled={pending}
        onClick={async () => {
          if (!confirm("Retire this vehicle? This cannot be undone.")) return;
          setPending(true);
          setErr(null);
          try {
            await retireVehicle(id);
          } catch (e) {
            setErr(e instanceof Error ? e.message : "Failed to retire");
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "…" : "Retire"}
      </Button>
      {err && <span className="ml-2 font-mono text-[11px] text-red">{err}</span>}
    </>
  );
}

function VehicleModal({
  vehicle,
  onClose,
}: {
  vehicle: VehicleRow | null;
  onClose: () => void;
}) {
  const action = vehicle
    ? updateVehicle.bind(null, vehicle.id)
    : createVehicle;
  const [state, formAction, pending] = useActionState(action, EMPTY);

  // Close the modal once the server action reports success.
  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  const fe = state.fieldErrors ?? {};

  return (
    <Modal open onClose={onClose} title={vehicle ? "Edit Vehicle" : "Add Vehicle"}>
      <form action={formAction} className="flex flex-col gap-3">
        <Input
          name="registrationNumber"
          label="Registration No"
          defaultValue={vehicle?.registrationNumber}
          error={fe.registrationNumber}
          required
        />
        <Input name="name" label="Name" defaultValue={vehicle?.name} error={fe.name} required />
        <Select name="type" label="Type" defaultValue={vehicle?.type ?? VEHICLE_TYPES[0]} error={fe.type}>
          {VEHICLE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        <Input
          name="maxLoadCapacityKg"
          label="Max Load Capacity (kg)"
          type="number"
          step="0.01"
          min="0"
          defaultValue={vehicle?.maxLoadCapacityKg}
          error={fe.maxLoadCapacityKg}
          required
        />
        <Input
          name="odometerKm"
          label="Odometer (km)"
          type="number"
          step="0.01"
          min="0"
          defaultValue={vehicle?.odometerKm ?? 0}
          error={fe.odometerKm}
          required
        />
        <Input
          name="acquisitionCost"
          label="Acquisition Cost"
          type="number"
          step="0.01"
          min="0"
          defaultValue={vehicle?.acquisitionCost}
          error={fe.acquisitionCost}
          required
        />
        <Input name="region" label="Region" defaultValue={vehicle?.region ?? ""} error={fe.region} />

        {state.error && <p className="font-mono text-[11px] text-red">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
