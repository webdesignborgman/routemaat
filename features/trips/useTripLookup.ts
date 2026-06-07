"use client";

import { useEffect, useState } from "react";

import { loadStoredTrips } from "@/features/trips/tripClientStorage";
import { getTripById } from "@/features/trips/tripMockData";
import type { Trip } from "@/features/trips/tripTypes";

export type TripLookupState = {
  trip: Trip | null;
  isLoading: boolean;
};

export function useTripLookup(tripId: string): TripLookupState {
  const mockTrip = getTripById(tripId) ?? null;
  const [storedTrip, setStoredTrip] = useState<Trip | null>(null);
  const [checkedTripId, setCheckedTripId] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setStoredTrip(loadStoredTrips().find((trip) => trip.id === tripId) ?? null);
      setCheckedTripId(tripId);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [tripId]);

  const matchingStoredTrip = storedTrip?.id === tripId ? storedTrip : null;

  return {
    trip: matchingStoredTrip ?? mockTrip,
    isLoading: !mockTrip && checkedTripId !== tripId,
  };
}
