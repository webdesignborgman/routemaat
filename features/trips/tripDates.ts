import type { Trip } from "@/features/trips/tripTypes";

export type TripStatus = "upcoming" | "past" | "ongoing";

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function dateStringToLocalDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) {
    return new Date(dateString);
  }

  return new Date(year, month - 1, day);
}

export function formatTripDate(dateString: string) {
  return dateFormatter.format(dateStringToLocalDate(dateString));
}

export function formatTripPeriod(trip: Trip) {
  return `${formatTripDate(trip.startDate)} - ${formatTripDate(trip.endDate)}`;
}

export function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
