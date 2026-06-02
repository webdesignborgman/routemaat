import type { Trip } from "@/features/trips/tripTypes";

export const mockTrips: Trip[] = [
  {
    id: "japan-2028",
    title: "Japan 2028",
    destination: "Tokyo, Kyoto en Osaka",
    description:
      "Een rustige familieplanning met ruimte voor tempels, foodspots, wijken, winkels en praktische tips.",
    startDate: "2028-04-18",
    endDate: "2028-05-04",
    createdBy: "demo-user",
    memberIds: ["demo-user"],
    createdAt: new Date("2026-05-20T10:00:00.000Z"),
    updatedAt: new Date("2026-05-20T10:00:00.000Z"),
  },
  {
    id: "ardennen-2025",
    title: "Ardennen weekend",
    destination: "Durbuy en omgeving",
    description:
      "Een kort familie-uitje met wandelingen, marktjes en rustige avonden samen.",
    startDate: "2025-10-17",
    endDate: "2025-10-20",
    createdBy: "demo-user",
    memberIds: ["demo-user"],
    createdAt: new Date("2025-08-01T12:00:00.000Z"),
    updatedAt: new Date("2025-08-01T12:00:00.000Z"),
  },
];

export function getTripById(tripId: string) {
  return mockTrips.find((trip) => trip.id === tripId);
}
