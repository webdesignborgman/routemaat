import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { PackingListPageClient } from "@/features/packing/PackingListPageClient";

export default function PackingListPage() {
  return (
    <AppShell>
      <ProtectedRoute>
        <PackingListPageClient />
      </ProtectedRoute>
    </AppShell>
  );
}
