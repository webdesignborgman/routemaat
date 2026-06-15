import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

import { storage } from "@/lib/firebase";

export const maxDocumentFileSize = 10 * 1024 * 1024;

export const supportedDocumentFileTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

export type DocumentFileMetadata = {
  fileName: string;
  filePath: string;
  fileContentType: string;
  fileSize: number;
  downloadUrl: string;
};

export type DocumentFileValidationError =
  | "missing"
  | "too-large"
  | "unsupported-type";

export type DocumentFileUploadProgress = {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
};

type UploadDocumentFileOptions = {
  onProgress?: (progress: DocumentFileUploadProgress) => void;
};

function getRequiredStorage() {
  if (!storage) {
    throw new Error("Firebase Storage is nog niet geconfigureerd.");
  }

  return storage;
}

export function validateDocumentFile(
  file: File | null
): DocumentFileValidationError | null {
  if (!file) {
    return "missing";
  }

  if (file.size > maxDocumentFileSize) {
    return "too-large";
  }

  if (!isSupportedDocumentFileType(file.type)) {
    return "unsupported-type";
  }

  return null;
}

export function getDocumentFileValidationMessage(
  error: DocumentFileValidationError
) {
  if (error === "missing") {
    return "Kies een bestand.";
  }

  if (error === "too-large") {
    return "Het bestand is te groot.";
  }

  return "Dit bestandstype wordt niet ondersteund.";
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function uploadDocumentFile(
  tripId: string,
  documentId: string,
  file: File,
  options: UploadDocumentFileOptions = {}
): Promise<DocumentFileMetadata> {
  const validationError = validateDocumentFile(file);

  if (validationError) {
    throw new Error(getDocumentFileValidationMessage(validationError));
  }

  const filePath = `trips/${tripId}/documents/${documentId}/${createSafeFileName(
    file.name
  )}`;
  const storageRef = ref(getRequiredStorage(), filePath);
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
  });

  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (!options.onProgress) {
          return;
        }

        const percentage =
          snapshot.totalBytes > 0
            ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            : 0;

        options.onProgress({
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          percentage,
        });
      },
      reject,
      resolve
    );
  });

  return {
    fileName: file.name,
    filePath,
    fileContentType: file.type,
    fileSize: file.size,
    downloadUrl: await getDownloadURL(storageRef),
  };
}

export async function deleteDocumentFile(filePath: string): Promise<void> {
  try {
    await deleteObject(ref(getRequiredStorage(), filePath));
  } catch (error) {
    if (!isStorageObjectNotFoundError(error)) {
      throw error;
    }
  }
}

function isSupportedDocumentFileType(
  value: string
): value is (typeof supportedDocumentFileTypes)[number] {
  return supportedDocumentFileTypes.includes(
    value as (typeof supportedDocumentFileTypes)[number]
  );
}

function createSafeFileName(fileName: string) {
  const extension = getFileExtension(fileName);
  const baseName = fileName
    .replace(/\.[^/.]+$/, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const safeBaseName = baseName || "bestand";
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return extension
    ? `${safeBaseName}-${suffix}.${extension}`
    : `${safeBaseName}-${suffix}`;
}

function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop();

  if (!extension || extension === fileName) {
    return "";
  }

  return extension
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLocaleLowerCase("nl-NL")
    .slice(0, 12);
}

function isStorageObjectNotFoundError(error: unknown) {
  return isRecord(error) && error.code === "storage/object-not-found";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
