import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { PackingTripRouteClient } from "@/features/packing/PackingTripRouteClient";

type TripPackingListPageProps = {
  params: Promise<{ tripId: string }>;
};

export default async function TripPackingListPage({
  params,
}: TripPackingListPageProps) {
  const { tripId } = await params;

  return (
    <AppShell>
      <ProtectedRoute>
        <PackingTripRouteClient tripId={tripId} />
      </ProtectedRoute>
    </AppShell>
  );
}
