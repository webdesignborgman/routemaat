import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { DocumentsRouteClient } from "@/features/documents/DocumentsRouteClient";

type DocumentsPageProps = {
  params: Promise<{ tripId: string }>;
};

export default async function DocumentsPage({ params }: DocumentsPageProps) {
  const { tripId } = await params;

  return (
    <AppShell>
      <ProtectedRoute>
        <DocumentsRouteClient tripId={tripId} />
      </ProtectedRoute>
    </AppShell>
  );
}
