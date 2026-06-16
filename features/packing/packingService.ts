import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type FieldValue,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import {
  defaultPackingItems,
  packingCategories,
} from "@/features/packing/packingCategories";
import type {
  CreatePackingItemInput,
  PackingCategory,
  PackingCheck,
  PackingItem,
  UpdatePackingItemInput,
} from "@/features/packing/packingTypes";
import { db } from "@/lib/firebase";

type FirestorePackingItemCreateData = {
  userId: string;
  name: string;
  category: PackingCategory;
  quantity: number;
  note?: string;
  isDefault: boolean;
  isArchived: boolean;
  sortOrder: number;
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

type FirestorePackingItemUpdateData = {
  name?: string;
  category?: PackingCategory;
  quantity?: number;
  note?: string | FieldValue;
  isDefault?: boolean;
  isArchived?: boolean;
  sortOrder?: number;
  updatedAt: FieldValue;
};

function getRequiredDb() {
  if (!db) {
    throw new Error("Firebase is nog niet geconfigureerd.");
  }

  return db;
}

function packingItemsCollectionRef(userId: string) {
  return collection(getRequiredDb(), "users", userId, "packingItems");
}

function packingItemDocRef(userId: string, itemId: string) {
  return doc(getRequiredDb(), "users", userId, "packingItems", itemId);
}

function packingChecksCollectionRef(tripId: string) {
  return collection(getRequiredDb(), "trips", tripId, "packingChecks");
}

function packingCheckDocRef(tripId: string, userId: string, itemId: string) {
  return doc(
    getRequiredDb(),
    "trips",
    tripId,
    "packingChecks",
    `${userId}_${itemId}`
  );
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
  return record[key] === true;
}

function readNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
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

function optionalText(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}

function isPackingCategory(value: string): value is PackingCategory {
  return packingCategories.includes(value as PackingCategory);
}

function mapPackingItemSnapshotToPackingItem(
  snapshot: QueryDocumentSnapshot<DocumentData>,
  userId: string
): PackingItem {
  const rawData: unknown = snapshot.data();
  const data = isRecord(rawData) ? rawData : {};
  const category = readString(data, "category");

  return {
    id: snapshot.id,
    userId: readString(data, "userId") || userId,
    name: readString(data, "name") || "Zonder naam",
    category: isPackingCategory(category) ? category : "overig",
    quantity: Math.max(1, readNumber(data, "quantity") || 1),
    note: readOptionalString(data, "note"),
    isDefault: readBoolean(data, "isDefault"),
    isArchived: readBoolean(data, "isArchived"),
    sortOrder: readNumber(data, "sortOrder"),
    createdAt: readDate(data.createdAt),
    updatedAt: readDate(data.updatedAt),
  };
}

function mapPackingCheckSnapshotToPackingCheck(
  snapshot: QueryDocumentSnapshot<DocumentData>,
  tripId: string
): PackingCheck {
  const rawData: unknown = snapshot.data();
  const data = isRecord(rawData) ? rawData : {};

  return {
    id: snapshot.id,
    tripId: readString(data, "tripId") || tripId,
    userId: readString(data, "userId"),
    itemId: readString(data, "itemId"),
    checked: readBoolean(data, "checked"),
    updatedAt: readDate(data.updatedAt),
  };
}

function mapCreatePackingItemInputToFirestoreData(
  userId: string,
  input: CreatePackingItemInput
): FirestorePackingItemCreateData {
  const data: FirestorePackingItemCreateData = {
    userId,
    name: input.name.trim(),
    category: input.category,
    quantity: Math.max(1, Math.round(input.quantity)),
    isDefault: input.isDefault,
    isArchived: false,
    sortOrder: input.sortOrder ?? Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const note = optionalText(input.note);

  if (note) {
    data.note = note;
  }

  return data;
}

function mapUpdatePackingItemInputToFirestoreData(
  input: UpdatePackingItemInput
): FirestorePackingItemUpdateData {
  const data: FirestorePackingItemUpdateData = {
    updatedAt: serverTimestamp(),
  };

  if (input.name !== undefined) {
    data.name = input.name.trim();
  }

  if (input.category !== undefined) {
    data.category = input.category;
  }

  if (input.quantity !== undefined) {
    data.quantity = Math.max(1, Math.round(input.quantity));
  }

  if (Object.prototype.hasOwnProperty.call(input, "note")) {
    data.note = optionalText(input.note) ?? "";
  }

  if (input.isDefault !== undefined) {
    data.isDefault = input.isDefault;
  }

  if (input.isArchived !== undefined) {
    data.isArchived = input.isArchived;
  }

  if (input.sortOrder !== undefined) {
    data.sortOrder = input.sortOrder;
  }

  return data;
}

export async function listPackingItemsForUser(
  userId: string
): Promise<PackingItem[]> {
  const snapshot = await getDocs(packingItemsCollectionRef(userId));

  return snapshot.docs.map((itemSnapshot) =>
    mapPackingItemSnapshotToPackingItem(itemSnapshot, userId)
  );
}

export async function createPackingItemForUser(
  userId: string,
  input: CreatePackingItemInput
): Promise<string> {
  const itemRef = doc(packingItemsCollectionRef(userId));

  await setDoc(itemRef, mapCreatePackingItemInputToFirestoreData(userId, input));

  return itemRef.id;
}

export async function updatePackingItemForUser(
  userId: string,
  itemId: string,
  input: UpdatePackingItemInput
): Promise<void> {
  await updateDoc(
    packingItemDocRef(userId, itemId),
    mapUpdatePackingItemInputToFirestoreData(input)
  );
}

export async function deletePackingItemForUser(
  userId: string,
  itemId: string
): Promise<void> {
  await deleteDoc(packingItemDocRef(userId, itemId));
}

export async function createDefaultPackingItemsForUser(
  userId: string
): Promise<number> {
  const existingItems = await listPackingItemsForUser(userId);

  if (existingItems.length > 0) {
    return 0;
  }

  const batch = writeBatch(getRequiredDb());

  defaultPackingItems.forEach((item, index) => {
    const itemRef = doc(packingItemsCollectionRef(userId));

    batch.set(
      itemRef,
      mapCreatePackingItemInputToFirestoreData(userId, {
        ...item,
        isDefault: true,
        sortOrder: index * 10,
      })
    );
  });

  await batch.commit();

  return defaultPackingItems.length;
}

export async function listPackingChecksForTrip(
  tripId: string,
  userId: string
): Promise<PackingCheck[]> {
  const checksQuery = query(
    packingChecksCollectionRef(tripId),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(checksQuery);

  return snapshot.docs.map((checkSnapshot) =>
    mapPackingCheckSnapshotToPackingCheck(checkSnapshot, tripId)
  );
}

export async function setPackingCheckForTrip(
  tripId: string,
  userId: string,
  itemId: string,
  checked: boolean
): Promise<void> {
  await setDoc(
    packingCheckDocRef(tripId, userId, itemId),
    {
      tripId,
      userId,
      itemId,
      checked,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function resetPackingChecksForTrip(
  tripId: string,
  userId: string
): Promise<void> {
  const checks = await listPackingChecksForTrip(tripId, userId);
  const batch = writeBatch(getRequiredDb());

  checks.forEach((check) => {
    batch.delete(doc(getRequiredDb(), "trips", tripId, "packingChecks", check.id));
  });

  await batch.commit();
}
