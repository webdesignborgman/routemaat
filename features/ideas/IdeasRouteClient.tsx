"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IdeasPageClient } from "@/features/ideas/IdeasPageClient";
import { loadStoredTrips } from "@/features/trips/tripClientStorage";
import { getTripById } from "@/features/trips/tripMockData";

type IdeasRouteClientProps = {
  tripId: string;
};

export function IdeasRouteClient({ tripId }: IdeasRouteClientProps) {
  const [storedTrip, setStoredTrip] = useState(() => getTripById(tripId) ?? null);
  const trip = getTripById(tripId) ?? storedTrip;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setStoredTrip(loadStoredTrips().find((trip) => trip.id === tripId) ?? null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [tripId]);

  if (!trip) {
    return (
      <section className="rounded-xl border border-dashed border-cyan-200 bg-white/85 px-5 py-12 text-center shadow-[0_18px_45px_rgba(14,165,233,0.10)]">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
          <Lightbulb className="size-5" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-slate-950">
          Reis niet gevonden
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Open eerst een bekende reis voordat je ideeën bekijkt.
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

  return <IdeasPageClient trip={trip} />;
}
