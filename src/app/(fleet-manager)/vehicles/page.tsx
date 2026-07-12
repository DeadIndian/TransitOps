import { auth } from "@/core/security/auth";
import { MATRIX } from "@/core/security/rbac";
import { getVehicles } from "@/modules/vehicles/vehicle.repository";
import { VEHICLE_TYPES } from "@/core/utils/constants";
import { VehicleStatus } from "@/generated/prisma/enums";
import { VehicleRegistry } from "@/components/vehicles/VehicleRegistry";

// Vehicle Registry (plan §2). Fleet Manager = CRUD; Driver & Financial = view.
// Access to the route is gated in proxy.ts; here the role only decides whether
// write controls render (render-time hiding — the action re-checks anyway).
export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; search?: string }>;
}) {
  const { type, status, search } = await searchParams;
  const session = await auth();
  const canEdit = session ? MATRIX[session.user.role].fleet === "crud" : false;

  const vehicles = await getVehicles({
    type: type || undefined,
    status: (status as VehicleStatus) || undefined,
    search: search || undefined,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-comic font-bold text-3xl">Vehicle Registry</h1>
      </div>

      {/* URL-synced filter bar — native GET form, no client JS needed. */}
      <form className="flex flex-wrap items-end gap-3" method="get">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wide text-[var(--fg-dim)]">Type</span>
          <select name="type" defaultValue={type ?? ""} className="bg-[var(--surface)] text-[var(--fg)] border-2 border-ink rounded-[4px] px-3 py-2 font-comic">
            <option value="">All</option>
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wide text-[var(--fg-dim)]">Status</span>
          <select name="status" defaultValue={status ?? ""} className="bg-[var(--surface)] text-[var(--fg)] border-2 border-ink rounded-[4px] px-3 py-2 font-comic">
            <option value="">All</option>
            {Object.values(VehicleStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wide text-[var(--fg-dim)]">Reg No</span>
          <input name="search" defaultValue={search ?? ""} placeholder="Search…" className="bg-[var(--surface)] text-[var(--fg)] border-2 border-ink rounded-[4px] px-3 py-2 font-comic" />
        </label>
        <button type="submit" className="border-[3px] border-ink rounded-[4px] bg-[var(--surface)] text-[var(--fg)] font-comic font-bold px-4 py-2 shadow-brutal">
          Filter
        </button>
      </form>

      <VehicleRegistry vehicles={vehicles} canEdit={canEdit} />
    </div>
  );
}
