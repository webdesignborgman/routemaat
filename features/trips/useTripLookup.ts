"use client";

import { useEffect, useState } from "react";

import { getTripById } from "@/features/trips/tripService";
import type { Trip } from "@/features/trips/tripTypes";

export type TripLookupState = {
  trip: Trip | null;
  isLoading: boolean;
  errorMessage: string | null;
};

export function useTripLookup(tripId: string): TripLookupState {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadTrip() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const loadedTrip = await getTripById(tripId);

        if (!isCancelled) {
          setTrip(loadedTrip);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(getErrorMessage(error));
          setTrip(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadTrip();

    return () => {
      isCancelled = true;
    };
  }, [tripId]);

  return {
    trip,
    isLoading,
    errorMessage,
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Er ging iets mis. Probeer het opnieuw.";
}
