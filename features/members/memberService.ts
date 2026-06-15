import {
  arrayRemove,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
  type FieldValue,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import type { AuthUser } from "@/features/auth/authTypes";
import type {
  TripInvite,
  TripInviteStatus,
  TripMember,
  TripRole,
} from "@/features/members/memberTypes";
import type { Trip } from "@/features/trips/tripTypes";
import { db } from "@/lib/firebase";

type UserProfile = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

type FirestoreTripMemberData = {
  role: TripRole;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  inviteId?: string;
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

function userDocRef(userId: string) {
  return doc(getRequiredDb(), "users", userId);
}

function tripDocRef(tripId: string) {
  return doc(getRequiredDb(), "trips", tripId);
}

function tripMembersCollectionRef(tripId: string) {
  return collection(getRequiredDb(), "trips", tripId, "members");
}

function tripMemberDocRef(tripId: string, userId: string) {
  return doc(getRequiredDb(), "trips", tripId, "members", userId);
}

function tripInvitesCollectionRef(tripId: string) {
  return collection(getRequiredDb(), "trips", tripId, "invites");
}

function tripInviteDocRef(tripId: string, inviteId: string) {
  return doc(getRequiredDb(), "trips", tripId, "invites", inviteId);
}

function pendingInvitesCollectionRef() {
  return collection(getRequiredDb(), "pendingInvites");
}

function pendingInviteDocRef(inviteId: string) {
  return doc(getRequiredDb(), "pendingInvites", inviteId);
}

function tripMembershipDocRef(userId: string, tripId: string) {
  return doc(getRequiredDb(), "users", userId, "tripMemberships", tripId);
}

function normalizeEmail(email: string) {
  return email.trim().toLocaleLowerCase("nl-NL");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
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

function isTripInviteStatus(value: string): value is TripInviteStatus {
  return ["pending", "accepted"].includes(value);
}

function mapTripSnapshotToTrip(
  snapshot: DocumentSnapshot<DocumentData>
): Trip | null {
  if (!snapshot.exists()) {
    return null;
  }

  const rawData: unknown = snapshot.data();
  const data = isRecord(rawData) ? rawData : {};
  const memberIdsValue = data.memberIds;
  const memberIds = Array.isArray(memberIdsValue)
    ? memberIdsValue.filter((memberId): memberId is string => typeof memberId === "string")
    : [];
  const createdBy = readString(data, "createdBy");

  return {
    id: snapshot.id,
    title: readString(data, "title") || "Zonder titel",
    destination: readString(data, "destination"),
    description: readString(data, "description") || undefined,
    startDate: readString(data, "startDate"),
    endDate: readString(data, "endDate"),
    createdBy,
    memberIds: memberIds.length > 0 ? memberIds : createdBy ? [createdBy] : [],
    createdAt: readDate(data.createdAt),
    updatedAt: readDate(data.updatedAt),
  };
}

function mapTripMemberDocToTripMember(
  snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>
): TripMember | null {
  if (!snapshot.exists()) {
    return null;
  }

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

function mapInviteDocToTripInvite(
  snapshot: QueryDocumentSnapshot<DocumentData>,
  tripId: string
): TripInvite {
  const rawData: unknown = snapshot.data();
  const data = isRecord(rawData) ? rawData : {};
  const role = readString(data, "role");
  const status = readString(data, "status");

  return {
    id: snapshot.id,
    tripId,
    email: readString(data, "email"),
    role: isTripRole(role) ? role : "viewer",
    status: isTripInviteStatus(status) ? status : "pending",
    invitedBy: readString(data, "invitedBy"),
    createdAt: readDate(data.createdAt),
    acceptedAt: data.acceptedAt ? readDate(data.acceptedAt) : undefined,
  };
}

function mapMemberToFirestoreData(
  userProfile: UserProfile,
  role: TripRole,
  inviteId?: string
): FirestoreTripMemberData {
  const data: FirestoreTripMemberData = {
    role,
    displayName: userProfile.displayName,
    email: userProfile.email,
    photoURL: userProfile.photoURL,
    joinedAt: serverTimestamp(),
  };

  if (inviteId) {
    data.inviteId = inviteId;
  }

  return data;
}

function mapAcceptedInviteMembershipToFirestoreData(
  tripId: string,
  role: TripRole
): FirestoreTripMembershipData {
  return {
    tripId,
    role,
    title: "",
    destination: "",
    startDate: "",
    endDate: "",
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function userToProfile(user: AuthUser): UserProfile {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email ? normalizeEmail(user.email) : null,
    photoURL: user.photoURL,
  };
}

async function getTripOrThrow(tripId: string) {
  const trip = mapTripSnapshotToTrip(await getDoc(tripDocRef(tripId)));

  if (!trip) {
    throw new Error("Reis niet gevonden.");
  }

  return trip;
}

export async function upsertUserProfile(user: AuthUser): Promise<void> {
  const profile = userToProfile(user);

  await setDoc(
    userDocRef(user.uid),
    {
      displayName: profile.displayName,
      email: profile.email,
      photoURL: profile.photoURL,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function listTripMembers(tripId: string): Promise<TripMember[]> {
  const snapshot = await getDocs(tripMembersCollectionRef(tripId));
  const members = snapshot.docs
    .map(mapTripMemberDocToTripMember)
    .filter((member): member is TripMember => member !== null);
  const trip = await getTripOrThrow(tripId);

  if (
    trip.createdBy &&
    !members.some((member) => member.userId === trip.createdBy)
  ) {
    members.push({
      userId: trip.createdBy,
      role: "owner",
      displayName: null,
      email: null,
      photoURL: null,
      joinedAt: trip.createdAt,
    });
  }

  return members.sort(
    (firstMember, secondMember) =>
      getRoleSortValue(firstMember.role) - getRoleSortValue(secondMember.role)
  );
}

export async function listPendingTripInvites(
  tripId: string
): Promise<TripInvite[]> {
  const invitesQuery = query(
    tripInvitesCollectionRef(tripId),
    where("status", "==", "pending")
  );
  const snapshot = await getDocs(invitesQuery);

  const invites = snapshot.docs
    .map((inviteSnapshot) => mapInviteDocToTripInvite(inviteSnapshot, tripId))
    .sort((firstInvite, secondInvite) =>
      firstInvite.email.localeCompare(secondInvite.email, "nl-NL")
    );

  if (invites.length > 0) {
    const batch = writeBatch(getRequiredDb());

    for (const invite of invites) {
      batch.set(
        pendingInviteDocRef(invite.id),
        {
          tripId: invite.tripId,
          email: invite.email,
          role: invite.role,
          status: invite.status,
          invitedBy: invite.invitedBy,
          createdAt: invite.createdAt,
        },
        { merge: true }
      );
    }

    await batch.commit();
  }

  return invites;
}

export async function getTripMember(
  tripId: string,
  userId: string
): Promise<TripMember | null> {
  const member = mapTripMemberDocToTripMember(
    await getDoc(tripMemberDocRef(tripId, userId))
  );

  if (member) {
    return member;
  }

  const trip = await getTripOrThrow(tripId);

  if (trip.createdBy !== userId) {
    return null;
  }

  return {
    userId,
    role: "owner",
    displayName: null,
    email: null,
    photoURL: null,
    joinedAt: trip.createdAt,
  };
}

export async function addMemberByEmail(
  tripId: string,
  email: string,
  role: TripRole,
  currentUser: AuthUser
): Promise<"added" | "invited"> {
  const normalizedEmail = normalizeEmail(email);
  await getTripOrThrow(tripId);
  const membersSnapshot = await getDocs(tripMembersCollectionRef(tripId));
  const isAlreadyMember = membersSnapshot.docs.some((memberSnapshot) => {
    const rawData: unknown = memberSnapshot.data();
    const data = isRecord(rawData) ? rawData : {};
    const memberEmail = readNullableString(data, "email");

    return memberEmail ? normalizeEmail(memberEmail) === normalizedEmail : false;
  });

  if (isAlreadyMember) {
    return "added";
  }

  const inviteRef = doc(tripInvitesCollectionRef(tripId));
  const pendingInviteData = {
    tripId,
    email: normalizedEmail,
    role,
    status: "pending",
    invitedBy: currentUser.uid,
    createdAt: serverTimestamp(),
  } satisfies Omit<TripInvite, "id" | "createdAt"> & { createdAt: FieldValue };
  const batch = writeBatch(getRequiredDb());

  batch.set(inviteRef, {
    email: pendingInviteData.email,
    role: pendingInviteData.role,
    status: pendingInviteData.status,
    invitedBy: pendingInviteData.invitedBy,
    createdAt: pendingInviteData.createdAt,
  });
  batch.set(pendingInviteDocRef(inviteRef.id), pendingInviteData);

  await batch.commit();

  return "invited";
}

export async function updateTripMemberRole(
  tripId: string,
  userId: string,
  role: TripRole
): Promise<void> {
  const batch = writeBatch(getRequiredDb());

  batch.update(tripMemberDocRef(tripId, userId), { role });
  batch.update(tripMembershipDocRef(userId, tripId), {
    role,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function removeTripMember(
  tripId: string,
  userId: string
): Promise<void> {
  const batch = writeBatch(getRequiredDb());

  batch.delete(tripMemberDocRef(tripId, userId));
  batch.delete(tripMembershipDocRef(userId, tripId));
  batch.update(tripDocRef(tripId), {
    memberIds: arrayRemove(userId),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function cancelTripInvite(
  tripId: string,
  inviteId: string
): Promise<void> {
  const batch = writeBatch(getRequiredDb());

  batch.delete(tripInviteDocRef(tripId, inviteId));
  batch.delete(pendingInviteDocRef(inviteId));
  batch.update(tripDocRef(tripId), { updatedAt: serverTimestamp() });

  await batch.commit();
}

export async function acceptPendingInvitesForUser(user: AuthUser): Promise<void> {
  if (!user.email) {
    return;
  }

  await upsertUserProfile(user);

  const invitesQuery = query(
    pendingInvitesCollectionRef(),
    where("email", "==", normalizeEmail(user.email)),
    where("status", "==", "pending")
  );
  const snapshot = await getDocs(invitesQuery);

  for (const inviteSnapshot of snapshot.docs) {
    const rawData: unknown = inviteSnapshot.data();
    const data = isRecord(rawData) ? rawData : {};
    const tripId = readString(data, "tripId");

    if (!tripId) {
      continue;
    }

    const invite = mapInviteDocToTripInvite(inviteSnapshot, tripId);
    const profile = userToProfile(user);
    const batch = writeBatch(getRequiredDb());

    batch.set(
      tripMemberDocRef(invite.tripId, user.uid),
      mapMemberToFirestoreData(profile, invite.role, invite.id)
    );
    batch.set(
      tripMembershipDocRef(user.uid, invite.tripId),
      mapAcceptedInviteMembershipToFirestoreData(invite.tripId, invite.role)
    );
    batch.update(tripInviteDocRef(invite.tripId, invite.id), {
      status: "accepted",
      acceptedAt: serverTimestamp(),
    });
    batch.update(inviteSnapshot.ref, {
      status: "accepted",
      acceptedAt: serverTimestamp(),
    });

    await batch.commit();
  }
}

function getRoleSortValue(role: TripRole) {
  const sortValues: Record<TripRole, number> = {
    owner: 0,
    admin: 1,
    editor: 2,
    viewer: 3,
  };

  return sortValues[role];
}
