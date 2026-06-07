import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
  type FieldValue,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import type {
  CreateTravelPhraseInput,
  PhraseCategory,
  TravelPhrase,
  UpdateTravelPhraseInput,
} from "@/features/language/languageTypes";
import { db } from "@/lib/firebase";

type FirestorePhraseCreateData = {
  tripId: string;
  category: PhraseCategory;
  dutchText: string;
  translatedText: string;
  nativeText?: string;
  pronunciation?: string;
  notes?: string;
  favorite: boolean;
  createdBy: string;
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

type FirestorePhraseUpdateData = {
  category?: PhraseCategory;
  dutchText?: string;
  translatedText?: string;
  nativeText?: string | FieldValue;
  pronunciation?: string | FieldValue;
  notes?: string | FieldValue;
  favorite?: boolean;
  updatedAt: FieldValue;
};

function getRequiredDb() {
  if (!db) {
    throw new Error("Firebase is nog niet geconfigureerd.");
  }

  return db;
}

function phrasesCollectionRef(tripId: string) {
  return collection(getRequiredDb(), "trips", tripId, "phrases");
}

function phraseDocRef(tripId: string, phraseId: string) {
  return doc(getRequiredDb(), "trips", tripId, "phrases", phraseId);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function readOptionalString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function readBoolean(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "boolean" ? value : false;
}

function readDate(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  return new Date();
}

function isPhraseCategory(value: string): value is PhraseCategory {
  return [
    "general",
    "restaurant",
    "hotel",
    "transport",
    "temple",
    "onsen",
    "shop",
    "emergency",
    "custom",
  ].includes(value);
}

function optionalText(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}

export function mapPhraseDocToTravelPhrase(
  snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>
): TravelPhrase | null {
  if (!snapshot.exists()) {
    return null;
  }

  const rawData: unknown = snapshot.data();
  const data = isRecord(rawData) ? rawData : {};
  const category = readString(data, "category");

  return {
    id: snapshot.id,
    tripId: readString(data, "tripId"),
    category: isPhraseCategory(category) ? category : "custom",
    dutchText: readString(data, "dutchText"),
    translatedText: readString(data, "translatedText"),
    nativeText: readOptionalString(data, "nativeText"),
    pronunciation: readOptionalString(data, "pronunciation"),
    notes: readOptionalString(data, "notes"),
    favorite: readBoolean(data, "favorite"),
    createdBy: readString(data, "createdBy"),
    createdAt: readDate(data.createdAt),
    updatedAt: readDate(data.updatedAt),
  };
}

export function mapCreatePhraseInputToFirestoreData(
  tripId: string,
  input: CreateTravelPhraseInput,
  userId: string
): FirestorePhraseCreateData {
  const data: FirestorePhraseCreateData = {
    tripId,
    category: input.category,
    dutchText: input.dutchText.trim(),
    translatedText: input.translatedText.trim(),
    favorite: input.favorite,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const nativeText = optionalText(input.nativeText);
  const pronunciation = optionalText(input.pronunciation);
  const notes = optionalText(input.notes);

  if (nativeText) {
    data.nativeText = nativeText;
  }

  if (pronunciation) {
    data.pronunciation = pronunciation;
  }

  if (notes) {
    data.notes = notes;
  }

  return data;
}

export function mapUpdatePhraseInputToFirestoreData(
  input: UpdateTravelPhraseInput
): FirestorePhraseUpdateData {
  const data: FirestorePhraseUpdateData = {
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.dutchText !== undefined ? { dutchText: input.dutchText.trim() } : {}),
    ...(input.translatedText !== undefined
      ? { translatedText: input.translatedText.trim() }
      : {}),
    ...(input.favorite !== undefined ? { favorite: input.favorite } : {}),
    updatedAt: serverTimestamp(),
  };

  if (Object.prototype.hasOwnProperty.call(input, "nativeText")) {
    data.nativeText = optionalText(input.nativeText) ?? deleteField();
  }

  if (Object.prototype.hasOwnProperty.call(input, "pronunciation")) {
    data.pronunciation = optionalText(input.pronunciation) ?? deleteField();
  }

  if (Object.prototype.hasOwnProperty.call(input, "notes")) {
    data.notes = optionalText(input.notes) ?? deleteField();
  }

  return data;
}

export async function listPhrasesForTrip(
  tripId: string
): Promise<TravelPhrase[]> {
  const snapshot = await getDocs(phrasesCollectionRef(tripId));

  return snapshot.docs
    .map(mapPhraseDocToTravelPhrase)
    .filter((phrase): phrase is TravelPhrase => phrase !== null);
}

export async function getPhraseById(
  tripId: string,
  phraseId: string
): Promise<TravelPhrase | null> {
  return mapPhraseDocToTravelPhrase(await getDoc(phraseDocRef(tripId, phraseId)));
}

export async function createPhraseForTrip(
  tripId: string,
  input: CreateTravelPhraseInput,
  userId: string
): Promise<string> {
  const phraseSnapshot = await addDoc(
    phrasesCollectionRef(tripId),
    mapCreatePhraseInputToFirestoreData(tripId, input, userId)
  );

  return phraseSnapshot.id;
}

export async function updatePhraseForTrip(
  tripId: string,
  phraseId: string,
  input: UpdateTravelPhraseInput
): Promise<void> {
  await updateDoc(
    phraseDocRef(tripId, phraseId),
    mapUpdatePhraseInputToFirestoreData(input)
  );
}

export async function deletePhraseForTrip(
  tripId: string,
  phraseId: string
): Promise<void> {
  await deleteDoc(phraseDocRef(tripId, phraseId));
}

export async function importPhrasesForTrip(
  tripId: string,
  phrases: CreateTravelPhraseInput[],
  userId: string
): Promise<void> {
  const batch = writeBatch(getRequiredDb());

  phrases.forEach((phrase, index) => {
    const phraseId = createImportPhraseId(phrase, index);
    batch.set(
      phraseDocRef(tripId, phraseId),
      mapCreatePhraseInputToFirestoreData(tripId, phrase, userId)
    );
  });

  await batch.commit();
}

function createImportPhraseId(phrase: CreateTravelPhraseInput, index: number) {
  const baseId =
    phrase.dutchText
      .trim()
      .toLocaleLowerCase("nl-NL")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `zin-${index + 1}`;

  return `import-${baseId}`;
}
