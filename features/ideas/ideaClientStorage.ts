import { mockIdeas } from "@/features/ideas/ideaMockData";
import {
  ideaCategories,
  ideaPriorities,
  ideaStatuses,
} from "@/features/ideas/ideaLabels";
import type {
  IdeaCategory,
  IdeaPriority,
  IdeaStatus,
  TripIdea,
} from "@/features/ideas/ideaTypes";

const STORAGE_KEY = "routemaat.mockIdeas.v1";
const emptyIdeas: TripIdea[] = [];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(record: Record<string, unknown>, key: keyof TripIdea) {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function readOptionalString(record: Record<string, unknown>, key: keyof TripIdea) {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const strings = value.filter((item): item is string => typeof item === "string");
  return strings.length === value.length ? strings : null;
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

function parseStoredIdea(value: unknown): TripIdea | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value, "id");
  const tripId = readString(value, "tripId");
  const title = readString(value, "title");
  const description = readString(value, "description");
  const category = readString(value, "category");
  const status = readString(value, "status");
  const priority = readString(value, "priority");
  const tags = readStringArray(value.tags);
  const addedBy = readString(value, "addedBy");
  const createdAt = readDate(value.createdAt);
  const updatedAt = readDate(value.updatedAt);

  if (
    !id ||
    !tripId ||
    !title ||
    description === null ||
    !category ||
    !ideaCategories.includes(category as IdeaCategory) ||
    !status ||
    !ideaStatuses.includes(status as IdeaStatus) ||
    !priority ||
    !ideaPriorities.includes(priority as IdeaPriority) ||
    !tags ||
    !addedBy ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    id,
    tripId,
    title,
    description,
    category: category as IdeaCategory,
    tags,
    city: readOptionalString(value, "city"),
    locationName: readOptionalString(value, "locationName"),
    googleMapsUrl: readOptionalString(value, "googleMapsUrl"),
    websiteUrl: readOptionalString(value, "websiteUrl"),
    notes: readOptionalString(value, "notes"),
    customsNotes: readOptionalString(value, "customsNotes"),
    showInSchedule: value.showInSchedule === true,
    scheduleDate: readOptionalString(value, "scheduleDate"),
    startTime: readOptionalString(value, "startTime"),
    endTime: readOptionalString(value, "endTime"),
    status: status as IdeaStatus,
    priority: priority as IdeaPriority,
    addedBy,
    createdAt,
    updatedAt,
  };
}

function parseStoredIdeas(storedValue: string | null) {
  if (!storedValue) {
    return emptyIdeas;
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return emptyIdeas;
    }

    return parsedValue
      .map((idea) => parseStoredIdea(idea))
      .filter((idea): idea is TripIdea => idea !== null);
  } catch {
    return emptyIdeas;
  }
}

export function loadStoredIdeas() {
  if (typeof window === "undefined") {
    return emptyIdeas;
  }

  return parseStoredIdeas(window.localStorage.getItem(STORAGE_KEY));
}

export function saveStoredIdeas(ideas: TripIdea[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
}

export function mergeIdeas(baseIdeas: TripIdea[], storedIdeas: TripIdea[]) {
  const ideasById = new Map<string, TripIdea>();

  for (const idea of baseIdeas) {
    ideasById.set(idea.id, idea);
  }

  for (const idea of storedIdeas) {
    ideasById.set(idea.id, idea);
  }

  return Array.from(ideasById.values());
}

export function loadTripIdeas(tripId: string) {
  return mergeIdeas(mockIdeas, loadStoredIdeas()).filter(
    (idea) => idea.tripId === tripId
  );
}

export function saveTripIdeas(tripId: string, tripIdeas: TripIdea[]) {
  const otherTripIdeas = loadStoredIdeas().filter((idea) => idea.tripId !== tripId);
  saveStoredIdeas([...otherTripIdeas, ...tripIdeas]);
}
