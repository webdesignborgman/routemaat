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
  type DocumentData,
  type DocumentSnapshot,
  type FieldValue,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import {
  documentCategories,
  documentTypes,
} from "@/features/documents/documentLabels";
import type {
  CreateTravelDocumentInput,
  TravelDocument,
  TravelDocumentCategory,
  TravelDocumentType,
  UpdateTravelDocumentInput,
} from "@/features/documents/documentTypes";
import { db } from "@/lib/firebase";

type FirestoreDocumentCreateData = {
  tripId: string;
  title: string;
  category: TravelDocumentCategory;
  type: TravelDocumentType;
  url?: string;
  description?: string;
  notes?: string;
  relatedDate?: string;
  relatedTime?: string;
  fileName?: string;
  filePath?: string;
  fileContentType?: string;
  fileSize?: number;
  downloadUrl?: string;
  important: boolean;
  createdBy: string;
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

type FirestoreDocumentUpdateData = {
  title?: string;
  category?: TravelDocumentCategory;
  type?: TravelDocumentType;
  url?: string | FieldValue;
  description?: string | FieldValue;
  notes?: string | FieldValue;
  relatedDate?: string | FieldValue;
  relatedTime?: string | FieldValue;
  fileName?: string | FieldValue;
  filePath?: string | FieldValue;
  fileContentType?: string | FieldValue;
  fileSize?: number | FieldValue;
  downloadUrl?: string | FieldValue;
  important?: boolean;
  updatedAt: FieldValue;
};

function getRequiredDb() {
  if (!db) {
    throw new Error("Firebase is nog niet geconfigureerd.");
  }

  return db;
}

function documentsCollectionRef(tripId: string) {
  return collection(getRequiredDb(), "trips", tripId, "documents");
}

function documentDocRef(tripId: string, documentId: string) {
  return doc(getRequiredDb(), "trips", tripId, "documents", documentId);
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

function readOptionalNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
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

function isDocumentCategory(value: string): value is TravelDocumentCategory {
  return documentCategories.includes(value as TravelDocumentCategory);
}

function isDocumentType(value: string): value is TravelDocumentType {
  return documentTypes.includes(value as TravelDocumentType);
}

function optionalText(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}

function mapDocumentSnapshotToTravelDocument(
  snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
  tripId: string
): TravelDocument | null {
  if (!snapshot.exists()) {
    return null;
  }

  const rawData: unknown = snapshot.data();
  const data = isRecord(rawData) ? rawData : {};
  const category = readString(data, "category");
  const type = readString(data, "type");

  return {
    id: snapshot.id,
    tripId: readString(data, "tripId") || tripId,
    title: readString(data, "title") || "Zonder titel",
    category: isDocumentCategory(category) ? category : "other",
    type: isDocumentType(type) ? type : "note",
    url: readOptionalString(data, "url"),
    description: readOptionalString(data, "description"),
    notes: readOptionalString(data, "notes"),
    relatedDate: readOptionalString(data, "relatedDate"),
    relatedTime: readOptionalString(data, "relatedTime"),
    fileName: readOptionalString(data, "fileName"),
    filePath: readOptionalString(data, "filePath"),
    fileContentType: readOptionalString(data, "fileContentType"),
    fileSize: readOptionalNumber(data, "fileSize"),
    downloadUrl: readOptionalString(data, "downloadUrl"),
    important: readBoolean(data, "important"),
    createdBy: readString(data, "createdBy"),
    createdAt: readDate(data.createdAt),
    updatedAt: readDate(data.updatedAt),
  };
}

function mapCreateDocumentInputToFirestoreData(
  tripId: string,
  input: CreateTravelDocumentInput,
  userId: string
): FirestoreDocumentCreateData {
  const data: FirestoreDocumentCreateData = {
    tripId,
    title: input.title.trim(),
    category: input.category,
    type: input.type,
    important: input.important,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const url = optionalText(input.url);
  const description = optionalText(input.description);
  const notes = optionalText(input.notes);
  const relatedDate = optionalText(input.relatedDate);
  const relatedTime = optionalText(input.relatedTime);
  const fileName = optionalText(input.fileName);
  const filePath = optionalText(input.filePath);
  const fileContentType = optionalText(input.fileContentType);
  const downloadUrl = optionalText(input.downloadUrl);

  if (url) {
    data.url = url;
  }

  if (description) {
    data.description = description;
  }

  if (notes) {
    data.notes = notes;
  }

  if (relatedDate) {
    data.relatedDate = relatedDate;
  }

  if (relatedTime) {
    data.relatedTime = relatedTime;
  }

  if (fileName) {
    data.fileName = fileName;
  }

  if (filePath) {
    data.filePath = filePath;
  }

  if (fileContentType) {
    data.fileContentType = fileContentType;
  }

  if (typeof input.fileSize === "number" && Number.isFinite(input.fileSize)) {
    data.fileSize = input.fileSize;
  }

  if (downloadUrl) {
    data.downloadUrl = downloadUrl;
  }

  return data;
}

function mapUpdateDocumentInputToFirestoreData(
  input: UpdateTravelDocumentInput
): FirestoreDocumentUpdateData {
  const data: FirestoreDocumentUpdateData = {
    updatedAt: serverTimestamp(),
  };

  if (input.title !== undefined) {
    data.title = input.title.trim();
  }

  if (input.category !== undefined) {
    data.category = input.category;
  }

  if (input.type !== undefined) {
    data.type = input.type;
  }

  if (input.important !== undefined) {
    data.important = input.important;
  }

  if (Object.prototype.hasOwnProperty.call(input, "url")) {
    data.url = optionalText(input.url) ?? deleteField();
  }

  if (Object.prototype.hasOwnProperty.call(input, "description")) {
    data.description = optionalText(input.description) ?? deleteField();
  }

  if (Object.prototype.hasOwnProperty.call(input, "notes")) {
    data.notes = optionalText(input.notes) ?? deleteField();
  }

  if (Object.prototype.hasOwnProperty.call(input, "relatedDate")) {
    data.relatedDate = optionalText(input.relatedDate) ?? deleteField();
  }

  if (Object.prototype.hasOwnProperty.call(input, "relatedTime")) {
    data.relatedTime = optionalText(input.relatedTime) ?? deleteField();
  }

  if (Object.prototype.hasOwnProperty.call(input, "fileName")) {
    data.fileName = optionalText(input.fileName) ?? deleteField();
  }

  if (Object.prototype.hasOwnProperty.call(input, "filePath")) {
    data.filePath = optionalText(input.filePath) ?? deleteField();
  }

  if (Object.prototype.hasOwnProperty.call(input, "fileContentType")) {
    data.fileContentType =
      optionalText(input.fileContentType) ?? deleteField();
  }

  if (Object.prototype.hasOwnProperty.call(input, "fileSize")) {
    data.fileSize =
      typeof input.fileSize === "number" && Number.isFinite(input.fileSize)
        ? input.fileSize
        : deleteField();
  }

  if (Object.prototype.hasOwnProperty.call(input, "downloadUrl")) {
    data.downloadUrl = optionalText(input.downloadUrl) ?? deleteField();
  }

  return data;
}

export async function listDocumentsForTrip(
  tripId: string
): Promise<TravelDocument[]> {
  const snapshot = await getDocs(documentsCollectionRef(tripId));

  return snapshot.docs
    .map((documentSnapshot) =>
      mapDocumentSnapshotToTravelDocument(documentSnapshot, tripId)
    )
    .filter((document): document is TravelDocument => document !== null);
}

export async function getDocumentById(
  tripId: string,
  documentId: string
): Promise<TravelDocument | null> {
  return mapDocumentSnapshotToTravelDocument(
    await getDoc(documentDocRef(tripId, documentId)),
    tripId
  );
}

export async function createDocumentForTrip(
  tripId: string,
  input: CreateTravelDocumentInput,
  userId: string
): Promise<string> {
  const documentSnapshot = await addDoc(
    documentsCollectionRef(tripId),
    mapCreateDocumentInputToFirestoreData(tripId, input, userId)
  );

  return documentSnapshot.id;
}

export async function updateDocumentForTrip(
  tripId: string,
  documentId: string,
  input: UpdateTravelDocumentInput
): Promise<void> {
  await updateDoc(
    documentDocRef(tripId, documentId),
    mapUpdateDocumentInputToFirestoreData(input)
  );
}

export async function deleteDocumentForTrip(
  tripId: string,
  documentId: string
): Promise<void> {
  await deleteDoc(documentDocRef(tripId, documentId));
}
