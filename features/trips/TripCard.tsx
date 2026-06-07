import Link from "next/link";
import { CalendarDays, MapPin, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatTripPeriod } from "@/features/trips/tripDates";
import type { Trip } from "@/features/trips/tripTypes";

type TripCardProps = {
  trip: Trip;
  onDelete?: (trip: Trip) => void;
};

export function TripCard({ trip, onDelete }: TripCardProps) {
  return (
    <Card className="border-cyan-100 bg-white/95 shadow-[0_18px_45px_rgba(14,165,233,0.12)] transition-shadow hover:shadow-[0_20px_50px_rgba(236,72,153,0.12)]">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="min-w-0 break-words text-xl text-slate-950">
            {trip.title}
          </CardTitle>
          {onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Reis verwijderen"
              title="Reis verwijderen"
              className="shrink-0 text-slate-500 hover:bg-pink-50 hover:text-pink-700"
              onClick={() => onDelete(trip)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
        <CardDescription className="flex items-center gap-2 text-slate-600">
          <MapPin className="size-4 text-pink-500" aria-hidden="true" />
          {trip.destination}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {trip.description ? (
          <p className="text-sm leading-6 text-slate-600">{trip.description}</p>
        ) : null}
        <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-lg bg-cyan-50 px-3 py-2">
            <CalendarDays className="size-4 text-cyan-600" aria-hidden="true" />
            <span>{formatTripPeriod(trip)}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-lime-50 px-3 py-2">
            <Users className="size-4 text-lime-600" aria-hidden="true" />
            <span>{trip.memberIds.length} leden</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            asChild
            className="w-full bg-slate-950 text-white shadow-[0_0_22px_rgba(34,211,238,0.24)] hover:bg-slate-800"
          >
            <Link href={`/trips/${trip.id}`}>Bekijk reis</Link>
          </Button>
          {onDelete ? (
            <Button
              type="button"
              variant="outline"
              className="w-full border-pink-100 bg-white text-pink-700 hover:bg-pink-50 sm:w-auto"
              onClick={() => onDelete(trip)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Verwijderen
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
