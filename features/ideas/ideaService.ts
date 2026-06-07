import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type DocumentData,
  type FieldValue,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import {
  ideaCategories,
  ideaPriorities,
  ideaStatuses,
} from "@/features/ideas/ideaLabels";
import type {
  CreateTripIdeaInput,
  IdeaCategory,
  IdeaPriority,
  IdeaStatus,
  TripIdea,
  UpdateTripIdeaInput,
} from "@/features/ideas/ideaTypes";
import type { TripRole } from "@/features/trips/tripTypes";
import type { Trip } from "@/features/trips/tripTypes";
import { db } from "@/lib/firebase";

type FirestoreIdeaWriteValue = string | string[] | boolean | Timestamp | FieldValue;
type FirestoreIdeaWriteData = Record<string, FirestoreIdeaWriteValue>;
type FirestoreTripSeedData = {
  title: string;
  destination: string;
  description?: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  memberIds: string[];
  createdAt: Timestamp;
  updatedAt: FieldValue;
};
type FirestoreTripMemberSeedData = {
  userId: string;
  tripId: string;
  role: TripRole;
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

const optionalTextFields = [
  "city",
  "locationName",
  "googleMapsUrl",
  "websiteUrl",
  "customsNotes",
  "notes",
  "scheduleDate",
  "startTime",
  "endTime",
] as const satisfies readonly (keyof CreateTripIdeaInput)[];

function getRequiredDb() {
  if (!db) {
    throw new Error("Firebase is nog niet geconfigureerd.");
  }

  return db;
}

function ideasCollectionRef(tripId: string) {
  return collection(getRequiredDb(), "trips", tripId, "ideas");
}

function ideaDocRef(tripId: string, ideaId: string) {
  return doc(getRequiredDb(), "trips", tripId, "ideas", ideaId);
}

function tripDocRef(tripId: string) {
  return doc(getRequiredDb(), "trips", tripId);
}

function tripMemberDocRef(tripId: string, userId: string) {
  return doc(getRequiredDb(), "trips", tripId, "members", userId);
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
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function readTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((tag): tag is string => typeof tag === "string");
}

function readBoolean(record: Record<string, unknown>, key: string) {
  return record[key] === true;
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

function isIdeaCategory(value: string): value is IdeaCategory {
  return ideaCategories.includes(value as IdeaCategory);
}

function isIdeaStatus(value: string): value is IdeaStatus {
  return ideaStatuses.includes(value as IdeaStatus);
}

function isIdeaPriority(value: string): value is IdeaPriority {
  return ideaPriorities.includes(value as IdeaPriority);
}

function addOptionalText(
  data: FirestoreIdeaWriteData,
  key: (typeof optionalTextFields)[number],
  value: string | undefined
) {
  if (value) {
    data[key] = value;
  }
}

function hasInputField<Key extends keyof CreateTripIdeaInput>(
  input: UpdateTripIdeaInput,
  key: Key
) {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function setOptionalTextUpdate(
  data: FirestoreIdeaWriteData,
  input: UpdateTripIdeaInput,
  key: (typeof optionalTextFields)[number]
) {
  if (!hasInputField(input, key)) {
    return;
  }

  const value = input[key];
  data[key] = typeof value === "string" && value.length > 0 ? value : deleteField();
}

export function mapIdeaDocToTripIdea(
  snapshot: QueryDocumentSnapshot<DocumentData>,
  tripId: string
): TripIdea {
  const rawData: unknown = snapshot.data();
  const data = isRecord(rawData) ? rawData : {};
  const category = readString(data, "category");
  const status = readString(data, "status");
  const priority = readString(data, "priority");

  return {
    id: snapshot.id,
    tripId: readString(data, "tripId") || tripId,
    title: readString(data, "title") || "Zonder titel",
    description: readString(data, "description"),
    category: isIdeaCategory(category) ? category : "other",
    tags: readTags(data.tags),
    city: readOptionalString(data, "city"),
    locationName: readOptionalString(data, "locationName"),
    googleMapsUrl: readOptionalString(data, "googleMapsUrl"),
    websiteUrl: readOptionalString(data, "websiteUrl"),
    customsNotes: readOptionalString(data, "customsNotes"),
    notes: readOptionalString(data, "notes"),
    status: isIdeaStatus(status) ? status : "idea",
    priority: isIdeaPriority(priority) ? priority : "medium",
    showInSchedule: readBoolean(data, "showInSchedule"),
    scheduleDate: readOptionalString(data, "scheduleDate"),
    startTime: readOptionalString(data, "startTime"),
    endTime: readOptionalString(data, "endTime"),
    addedBy: readString(data, "addedBy"),
    createdAt: readDate(data.createdAt),
    updatedAt: readDate(data.updatedAt),
  };
}

export function mapCreateIdeaInputToFirestoreData(
  tripId: string,
  input: CreateTripIdeaInput,
  userId: string
): FirestoreIdeaWriteData {
  const data: FirestoreIdeaWriteData = {
    tripId,
    title: input.title,
    description: input.description,
    category: input.category,
    tags: input.tags,
    status: input.status,
    priority: input.priority,
    showInSchedule: input.showInSchedule,
    addedBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  addOptionalText(data, "city", input.city);
  addOptionalText(data, "locationName", input.locationName);
  addOptionalText(data, "googleMapsUrl", input.googleMapsUrl);
  addOptionalText(data, "websiteUrl", input.websiteUrl);
  addOptionalText(data, "customsNotes", input.customsNotes);
  addOptionalText(data, "notes", input.notes);

  if (input.showInSchedule) {
    addOptionalText(data, "scheduleDate", input.scheduleDate);
    addOptionalText(data, "startTime", input.startTime);
    addOptionalText(data, "endTime", input.endTime);
  }

  return data;
}

export function mapTripIdeaToFirestoreData(
  idea: TripIdea
): FirestoreIdeaWriteData {
  const data: FirestoreIdeaWriteData = {
    tripId: idea.tripId,
    title: idea.title,
    description: idea.description,
    category: idea.category,
    tags: idea.tags,
    status: idea.status,
    priority: idea.priority,
    showInSchedule: idea.showInSchedule,
    addedBy: idea.addedBy,
    createdAt: Timestamp.fromDate(idea.createdAt),
    updatedAt: Timestamp.fromDate(idea.updatedAt),
  };

  addOptionalText(data, "city", idea.city);
  addOptionalText(data, "locationName", idea.locationName);
  addOptionalText(data, "googleMapsUrl", idea.googleMapsUrl);
  addOptionalText(data, "websiteUrl", idea.websiteUrl);
  addOptionalText(data, "customsNotes", idea.customsNotes);
  addOptionalText(data, "notes", idea.notes);

  if (idea.showInSchedule) {
    addOptionalText(data, "scheduleDate", idea.scheduleDate);
    addOptionalText(data, "startTime", idea.startTime);
    addOptionalText(data, "endTime", idea.endTime);
  }

  return data;
}

export function mapUpdateIdeaInputToFirestoreData(
  input: UpdateTripIdeaInput
): FirestoreIdeaWriteData {
  const data: FirestoreIdeaWriteData = {
    updatedAt: serverTimestamp(),
  };

  if (typeof input.title === "string") {
    data.title = input.title;
  }

  if (typeof input.description === "string") {
    data.description = input.description;
  }

  if (input.category) {
    data.category = input.category;
  }

  if (Array.isArray(input.tags)) {
    data.tags = input.tags;
  }

  if (input.status) {
    data.status = input.status;
  }

  if (input.priority) {
    data.priority = input.priority;
  }

  if (typeof input.showInSchedule === "boolean") {
    data.showInSchedule = input.showInSchedule;
  }

  for (const key of optionalTextFields) {
    setOptionalTextUpdate(data, input, key);
  }

  if (input.showInSchedule === false) {
    data.scheduleDate = deleteField();
    data.startTime = deleteField();
    data.endTime = deleteField();
  }

  return data;
}

export async function listIdeasForTrip(tripId: string): Promise<TripIdea[]> {
  const ideasQuery = query(ideasCollectionRef(tripId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(ideasQuery);

  return snapshot.docs.map((ideaSnapshot) =>
    mapIdeaDocToTripIdea(ideaSnapshot, tripId)
  );
}

export async function getIdeaById(
  tripId: string,
  ideaId: string
): Promise<TripIdea | null> {
  const snapshot = await getDoc(ideaDocRef(tripId, ideaId));

  return snapshot.exists() ? mapIdeaDocToTripIdea(snapshot, tripId) : null;
}

export async function createIdeaForTrip(
  tripId: string,
  input: CreateTripIdeaInput,
  userId: string
): Promise<string> {
  const docRef = await addDoc(
    ideasCollectionRef(tripId),
    mapCreateIdeaInputToFirestoreData(tripId, input, userId)
  );

  return docRef.id;
}

export async function ensureTripDocumentsForIdeaWrites(
  trip: Trip,
  userId: string
): Promise<void> {
  const tripRef = tripDocRef(trip.id);
  const tripSnapshot = await getDoc(tripRef);

  if (!tripSnapshot.exists()) {
    const tripData: FirestoreTripSeedData = {
      title: trip.title,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      createdBy: userId,
      memberIds: [userId],
      createdAt: Timestamp.fromDate(trip.createdAt),
      updatedAt: serverTimestamp(),
    };

    if (trip.description) {
      tripData.description = trip.description;
    }

    await setDoc(tripRef, tripData);
  }

  const memberRef = tripMemberDocRef(trip.id, userId);
  const memberSnapshot = await getDoc(memberRef);

  if (!memberSnapshot.exists()) {
    const memberData: FirestoreTripMemberSeedData = {
      userId,
      tripId: trip.id,
      role: "owner",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(memberRef, memberData);
  }
}

export async function updateIdeaForTrip(
  tripId: string,
  ideaId: string,
  input: UpdateTripIdeaInput
): Promise<void> {
  await updateDoc(ideaDocRef(tripId, ideaId), mapUpdateIdeaInputToFirestoreData(input));
}

export async function deleteIdeaForTrip(
  tripId: string,
  ideaId: string
): Promise<void> {
  await deleteDoc(ideaDocRef(tripId, ideaId));
}
