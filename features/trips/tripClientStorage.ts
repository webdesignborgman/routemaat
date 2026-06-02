import type { Trip } from "@/features/trips/tripTypes";

const STORAGE_KEY = "routemaat.mockTrips.v1";
const emptyTrips: Trip[] = [];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readRequiredString(record: Record<string, unknown>, key: keyof Trip) {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const strings = value.filter((item): item is string => typeof item === "string");
  return strings.length === value.length ? strings : null;
}

function parseStoredTrip(value: unknown): Trip | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readRequiredString(value, "id");
  const title = readRequiredString(value, "title");
  const destination = readRequiredString(value, "destination");
  const startDate = readRequiredString(value, "startDate");
  const endDate = readRequiredString(value, "endDate");
  const createdBy = readRequiredString(value, "createdBy");
  const memberIds = readStringArray(value.memberIds);
  const createdAt = readDate(value.createdAt);
  const updatedAt = readDate(value.updatedAt);
  const description =
    typeof value.description === "string" && value.description.trim().length > 0
      ? value.description
      : undefined;

  if (
    !id ||
    !title ||
    !destination ||
    !startDate ||
    !endDate ||
    !createdBy ||
    !memberIds ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    id,
    title,
    destination,
    description,
    startDate,
    endDate,
    createdBy,
    memberIds,
    createdAt,
    updatedAt,
  };
}

function parseStoredTripsSnapshot(storedValue: string | null) {
  if (!storedValue) {
    return emptyTrips;
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return emptyTrips;
    }

    return parsedValue
      .map((trip) => parseStoredTrip(trip))
      .filter((trip): trip is Trip => trip !== null);
  } catch {
    return emptyTrips;
  }
}

export function loadStoredTrips() {
  if (typeof window === "undefined") {
    return emptyTrips;
  }

  return parseStoredTripsSnapshot(window.localStorage.getItem(STORAGE_KEY));
}

export function saveStoredTrips(trips: Trip[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

export function mergeTrips(baseTrips: Trip[], storedTrips: Trip[]) {
  const tripsById = new Map<string, Trip>();

  for (const trip of baseTrips) {
    tripsById.set(trip.id, trip);
  }

  for (const trip of storedTrips) {
    tripsById.set(trip.id, trip);
  }

  return Array.from(tripsById.values());
}
