"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pill } from "@/components/ui/Pill";
import { Modal } from "@/components/ui/Modal";
import { Stepper } from "@/components/ui/Stepper";
import { TRIP_STATUS } from "@/core/utils/constants";
import { formatNumber, formatDate } from "@/core/utils/formatters";
import type {
  TripRow,
  PickerVehicle,
  PickerDriver,
} from "@/modules/trips/trip.repository";
import {
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  type TripFormState,
} from "@/modules/trips/trip.service";

const EMPTY: TripFormState = { ok: false };

export function TripDispatcher({
  trips,
  vehicles,
  drivers,
  canCreate,
}: {
  trips: TripRow[];
  vehicles: PickerVehicle[];
  drivers: PickerDriver[];
  canCreate: boolean;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
      {canCreate ? (
        <CreateTripForm vehicles={vehicles} drivers={drivers} />
      ) : (
        <Card>
          <h2 className="font-comic font-bold text-xl mb-2">Create Trip</h2>
          <p className="font-comic text-[var(--fg-dim)]">
            View-only access — dispatching is a Driver action.
          </p>
        </Card>
      )}
      <LiveBoard trips={trips} canManage={canCreate} />
    </div>
  );
}

function CreateTripForm({
  vehicles,
  drivers,
}: {
  vehicles: PickerVehicle[];
  drivers: PickerDriver[];
}) {
  const [state, formAction, pending] = useActionState(createTrip, EMPTY);
  const [vehicleId, setVehicleId] = useState("");
  const [cargo, setCargo] = useState("");

  const selected = vehicles.find((v) => v.id === vehicleId);
  const cargoNum = Number(cargo);
  // Live cargo-vs-capacity guard (Rule 5): compare as the operator types.
  const overBy =
    selected && cargoNum > 0 ? cargoNum - selected.maxLoadCapacityKg : 0;
  const overCapacity = overBy > 0;
  const noOptions = vehicles.length === 0 || drivers.length === 0;

  const fe = state.fieldErrors ?? {};

  return (
    <Card>
      <h2 className="font-comic font-bold text-xl mb-3">Create Trip</h2>
      <form action={formAction} className="flex flex-col gap-3">
        <Input name="source" label="Source" error={fe.source} required />
        <Input name="destination" label="Destination" error={fe.destination} required />

        <Select
          name="vehicleId"
          label="Vehicle (available only)"
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          error={fe.vehicleId}
          required
        >
          <option value="" disabled>
            {vehicles.length ? "Select vehicle…" : "None available"}
          </option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label} · {formatNumber(v.maxLoadCapacityKg)} kg
            </option>
          ))}
        </Select>

        <Select name="driverId" label="Driver (available only)" error={fe.driverId} defaultValue="" required>
          <option value="" disabled>
            {drivers.length ? "Select driver…" : "None available"}
          </option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </Select>

        <Input
          name="cargoWeightKg"
          label="Cargo Weight (kg)"
          type="number"
          step="0.01"
          min="0"
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
          error={fe.cargoWeightKg}
          required
        />
        <Input
          name="plannedDistanceKm"
          label="Planned Distance (km)"
          type="number"
          step="0.01"
          min="0"
          error={fe.plannedDistanceKm}
          required
        />

        {/* Live validation box (plan §4). */}
        <div
          className={`border-[3px] border-ink rounded-[4px] px-3 py-2 font-mono text-[12px] ${
            overCapacity ? "bg-red text-white" : "bg-green/20 text-[var(--fg)]"
          }`}
        >
          {selected && cargoNum > 0
            ? overCapacity
              ? `Cargo exceeds capacity by ${formatNumber(overBy)} kg`
              : `OK — ${formatNumber(selected.maxLoadCapacityKg - cargoNum)} kg headroom`
            : "Pick a vehicle and enter cargo weight to validate."}
        </div>

        {state.error && <p className="font-mono text-[11px] text-red">{state.error}</p>}

        <Button type="submit" disabled={pending || overCapacity || noOptions}>
          {pending ? "Saving…" : "Save as Draft"}
        </Button>
        {noOptions && (
          <p className="font-mono text-[11px] text-[var(--fg-dim)]">
            Need at least one available vehicle and driver to create a trip.
          </p>
        )}
      </form>
    </Card>
  );
}

function stepsFor(status: TripRow["status"]) {
  const order = ["DRAFT", "DISPATCHED", "COMPLETED"] as const;
  if (status === "CANCELLED") {
    return [
      { label: "Draft", state: "done" as const },
      { label: "Cancelled", state: "cancelled" as const },
    ];
  }
  const idx = order.indexOf(status);
  return order.map((s, i) => ({
    label: TRIP_STATUS[s].label,
    state: i < idx ? ("done" as const) : i === idx ? ("active" as const) : ("upcoming" as const),
  }));
}

function LiveBoard({ trips, canManage }: { trips: TripRow[]; canManage: boolean }) {
  if (trips.length === 0) {
    return (
      <Card>
        <p className="font-comic text-[var(--fg-dim)] py-8 text-center">No active trips.</p>
      </Card>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {trips.map((t) => (
        <TripCard key={t.id} trip={t} canManage={canManage} />
      ))}
    </div>
  );
}

function TripCard({ trip, canManage }: { trip: TripRow; canManage: boolean }) {
  const [completing, setCompleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const steps = useMemo(() => stepsFor(trip.status), [trip.status]);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setErr(null);
    const res = await fn();
    if (!res.ok) setErr(res.error ?? "Action failed");
    setBusy(false);
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-comic font-bold">{trip.source} → {trip.destination}</p>
          <p className="font-mono text-[11px] text-[var(--fg-dim)]">{trip.id}</p>
        </div>
        <Pill color={TRIP_STATUS[trip.status].color} label={TRIP_STATUS[trip.status].label} />
      </div>

      <Stepper steps={steps} />

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[12px]">
        <dt className="text-[var(--fg-dim)]">Vehicle</dt>
        <dd className="text-right">{trip.vehicleLabel}</dd>
        <dt className="text-[var(--fg-dim)]">Driver</dt>
        <dd className="text-right">{trip.driverLabel}</dd>
        <dt className="text-[var(--fg-dim)]">Cargo</dt>
        <dd className="text-right tabular-nums">{formatNumber(trip.cargoWeightKg)} kg</dd>
        <dt className="text-[var(--fg-dim)]">Planned</dt>
        <dd className="text-right tabular-nums">{formatNumber(trip.plannedDistanceKm)} km</dd>
        {trip.actualDistanceKm != null && (
          <>
            <dt className="text-[var(--fg-dim)]">Actual</dt>
            <dd className="text-right tabular-nums">{formatNumber(trip.actualDistanceKm)} km</dd>
          </>
        )}
        {trip.dispatchedAt && (
          <>
            <dt className="text-[var(--fg-dim)]">Dispatched</dt>
            <dd className="text-right">{formatDate(trip.dispatchedAt)}</dd>
          </>
        )}
        {trip.completedAt && (
          <>
            <dt className="text-[var(--fg-dim)]">Completed</dt>
            <dd className="text-right">{formatDate(trip.completedAt)}</dd>
          </>
        )}
      </dl>

      {err && <p className="font-mono text-[11px] text-red">{err}</p>}

      {canManage && (
        <div className="flex flex-wrap gap-2">
          {trip.status === "DRAFT" && (
            <>
              <Button size="sm" disabled={busy} onClick={() => run(() => dispatchTrip(trip.id))}>
                {busy ? "…" : "Dispatch"}
              </Button>
              <Button size="sm" variant="danger" disabled={busy} onClick={() => run(() => cancelTrip(trip.id))}>
                Cancel
              </Button>
            </>
          )}
          {trip.status === "DISPATCHED" && (
            <>
              <Button size="sm" disabled={busy} onClick={() => setCompleting(true)}>
                Complete
              </Button>
              <Button size="sm" variant="danger" disabled={busy} onClick={() => run(() => cancelTrip(trip.id))}>
                Cancel
              </Button>
            </>
          )}
        </div>
      )}

      {completing && <CompleteModal trip={trip} onClose={() => setCompleting(false)} />}
    </Card>
  );
}

function CompleteModal({ trip, onClose }: { trip: TripRow; onClose: () => void }) {
  const action = completeTrip.bind(null, trip.id);
  const [state, formAction, pending] = useActionState(action, EMPTY);

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  const fe = state.fieldErrors ?? {};

  return (
    <Modal open onClose={onClose} title="Complete Trip">
      <form action={formAction} className="flex flex-col gap-3">
        <p className="font-comic text-sm text-[var(--fg-dim)]">
          {trip.source} → {trip.destination}
        </p>
        <Input
          name="actualDistanceKm"
          label="Actual Distance (km)"
          type="number"
          step="0.01"
          min="0"
          defaultValue={trip.plannedDistanceKm}
          error={fe.actualDistanceKm}
          required
        />
        <Input
          name="fuelConsumedL"
          label="Fuel Consumed (L)"
          type="number"
          step="0.01"
          min="0"
          error={fe.fuelConsumedL}
          required
        />
        <Input
          name="fuelCost"
          label="Fuel Cost"
          type="number"
          step="0.01"
          min="0"
          error={fe.fuelCost}
          required
        />
        {state.error && <p className="font-mono text-[11px] text-red">{state.error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Confirm"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
