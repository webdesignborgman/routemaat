import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Lightbulb, MapPin, Users } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTripById } from "@/features/trips/tripMockData";

type TripDetailPageProps = {
  params: Promise<{ tripId: string }>;
};

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const { tripId } = await params;
  const trip = getTripById(tripId);

  if (!trip) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        title={trip.name}
        description={trip.summary}
        backHref="/trips"
        action={
          <Button
            asChild
            className="w-full bg-slate-950 text-white shadow-[0_0_24px_rgba(236,72,153,0.24)] hover:bg-slate-800 sm:w-auto"
          >
            <Link href={`/trips/${trip.id}/ideas`}>
              <Lightbulb className="size-4" aria-hidden="true" />
              Naar ideeën
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-cyan-100 bg-white/95 shadow-[0_14px_35px_rgba(14,165,233,0.10)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4 text-pink-500" aria-hidden="true" />
              Bestemming
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-slate-600">
            {trip.destination}
          </CardContent>
        </Card>
        <Card className="border-cyan-100 bg-white/95 shadow-[0_14px_35px_rgba(14,165,233,0.10)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4 text-cyan-600" aria-hidden="true" />
              Periode
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-slate-600">
            {dateFormatter.format(trip.startsAt)} -{" "}
            {dateFormatter.format(trip.endsAt)}
          </CardContent>
        </Card>
        <Card className="border-cyan-100 bg-white/95 shadow-[0_14px_35px_rgba(14,165,233,0.10)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-lime-600" aria-hidden="true" />
              Groep
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-slate-600">
            {trip.memberCount} leden en {trip.ideaCount} startideeën
          </CardContent>
        </Card>
      </div>

      <section className="mt-6 rounded-xl border border-pink-100 bg-white/90 p-5 shadow-[0_14px_35px_rgba(236,72,153,0.08)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Ideeënmodule</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Bewaar bezienswaardigheden, restaurants, winkels en handige
              notities op één plek.
            </p>
          </div>
          <Button asChild variant="outline" className="border-cyan-200 bg-white">
            <Link href={`/trips/${trip.id}/ideas`}>Open ideeën</Link>
          </Button>
        </div>
      </section>
    </AppShell>
  );
}
