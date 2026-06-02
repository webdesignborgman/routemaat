import type { Trip } from "@/features/trips/tripTypes";

function slugifyTitle(title: string) {
  return (
    title
      .trim()
      .toLocaleLowerCase("nl-NL")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "reis"
  );
}

export function createUniqueTripId(title: string, existingTrips: Trip[]) {
  const baseId = slugifyTitle(title);
  const existingIds = new Set(existingTrips.map((trip) => trip.id));

  if (!existingIds.has(baseId)) {
    return baseId;
  }

  let suffix = 2;
  let nextId = `${baseId}-${suffix}`;

  while (existingIds.has(nextId)) {
    suffix += 1;
    nextId = `${baseId}-${suffix}`;
  }

  return nextId;
}
