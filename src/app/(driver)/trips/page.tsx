import { auth } from "@/core/security/auth";
import { MATRIX } from "@/core/security/rbac";
import {
  getTrips,
  getAvailableVehicles,
  getAvailableDrivers,
} from "@/modules/trips/trip.repository";
import { TripDispatcher } from "@/components/trips/TripDispatcher";

// Trip Dispatcher — the crown jewel (plan §4). Driver = full CRUD; Safety
// Officer = view (board visible, create form disabled). Route gated in proxy.ts.
export default async function TripsPage() {
  const session = await auth();
  const canCreate = session ? MATRIX[session.user.role].trips === "crud" : false;

  const [trips, vehicles, drivers] = await Promise.all([
    getTrips(),
    getAvailableVehicles(),
    getAvailableDrivers(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-comic font-bold text-3xl">Trip Dispatcher</h1>
      <TripDispatcher
        trips={trips}
        vehicles={vehicles}
        drivers={drivers}
        canCreate={canCreate}
      />
    </div>
  );
}
