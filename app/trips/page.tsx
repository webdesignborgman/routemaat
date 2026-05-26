import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { mockTrips } from "@/features/trips/tripMockData";
import { TripCard } from "@/features/trips/TripCard";

export default function TripsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Reizen"
        description="Kies een reis en verzamel samen ideeën, plekken en praktische notities."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {mockTrips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </AppShell>
  );
}
