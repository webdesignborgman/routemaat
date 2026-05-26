import type { Trip } from "@/features/trips/tripTypes";

export const mockTrips: Trip[] = [
  {
    id: "japan-2028",
    name: "Japan 2028",
    destination: "Tokyo, Kyoto en Osaka",
    startsAt: new Date("2028-04-18T00:00:00.000Z"),
    endsAt: new Date("2028-05-04T00:00:00.000Z"),
    summary:
      "Een rustige familieplanning met ruimte voor tempels, foodspots, wijken, winkels en praktische tips.",
    memberCount: 6,
    ideaCount: 5,
  },
];

export function getTripById(tripId: string) {
  return mockTrips.find((trip) => trip.id === tripId);
}
