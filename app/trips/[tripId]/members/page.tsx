import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { MembersRouteClient } from "@/features/members/MembersRouteClient";

type MembersPageProps = {
  params: Promise<{ tripId: string }>;
};

export default async function MembersPage({ params }: MembersPageProps) {
  const { tripId } = await params;

  return (
    <AppShell>
      <ProtectedRoute>
        <MembersRouteClient tripId={tripId} />
      </ProtectedRoute>
    </AppShell>
  );
}
