import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { LanguageRouteClient } from "@/features/language/LanguageRouteClient";

type LanguagePageProps = {
  params: Promise<{ tripId: string }>;
};

export default async function LanguagePage({ params }: LanguagePageProps) {
  const { tripId } = await params;

  return (
    <AppShell>
      <ProtectedRoute>
        <LanguageRouteClient tripId={tripId} />
      </ProtectedRoute>
    </AppShell>
  );
}
