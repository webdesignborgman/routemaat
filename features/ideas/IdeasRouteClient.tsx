"use client";

import Link from "next/link";
import { Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IdeasPageClient } from "@/features/ideas/IdeasPageClient";
import { useTripLookup } from "@/features/trips/useTripLookup";

type IdeasRouteClientProps = {
  tripId: string;
};

export function IdeasRouteClient({ tripId }: IdeasRouteClientProps) {
  const { trip, isLoading, errorMessage } = useTripLookup(tripId);

  if (isLoading) {
    return (
      <RouteState
        title="Ideeën / Activiteiten laden"
        description="We halen deze reis op uit Firestore."
      />
    );
  }

  if (errorMessage) {
    return (
      <RouteState
        title="Reis laden lukt niet"
        description={errorMessage}
        actionLabel="Terug naar reizen"
      />
    );
  }

  if (!trip) {
    return (
      <RouteState
        title="Reis niet gevonden"
        description="Open eerst een bekende reis voordat je Ideeën / Activiteiten bekijkt."
        actionLabel="Terug naar reizen"
      />
    );
  }

  return <IdeasPageClient trip={trip} />;
}

type RouteStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
};

function RouteState({ title, description, actionLabel }: RouteStateProps) {
  return (
    <section className="rounded-xl border border-dashed border-cyan-200 bg-white/85 px-5 py-12 text-center shadow-[0_18px_45px_rgba(14,165,233,0.10)]">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
        <Lightbulb className="size-5" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-semibold text-slate-950">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        {description}
      </p>
      {actionLabel ? (
        <Button
          asChild
          className="mt-6 bg-slate-950 text-white hover:bg-slate-800"
        >
          <Link href="/trips">{actionLabel}</Link>
        </Button>
      ) : null}
    </section>
  );
}
