"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarClock,
  FileText,
  Languages,
  Lightbulb,
  MapPin,
  Route,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loadStoredTrips } from "@/features/trips/tripClientStorage";
import {
  formatTripPeriod,
  getTripDayCount,
  getTripStatus,
  getTripStatusLabel,
  type TripStatus,
} from "@/features/trips/tripDates";
import { getTripById } from "@/features/trips/tripMockData";
import type { Trip } from "@/features/trips/tripTypes";

type TripDetailPageClientProps = {
  tripId: string;
};

type QuickAction = {
  title: string;
  description: string;
  icon: typeof Lightbulb;
  href?: string;
  accentClassName: string;
};

const statusBadgeClasses: Record<TripStatus, string> = {
  upcoming: "border-cyan-200 bg-cyan-50 text-cyan-700",
  ongoing: "border-lime-200 bg-lime-50 text-lime-700",
  past: "border-pink-200 bg-pink-50 text-pink-700",
};

export function TripDetailPageClient({ tripId }: TripDetailPageClientProps) {
  const mockTrip = getTripById(tripId) ?? null;
  const [storedTrip, setStoredTrip] = useState<Trip | null>(null);
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

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        title: "Reisschema",
        description: "Bekijk geplande activiteiten per dag.",
        icon: CalendarClock,
        href: trip ? `/trips/${trip.id}/schedule` : undefined,
        accentClassName: "bg-pink-50 text-pink-600",
      },
      {
        title: "Ideeën / Activiteiten",
        description: "Plekken, activiteiten, links en notities.",
        icon: Lightbulb,
        href: trip ? `/trips/${trip.id}/ideas` : undefined,
        accentClassName: "bg-cyan-50 text-cyan-700",
      },
      {
        title: "Taal",
        description: "Bewaar handige zinnen voor onderweg.",
        icon: Languages,
        href: trip ? `/trips/${trip.id}/language` : undefined,
        accentClassName: "bg-lime-50 text-lime-700",
      },
      {
        title: "Documenten",
        description: "Binnenkort beschikbaar.",
        icon: FileText,
        accentClassName: "bg-lime-50 text-lime-700",
      },
      {
        title: "Leden",
        description: "Binnenkort beschikbaar.",
        icon: Users,
        accentClassName: "bg-slate-100 text-slate-700",
      },
    ],
    [trip]
  );

  if (!trip && !hasCheckedStoredTrips) {
    return (
      <section className="rounded-xl border border-cyan-100 bg-white/85 px-5 py-12 text-center shadow-[0_18px_45px_rgba(14,165,233,0.10)]">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
          <Route className="size-5" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-slate-950">Reis laden</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          We zoeken deze reis in de tijdelijke mocklijst.
        </p>
      </section>
    );
  }

  if (!trip) {
    return <TripNotFoundState />;
  }

  const status = getTripStatus(trip);
  const dayCount = getTripDayCount(trip);

  return (
    <div className="space-y-6">
      <PageHeader
        title={trip.title}
        description={trip.description}
        backHref="/trips"
        action={
          <Button
            asChild
            className="w-full bg-slate-950 text-white shadow-[0_0_24px_rgba(236,72,153,0.24)] hover:bg-slate-800 sm:w-auto"
          >
            <Link href={`/trips/${trip.id}/ideas`}>
              <Lightbulb className="size-4" aria-hidden="true" />
              Naar ideeën / activiteiten
            </Link>
          </Button>
        }
      />

      <section className="rounded-xl border border-cyan-100 bg-white/95 p-4 shadow-[0_18px_45px_rgba(14,165,233,0.10)] sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Badge
              variant="outline"
              className={statusBadgeClasses[status]}
            >
              {getTripStatusLabel(status)}
            </Badge>
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Reisoverzicht
              </h2>
              {trip.description ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {trip.description}
                </p>
              ) : null}
            </div>
          </div>
          <div className="rounded-xl border border-lime-100 bg-lime-50 px-4 py-3 text-sm text-lime-800">
            <span className="block text-2xl font-semibold">{dayCount}</span>
            {dayCount === 1 ? "dag" : "dagen"}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard
          title="Bestemming"
          value={trip.destination}
          icon={MapPin}
          iconClassName="text-pink-500"
        />
        <InfoCard
          title="Periode"
          value={formatTripPeriod(trip)}
          icon={CalendarDays}
          iconClassName="text-cyan-600"
        />
        <InfoCard
          title="Groep"
          value={`${trip.memberIds.length} ${
            trip.memberIds.length === 1 ? "lid" : "leden"
          }`}
          icon={Users}
          iconClassName="text-lime-600"
        />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Snelle acties</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Open de onderdelen van deze reis. Sommige tegels zijn alvast
            gereserveerd voor later.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <QuickActionCard key={action.title} action={action} />
          ))}
        </div>
      </section>
    </div>
  );
}

type InfoCardProps = {
  title: string;
  value: string;
  icon: typeof MapPin;
  iconClassName: string;
};

function InfoCard({ title, value, icon: Icon, iconClassName }: InfoCardProps) {
  return (
    <Card className="border-cyan-100 bg-white/95 shadow-[0_14px_35px_rgba(14,165,233,0.10)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`size-4 ${iconClassName}`} aria-hidden="true" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-6 text-slate-600">
        {value}
      </CardContent>
    </Card>
  );
}

type QuickActionCardProps = {
  action: QuickAction;
};

function QuickActionCard({ action }: QuickActionCardProps) {
  const Icon = action.icon;
  const content = (
    <>
      <div
        className={`mb-4 flex size-11 items-center justify-center rounded-xl ${action.accentClassName}`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-950">
            {action.title}
          </h3>
          {!action.href ? (
            <Badge variant="outline" className="border-pink-100 bg-pink-50 text-pink-700">
              Binnenkort
            </Badge>
          ) : null}
        </div>
        <p className="text-sm leading-6 text-slate-600">{action.description}</p>
      </div>
    </>
  );

  if (action.href) {
    return (
      <Link
        href={action.href}
        className="rounded-xl border border-cyan-100 bg-white/95 p-4 shadow-[0_14px_35px_rgba(14,165,233,0.10)] transition hover:shadow-[0_18px_45px_rgba(34,211,238,0.14)]"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-cyan-100 bg-white/75 p-4 opacity-80 shadow-[0_12px_30px_rgba(14,165,233,0.06)]">
      {content}
    </div>
  );
}

function TripNotFoundState() {
  return (
    <section className="rounded-xl border border-dashed border-cyan-200 bg-white/85 px-5 py-12 text-center shadow-[0_18px_45px_rgba(14,165,233,0.10)]">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
        <Route className="size-5" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-semibold text-slate-950">
        Reis niet gevonden
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        Deze reis staat niet in de mockdata of tijdelijke lijst van je browser.
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
