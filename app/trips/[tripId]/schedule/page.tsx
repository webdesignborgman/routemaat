import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { ScheduleRouteClient } from "@/features/ideas/ScheduleRouteClient";

type SchedulePageProps = {
  params: Promise<{ tripId: string }>;
};

export default async function SchedulePage({ params }: SchedulePageProps) {
  const { tripId } = await params;

  return (
    <AppShell>
      <ProtectedRoute>
        <ScheduleRouteClient tripId={tripId} />
      </ProtectedRoute>
    </AppShell>
  );
}
