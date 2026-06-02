import { AppShell } from "@/components/layout/AppShell";
import { TripDetailPageClient } from "@/features/trips/TripDetailPageClient";

type TripDetailPageProps = {
  params: Promise<{ tripId: string }>;
};

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const { tripId } = await params;

  return (
    <AppShell>
      <TripDetailPageClient tripId={tripId} />
    </AppShell>
  );
}
