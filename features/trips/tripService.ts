import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
  type FieldValue,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import type { AuthUser } from "@/features/auth/authTypes";
import type { TripMember } from "@/features/members/memberTypes";
import type {
  CreateTripInput,
  Trip,
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
  countryCode?: string;
  languageCode?: string;
  languageName?: string;
  nativeLanguageName?: string;
  createdBy: string;
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

type FirestoreTripMembershipSnapshotData = {
  tripId: string;
  role: TripRole;
};

type FirestoreTripUpdateData = {
  title?: string;
  destination?: string;
  description?: string | FieldValue;
  startDate?: string;
  endDate?: string;
  countryCode?: string | FieldValue;
  languageCode?: string | FieldValue;
  languageName?: string | FieldValue;
  nativeLanguageName?: string | FieldValue;
  updatedAt: FieldValue;
};

type FirestoreTripMemberData = {
  role: TripRole;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  joinedAt: FieldValue;
};

type FirestoreTripMembershipData = {
  tripId: string;
  role: TripRole;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  joinedAt: FieldValue;
  updatedAt: FieldValue;
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

function tripMembershipDocRef(userId: string, tripId: string) {
  return doc(getRequiredDb(), "users", userId, "tripMemberships", tripId);
}

function tripMembershipsCollectionRef(userId: string) {
  return collection(getRequiredDb(), "users", userId, "tripMemberships");
}

function tripMembersCollectionRef(tripId: string) {
  return collection(getRequiredDb(), "trips", tripId, "members");
}

function tripIdeasCollectionRef(tripId: string) {
  return collection(getRequiredDb(), "trips", tripId, "ideas");
}

function tripPhrasesCollectionRef(tripId: string) {
  return collection(getRequiredDb(), "trips", tripId, "phrases");
}

function tripInvitesCollectionRef(tripId: string) {
  return collection(getRequiredDb(), "trips", tripId, "invites");
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

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function isTripRole(value: string): value is TripRole {
  return ["owner", "admin", "editor", "viewer"].includes(value);
}

function mapMembershipSnapshotData(
  snapshot: QueryDocumentSnapshot<DocumentData>
): FirestoreTripMembershipSnapshotData {
  const rawData: unknown = snapshot.data();
  const data = isRecord(rawData) ? rawData : {};
  const role = readString(data, "role");

  return {
    tripId: readString(data, "tripId") || snapshot.id,
    role: isTripRole(role) ? role : "viewer",
  };
}

export function mapTripDocToTrip(
  snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>
): Trip {
  const rawData: unknown = snapshot.data();
  const data = isRecord(rawData) ? rawData : {};
  const createdBy = readString(data, "createdBy");
  const memberIds = readStringArray(data.memberIds);

  return {
    id: snapshot.id,
    title: readString(data, "title") || "Zonder titel",
    destination: readString(data, "destination"),
    description: readOptionalString(data, "description"),
    startDate: readString(data, "startDate"),
    endDate: readString(data, "endDate"),
    createdBy,
    memberIds: memberIds.length > 0 ? memberIds : createdBy ? [createdBy] : [],
    countryCode: readOptionalString(data, "countryCode"),
    languageCode: readOptionalString(data, "languageCode"),
    languageName: readOptionalString(data, "languageName"),
    nativeLanguageName: readOptionalString(data, "nativeLanguageName"),
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

  if (input.countryCode) {
    data.countryCode = input.countryCode;
  }

  if (input.languageCode) {
    data.languageCode = input.languageCode;
  }

  if (input.languageName) {
    data.languageName = input.languageName;
  }

  if (input.nativeLanguageName) {
    data.nativeLanguageName = input.nativeLanguageName;
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

  if (Object.prototype.hasOwnProperty.call(input, "countryCode")) {
    data.countryCode = input.countryCode || deleteField();
  }

  if (Object.prototype.hasOwnProperty.call(input, "languageCode")) {
    data.languageCode = input.languageCode || deleteField();
  }

  if (Object.prototype.hasOwnProperty.call(input, "languageName")) {
    data.languageName = input.languageName || deleteField();
  }

  if (Object.prototype.hasOwnProperty.call(input, "nativeLanguageName")) {
    data.nativeLanguageName = input.nativeLanguageName || deleteField();
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

function mapOwnerMembershipToFirestoreData(
  tripId: string,
  input: CreateTripInput
): FirestoreTripMembershipData {
  return {
    tripId,
    role: "owner",
    title: input.title,
    destination: input.destination,
    startDate: input.startDate,
    endDate: input.endDate,
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export async function createTripForUser(
  input: CreateTripInput,
  user: AuthUser
): Promise<string> {
  const tripId = await createUniqueTripId(input.title);
  const batch = writeBatch(getRequiredDb());

  batch.set(tripDocRef(tripId), {
    ...mapCreateTripInputToFirestoreData(input, user),
    memberIds: [user.uid],
  });
  batch.set(tripMemberDocRef(tripId, user.uid), mapOwnerMemberToFirestoreData(user));
  batch.set(
    tripMembershipDocRef(user.uid, tripId),
    mapOwnerMembershipToFirestoreData(tripId, input)
  );

  await batch.commit();

  return tripId;
}

export async function listTripsForUser(userId: string): Promise<Trip[]> {
  const [membershipSnapshot, legacyTripsSnapshot] = await Promise.all([
    getDocs(tripMembershipsCollectionRef(userId)),
    getDocs(query(tripsCollectionRef(), where("createdBy", "==", userId))),
  ]);
  const indexedTrips: Array<Trip | null> = await Promise.all(
    membershipSnapshot.docs.map(async (membershipDoc) => {
      const membership = mapMembershipSnapshotData(membershipDoc);
      const trip = await getTripById(membership.tripId);

      return trip
        ? {
            ...trip,
            currentUserRole: membership.role,
            memberCount: await countTripMembers(trip.id, trip.memberIds.length),
          }
        : null;
    })
  );
  const legacyTrips = await Promise.all(
    legacyTripsSnapshot.docs.map(async (tripSnapshot) => {
      const trip = mapTripDocToTrip(tripSnapshot);

      return {
        ...trip,
        currentUserRole: "owner" as const,
        memberCount: await countTripMembers(trip.id, trip.memberIds.length),
      };
    })
  );
  const tripsById = new Map<string, Trip>();

  for (const trip of indexedTrips) {
    if (trip) {
      tripsById.set(trip.id, trip);
    }
  }

  for (const trip of legacyTrips) {
    if (!tripsById.has(trip.id)) {
      tripsById.set(trip.id, trip);
    }
  }

  return Array.from(tripsById.values())
    .sort((firstTrip, secondTrip) =>
      firstTrip.startDate.localeCompare(secondTrip.startDate)
    );
}

export async function getTripById(tripId: string): Promise<Trip | null> {
  const snapshot = await getDoc(tripDocRef(tripId));

  if (!snapshot.exists()) {
    return null;
  }

  const trip = mapTripDocToTrip(snapshot);

  return {
    ...trip,
    memberCount: await countTripMembers(trip.id, trip.memberIds.length),
  };
}

async function countTripMembers(tripId: string, fallbackCount: number) {
  const membersSnapshot = await getDocs(tripMembersCollectionRef(tripId));

  return Math.max(membersSnapshot.size, fallbackCount);
}

export async function updateTrip(
  tripId: string,
  input: UpdateTripInput
): Promise<void> {
  const batch = writeBatch(getRequiredDb());
  const tripSnapshot = await getDoc(tripDocRef(tripId));
  const membersSnapshot = await getDocs(tripMembersCollectionRef(tripId));

  batch.update(tripDocRef(tripId), mapUpdateTripInputToFirestoreData(input));

  for (const memberSnapshot of membersSnapshot.docs) {
    const membershipUpdate: Partial<FirestoreTripMembershipData> & {
      updatedAt: FieldValue;
    } = {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.destination !== undefined
        ? { destination: input.destination }
        : {}),
      ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
      ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
      updatedAt: serverTimestamp(),
    };

    if (Object.keys(membershipUpdate).length > 1 || !tripSnapshot.exists()) {
      batch.update(tripMembershipDocRef(memberSnapshot.id, tripId), membershipUpdate);
    }
  }

  await batch.commit();
}

export async function deleteTrip(tripId: string): Promise<void> {
  const database = getRequiredDb();
  const membersSnapshot = await getDocs(tripMembersCollectionRef(tripId));
  const ideasSnapshot = await getDocs(tripIdeasCollectionRef(tripId));
  const phrasesSnapshot = await getDocs(tripPhrasesCollectionRef(tripId));
  const invitesSnapshot = await getDocs(tripInvitesCollectionRef(tripId));
  const refsToDelete: DocumentReference<DocumentData>[] = [
    ...membersSnapshot.docs.map((snapshot) => snapshot.ref),
    ...membersSnapshot.docs.map((snapshot) =>
      tripMembershipDocRef(snapshot.id, tripId)
    ),
    ...ideasSnapshot.docs.map((snapshot) => snapshot.ref),
    ...phrasesSnapshot.docs.map((snapshot) => snapshot.ref),
    ...invitesSnapshot.docs.map((snapshot) => snapshot.ref),
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
