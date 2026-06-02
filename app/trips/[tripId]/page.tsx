import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { TripDetailPageClient } from "@/features/trips/TripDetailPageClient";

type TripDetailPageProps = {
  params: Promise<{ tripId: string }>;
};

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const { tripId } = await params;

  return (
    <AppShell>
      <ProtectedRoute>
        <TripDetailPageClient tripId={tripId} />
      </ProtectedRoute>
    </AppShell>
  );
}
