import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { IdeasRouteClient } from "@/features/ideas/IdeasRouteClient";

type IdeasPageProps = {
  params: Promise<{ tripId: string }>;
};

export default async function IdeasPage({ params }: IdeasPageProps) {
  const { tripId } = await params;

  return (
    <AppShell>
      <ProtectedRoute>
        <IdeasRouteClient tripId={tripId} />
      </ProtectedRoute>
    </AppShell>
  );
}
