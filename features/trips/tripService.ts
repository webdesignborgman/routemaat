import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
  type FieldValue,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import type { AuthUser } from "@/features/auth/authTypes";
import type {
  CreateTripInput,
  Trip,
  TripMember,
  TripRole,
  UpdateTripInput,
} from "@/features/trips/tripTypes";
import { db } from "@/lib/firebase";

type FirestoreTripCreateData = {
  title: string;
  destination: string;
  description?: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

type FirestoreTripUpdateData = {
  title?: string;
  destination?: string;
  description?: string | FieldValue;
  startDate?: string;
  endDate?: string;
  updatedAt: FieldValue;
};

type FirestoreTripMemberData = {
  role: TripRole;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  joinedAt: FieldValue;
};

function getRequiredDb() {
  if (!db) {
    throw new Error("Firebase is nog niet geconfigureerd.");
  }

  return db;
}

function tripsCollectionRef() {
  return collection(getRequiredDb(), "trips");
}

function tripDocRef(tripId: string) {
  return doc(getRequiredDb(), "trips", tripId);
}

function tripMemberDocRef(tripId: string, userId: string) {
  return doc(getRequiredDb(), "trips", tripId, "members", userId);
}

function tripMembersCollectionRef(tripId: string) {
  return collection(getRequiredDb(), "trips", tripId, "members");
}

function tripIdeasCollectionRef(tripId: string) {
  return collection(getRequiredDb(), "trips", tripId, "ideas");
}

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

async function createUniqueTripId(title: string) {
  const baseId = slugifyTitle(title);
  let nextId = baseId;
  let suffix = 2;

  while ((await getDoc(tripDocRef(nextId))).exists()) {
    nextId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return nextId;
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

function readNullableString(record: Record<string, unknown>, key: string) {
  const value = record[key];

  return typeof value === "string" ? value : null;
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

function isTripRole(value: string): value is TripRole {
  return ["owner", "admin", "editor", "viewer"].includes(value);
}

export function mapTripDocToTrip(
  snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>
): Trip {
  const rawData: unknown = snapshot.data();
  const data = isRecord(rawData) ? rawData : {};
  const createdBy = readString(data, "createdBy");

  return {
    id: snapshot.id,
    title: readString(data, "title") || "Zonder titel",
    destination: readString(data, "destination"),
    description: readOptionalString(data, "description"),
    startDate: readString(data, "startDate"),
    endDate: readString(data, "endDate"),
    createdBy,
    memberIds: createdBy ? [createdBy] : [],
    createdAt: readDate(data.createdAt),
    updatedAt: readDate(data.updatedAt),
  };
}

export function mapTripMemberDocToTripMember(
  snapshot: QueryDocumentSnapshot<DocumentData>
): TripMember {
  const rawData: unknown = snapshot.data();
  const data = isRecord(rawData) ? rawData : {};
  const role = readString(data, "role");

  return {
    userId: snapshot.id,
    role: isTripRole(role) ? role : "viewer",
    displayName: readNullableString(data, "displayName"),
    email: readNullableString(data, "email"),
    photoURL: readNullableString(data, "photoURL"),
    joinedAt: readDate(data.joinedAt),
  };
}

export function mapCreateTripInputToFirestoreData(
  input: CreateTripInput,
  user: AuthUser
): FirestoreTripCreateData {
  const data: FirestoreTripCreateData = {
    title: input.title,
    destination: input.destination,
    startDate: input.startDate,
    endDate: input.endDate,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (input.description) {
    data.description = input.description;
  }

  return data;
}

export function mapUpdateTripInputToFirestoreData(
  input: UpdateTripInput
): FirestoreTripUpdateData {
  const data: FirestoreTripUpdateData = {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.destination !== undefined ? { destination: input.destination } : {}),
    ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
    ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
    updatedAt: serverTimestamp(),
  };

  if (Object.prototype.hasOwnProperty.call(input, "description")) {
    data.description = input.description || deleteField();
  }

  return data;
}

function mapOwnerMemberToFirestoreData(user: AuthUser): FirestoreTripMemberData {
  return {
    role: "owner",
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    joinedAt: serverTimestamp(),
  };
}

export async function createTripForUser(
  input: CreateTripInput,
  user: AuthUser
): Promise<string> {
  const tripId = await createUniqueTripId(input.title);
  const batch = writeBatch(getRequiredDb());

  batch.set(tripDocRef(tripId), mapCreateTripInputToFirestoreData(input, user));
  batch.set(tripMemberDocRef(tripId, user.uid), mapOwnerMemberToFirestoreData(user));

  await batch.commit();

  return tripId;
}

export async function listTripsForUser(userId: string): Promise<Trip[]> {
  // Voor nu tonen we reizen die de gebruiker zelf heeft aangemaakt.
  // Bij uitnodigingen wordt dit uitgebreid naar members-based toegang.
  const tripsQuery = query(tripsCollectionRef(), where("createdBy", "==", userId));
  const snapshot = await getDocs(tripsQuery);

  return snapshot.docs
    .map(mapTripDocToTrip)
    .sort((firstTrip, secondTrip) =>
      firstTrip.startDate.localeCompare(secondTrip.startDate)
    );
}

export async function getTripById(tripId: string): Promise<Trip | null> {
  const snapshot = await getDoc(tripDocRef(tripId));

  return snapshot.exists() ? mapTripDocToTrip(snapshot) : null;
}

export async function updateTrip(
  tripId: string,
  input: UpdateTripInput
): Promise<void> {
  await updateDoc(tripDocRef(tripId), mapUpdateTripInputToFirestoreData(input));
}

export async function deleteTrip(tripId: string): Promise<void> {
  const database = getRequiredDb();
  const membersSnapshot = await getDocs(tripMembersCollectionRef(tripId));
  const ideasSnapshot = await getDocs(tripIdeasCollectionRef(tripId));
  const refsToDelete: DocumentReference<DocumentData>[] = [
    ...membersSnapshot.docs.map((snapshot) => snapshot.ref),
    ...ideasSnapshot.docs.map((snapshot) => snapshot.ref),
    tripDocRef(tripId),
  ];
  const batchSize = 450;

  for (let index = 0; index < refsToDelete.length; index += batchSize) {
    const batch = writeBatch(database);

    for (const ref of refsToDelete.slice(index, index + batchSize)) {
      batch.delete(ref);
    }

    await batch.commit();
  }
}
