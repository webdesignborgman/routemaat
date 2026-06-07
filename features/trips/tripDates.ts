import type { Trip } from "@/features/trips/tripTypes";
import {
  dateStringToLocalDate,
  dateToDateString,
  formatDutchDate,
} from "@/lib/dateUtils";

export type TripStatus = "upcoming" | "past" | "ongoing";

export const formatTripDate = formatDutchDate;

export function formatTripPeriod(trip: Trip) {
  return `${formatTripDate(trip.startDate)} - ${formatTripDate(trip.endDate)}`;
}

export function getTodayDateString() {
  return dateToDateString(new Date());
}

export function isUpcomingTrip(trip: Trip, today = getTodayDateString()) {
  return trip.endDate >= today;
}

export function getTripStatus(trip: Trip, today = getTodayDateString()): TripStatus {
  if (trip.endDate < today) {
    return "past";
  }

  if (trip.startDate <= today && trip.endDate >= today) {
    return "ongoing";
  }

  return "upcoming";
}

export function getTripStatusLabel(status: TripStatus) {
  if (status === "ongoing") {
    return "Bezig";
  }

  if (status === "past") {
    return "Geweest";
  }

  return "Komend";
}

export function getTripDayCount(trip: Trip) {
  const startDate = dateStringToLocalDate(trip.startDate);
  const endDate = dateStringToLocalDate(trip.endDate);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const differenceInDays = Math.round(
    (endDate.getTime() - startDate.getTime()) / millisecondsPerDay
  );

  return Math.max(differenceInDays + 1, 1);
}

export function sortTripsByStartDate(trips: Trip[], direction: "asc" | "desc") {
  const multiplier = direction === "asc" ? 1 : -1;

  return [...trips].sort(
    (firstTrip, secondTrip) =>
      firstTrip.startDate.localeCompare(secondTrip.startDate) * multiplier
  );
}
