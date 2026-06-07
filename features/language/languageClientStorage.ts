import { mockPhrases } from "@/features/language/languageMockData";
import { phraseCategories } from "@/features/language/languageLabels";
import type {
  PhraseCategory,
  TravelPhrase,
} from "@/features/language/languageTypes";

const STORAGE_KEY = "routemaat.mockPhrases.v1";
const DELETED_STORAGE_KEY = "routemaat.deletedMockPhrases.v1";
const emptyPhrases: TravelPhrase[] = [];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readRequiredString(record: Record<string, unknown>, key: keyof TravelPhrase) {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readOptionalString(record: Record<string, unknown>, key: keyof TravelPhrase) {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
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

function parseStoredPhrase(value: unknown): TravelPhrase | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readRequiredString(value, "id");
  const tripId = readRequiredString(value, "tripId");
  const category = readRequiredString(value, "category");
  const dutchText = readRequiredString(value, "dutchText");
  const translatedText = readRequiredString(value, "translatedText");
  const createdBy = readRequiredString(value, "createdBy");
  const createdAt = readDate(value.createdAt);
  const updatedAt = readDate(value.updatedAt);

  if (
    !id ||
    !tripId ||
    !category ||
    !phraseCategories.includes(category as PhraseCategory) ||
    !dutchText ||
    !translatedText ||
    !createdBy ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    id,
    tripId,
    category: category as PhraseCategory,
    dutchText,
    translatedText,
    nativeText: readOptionalString(value, "nativeText"),
    pronunciation: readOptionalString(value, "pronunciation"),
    notes: readOptionalString(value, "notes"),
    favorite: value.favorite === true,
    createdBy,
    createdAt,
    updatedAt,
  };
}

function parseStoredPhrases(storedValue: string | null) {
  if (!storedValue) {
    return emptyPhrases;
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return emptyPhrases;
    }

    return parsedValue
      .map((phrase) => parseStoredPhrase(phrase))
      .filter((phrase): phrase is TravelPhrase => phrase !== null);
  } catch {
    return emptyPhrases;
  }
}

function parseDeletedPhraseIds(storedValue: string | null) {
  if (!storedValue) {
    return new Set<string>();
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return new Set<string>();
    }

    return new Set(
      parsedValue.filter((item): item is string => typeof item === "string")
    );
  } catch {
    return new Set<string>();
  }
}

export function loadStoredPhrases() {
  if (typeof window === "undefined") {
    return emptyPhrases;
  }

  return parseStoredPhrases(window.localStorage.getItem(STORAGE_KEY));
}

function loadDeletedPhraseIds() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  return parseDeletedPhraseIds(window.localStorage.getItem(DELETED_STORAGE_KEY));
}

function saveDeletedPhraseIds(ids: Set<string>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(Array.from(ids)));
}

export function saveStoredPhrases(phrases: TravelPhrase[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(phrases));
}

export function mergePhrases(basePhrases: TravelPhrase[], storedPhrases: TravelPhrase[]) {
  const phrasesById = new Map<string, TravelPhrase>();

  for (const phrase of basePhrases) {
    phrasesById.set(phrase.id, phrase);
  }

  for (const phrase of storedPhrases) {
    phrasesById.set(phrase.id, phrase);
  }

  return Array.from(phrasesById.values());
}

export function loadTripPhrases(tripId: string) {
  const deletedPhraseIds = loadDeletedPhraseIds();

  return mergePhrases(mockPhrases, loadStoredPhrases()).filter(
    (phrase) => phrase.tripId === tripId
  ).filter(
    (phrase) => !deletedPhraseIds.has(phrase.id)
  );
}

export function saveTripPhrases(tripId: string, tripPhrases: TravelPhrase[]) {
  const otherTripPhrases = loadStoredPhrases().filter(
    (phrase) => phrase.tripId !== tripId
  );
  const nextPhraseIds = new Set(tripPhrases.map((phrase) => phrase.id));
  const deletedPhraseIds = loadDeletedPhraseIds();

  for (const phrase of mockPhrases) {
    if (phrase.tripId === tripId && !nextPhraseIds.has(phrase.id)) {
      deletedPhraseIds.add(phrase.id);
    }
  }

  saveDeletedPhraseIds(deletedPhraseIds);
  saveStoredPhrases([...otherTripPhrases, ...tripPhrases]);
}
