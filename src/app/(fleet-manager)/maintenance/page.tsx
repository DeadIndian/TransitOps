import {
  getMaintenanceLogs,
  getVehiclesForMaintenance,
} from "@/modules/maintenance/maintenance.repository";
import { MaintenanceBoard } from "@/components/maintenance/MaintenanceBoard";

// Maintenance (plan §5). Fleet Manager only — route gated in proxy.ts, actions
// re-check with requireRole.
export default async function MaintenancePage() {
  const [logs, vehicles] = await Promise.all([
    getMaintenanceLogs(),
    getVehiclesForMaintenance(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-comic font-bold text-3xl">Maintenance</h1>
      <MaintenanceBoard logs={logs} vehicles={vehicles} />
    </div>
  );
}
