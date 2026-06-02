"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SchedulePageClient } from "@/features/ideas/SchedulePageClient";
import { loadStoredTrips } from "@/features/trips/tripClientStorage";
import { getTripById } from "@/features/trips/tripMockData";
import type { Trip } from "@/features/trips/tripTypes";

type ScheduleRouteClientProps = {
  tripId: string;
};

export function ScheduleRouteClient({ tripId }: ScheduleRouteClientProps) {
  const mockTrip = getTripById(tripId) ?? null;
  const [storedTrip, setStoredTrip] = useState<Trip | null>(() =>
    mockTrip
  );
  const [hasCheckedStoredTrips, setHasCheckedStoredTrips] = useState(
    Boolean(mockTrip)
  );
  const trip = mockTrip ?? storedTrip;

  useEffect(() => {
    if (mockTrip) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setStoredTrip(loadStoredTrips().find((trip) => trip.id === tripId) ?? null);
      setHasCheckedStoredTrips(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [mockTrip, tripId]);

  if (!trip && !hasCheckedStoredTrips) {
    return (
      <section className="rounded-xl border border-cyan-100 bg-white/85 px-5 py-12 text-center shadow-[0_18px_45px_rgba(14,165,233,0.10)]">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
          <CalendarClock className="size-5" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-slate-950">
          Reisschema laden
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          We zoeken deze reis in de tijdelijke mocklijst.
        </p>
      </section>
    );
  }

  if (!trip) {
    return (
      <section className="rounded-xl border border-dashed border-cyan-200 bg-white/85 px-5 py-12 text-center shadow-[0_18px_45px_rgba(14,165,233,0.10)]">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
          <CalendarClock className="size-5" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-slate-950">
          Reis niet gevonden
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Open eerst een bekende reis voordat je het reisschema bekijkt.
        </p>
        <Button
          asChild
          className="mt-6 bg-slate-950 text-white hover:bg-slate-800"
        >
          <Link href="/trips">Terug naar reizen</Link>
        </Button>
      </section>
    );
  }

  return <SchedulePageClient trip={trip} />;
}
