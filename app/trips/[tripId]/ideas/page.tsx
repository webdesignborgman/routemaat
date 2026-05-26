import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { IdeasPageClient } from "@/features/ideas/IdeasPageClient";
import { getTripById } from "@/features/trips/tripMockData";

type IdeasPageProps = {
  params: Promise<{ tripId: string }>;
};

export default async function IdeasPage({ params }: IdeasPageProps) {
  const { tripId } = await params;
  const trip = getTripById(tripId);

  if (!trip) {
    notFound();
  }

  return (
    <AppShell>
      <IdeasPageClient trip={trip} />
    </AppShell>
  );
}
