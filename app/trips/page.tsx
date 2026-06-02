import { AppShell } from "@/components/layout/AppShell";
import { TripsPageClient } from "@/features/trips/TripsPageClient";

export default function TripsPage() {
  return (
    <AppShell>
      <TripsPageClient />
    </AppShell>
  );
}
