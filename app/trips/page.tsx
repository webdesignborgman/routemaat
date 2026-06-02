import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { TripsPageClient } from "@/features/trips/TripsPageClient";

export default function TripsPage() {
  return (
    <AppShell>
      <ProtectedRoute>
        <TripsPageClient />
      </ProtectedRoute>
    </AppShell>
  );
}
