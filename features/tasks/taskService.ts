import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type DocumentData,
  type FieldValue,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import {
  taskCategories,
  taskPriorities,
  taskStatuses,
} from "@/features/tasks/taskLabels";
import type {
  CreateTripTaskInput,
  TripTask,
  TripTaskCategory,
  TripTaskPriority,
  TripTaskStatus,
  UpdateTripTaskInput,
} from "@/features/tasks/taskTypes";
import { db } from "@/lib/firebase";

type FirestoreTaskCreateData = {
  tripId: string;
  title: string;
  description?: string;
  status: TripTaskStatus;
  priority: TripTaskPriority;
  category: TripTaskCategory;
  assignedToUserId?: string;
  assignedToDisplayName?: string;
  dueDate?: string;
  completedAt?: FieldValue;
  completedBy?: string;
  createdBy: string;
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

type FirestoreTaskUpdateData = {
  title?: string;
  description?: string | FieldValue;
  status?: TripTaskStatus;
  priority?: TripTaskPriority;
  category?: TripTaskCategory;
  assignedToUserId?: string | FieldValue;
  assignedToDisplayName?: string | FieldValue;
  dueDate?: string | FieldValue;
  completedAt?: Timestamp | FieldValue;
  completedBy?: string | FieldValue;
  updatedAt: FieldValue;
};

function getRequiredDb() {
  if (!db) {
    throw new Error("Firebase is nog niet geconfigureerd.");
  }

  return db;
}

function tasksCollectionRef(tripId: string) {
  return collection(getRequiredDb(), "trips", tripId, "tasks");
}

function taskDocRef(tripId: string, taskId: string) {
  return doc(getRequiredDb(), "trips", tripId, "tasks", taskId);
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

function isTaskStatus(value: string): value is TripTaskStatus {
  return taskStatuses.includes(value as TripTaskStatus);
}

function isTaskPriority(value: string): value is TripTaskPriority {
  return taskPriorities.includes(value as TripTaskPriority);
}

function isTaskCategory(value: string): value is TripTaskCategory {
  return taskCategories.includes(value as TripTaskCategory);
}

function mapTaskSnapshotToTripTask(
  snapshot: QueryDocumentSnapshot<DocumentData>,
  tripId: string
): TripTask {
  const rawData: unknown = snapshot.data();
  const data = isRecord(rawData) ? rawData : {};
  const status = readString(data, "status");
  const priority = readString(data, "priority");
  const category = readString(data, "category");
  const completedAt = data.completedAt;

  return {
    id: snapshot.id,
    tripId: readString(data, "tripId") || tripId,
    title: readString(data, "title") || "Zonder titel",
    description: readOptionalString(data, "description"),
    status: isTaskStatus(status) ? status : "open",
    priority: isTaskPriority(priority) ? priority : "medium",
    category: isTaskCategory(category) ? category : "other",
    assignedToUserId: readOptionalString(data, "assignedToUserId"),
    assignedToDisplayName: readOptionalString(data, "assignedToDisplayName"),
    dueDate: readOptionalString(data, "dueDate"),
    completedAt: completedAt ? readDate(completedAt) : undefined,
    completedBy: readOptionalString(data, "completedBy"),
    createdBy: readString(data, "createdBy"),
    createdAt: readDate(data.createdAt),
    updatedAt: readDate(data.updatedAt),
  };
}

function mapCreateTaskInputToFirestoreData(
  tripId: string,
  input: CreateTripTaskInput,
  userId: string
): FirestoreTaskCreateData {
  const data: FirestoreTaskCreateData = {
    tripId,
    title: input.title.trim(),
    status: input.status,
    priority: input.priority,
    category: input.category,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const description = optionalText(input.description);
  const assignedToUserId = optionalText(input.assignedToUserId);
  const assignedToDisplayName = optionalText(input.assignedToDisplayName);
  const dueDate = optionalText(input.dueDate);

  if (description) {
    data.description = description;
  }

  if (assignedToUserId) {
    data.assignedToUserId = assignedToUserId;
  }

  if (assignedToDisplayName) {
    data.assignedToDisplayName = assignedToDisplayName;
  }

  if (dueDate) {
    data.dueDate = dueDate;
  }

  if (input.status === "done") {
    data.completedAt = serverTimestamp();
    data.completedBy = userId;
  }

  return data;
}

function mapUpdateTaskInputToFirestoreData(
  input: UpdateTripTaskInput
): FirestoreTaskUpdateData {
  const data: FirestoreTaskUpdateData = {
    updatedAt: serverTimestamp(),
  };

  if (input.title !== undefined) {
    data.title = input.title.trim();
  }

  if (Object.prototype.hasOwnProperty.call(input, "description")) {
    data.description = optionalText(input.description) ?? deleteField();
  }

  if (input.status !== undefined) {
    data.status = input.status;
  }

  if (input.priority !== undefined) {
    data.priority = input.priority;
  }

  if (input.category !== undefined) {
    data.category = input.category;
  }

  if (Object.prototype.hasOwnProperty.call(input, "assignedToUserId")) {
    data.assignedToUserId =
      optionalText(input.assignedToUserId) ?? deleteField();
  }

  if (Object.prototype.hasOwnProperty.call(input, "assignedToDisplayName")) {
    data.assignedToDisplayName =
      optionalText(input.assignedToDisplayName) ?? deleteField();
  }

  if (Object.prototype.hasOwnProperty.call(input, "dueDate")) {
    data.dueDate = optionalText(input.dueDate) ?? deleteField();
  }

  if (Object.prototype.hasOwnProperty.call(input, "completedAt")) {
    data.completedAt = input.completedAt
      ? Timestamp.fromDate(input.completedAt)
      : deleteField();
  }

  if (Object.prototype.hasOwnProperty.call(input, "completedBy")) {
    data.completedBy = optionalText(input.completedBy ?? undefined) ?? deleteField();
  }

  return data;
}

export async function listTasksForTrip(tripId: string): Promise<TripTask[]> {
  const snapshot = await getDocs(tasksCollectionRef(tripId));

  return snapshot.docs.map((taskSnapshot) =>
    mapTaskSnapshotToTripTask(taskSnapshot, tripId)
  );
}

export async function createTaskForTrip(
  tripId: string,
  input: CreateTripTaskInput,
  userId: string
): Promise<string> {
  const taskSnapshot = await addDoc(
    tasksCollectionRef(tripId),
    mapCreateTaskInputToFirestoreData(tripId, input, userId)
  );

  return taskSnapshot.id;
}

export async function updateTaskForTrip(
  tripId: string,
  taskId: string,
  input: UpdateTripTaskInput
): Promise<void> {
  await updateDoc(
    taskDocRef(tripId, taskId),
    mapUpdateTaskInputToFirestoreData(input)
  );
}

export async function deleteTaskForTrip(
  tripId: string,
  taskId: string
): Promise<void> {
  await deleteDoc(taskDocRef(tripId, taskId));
}

export async function toggleTaskDone(
  tripId: string,
  taskId: string,
  done: boolean,
  userId: string
): Promise<void> {
  await updateDoc(taskDocRef(tripId, taskId), {
    status: done ? "done" : "open",
    completedAt: done ? serverTimestamp() : deleteField(),
    completedBy: done ? userId : deleteField(),
    updatedAt: serverTimestamp(),
  });
}
