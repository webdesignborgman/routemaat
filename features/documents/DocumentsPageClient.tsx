"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Plus, Sparkles, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/useAuth";
import { DocumentCard } from "@/features/documents/DocumentCard";
import { DocumentFilters } from "@/features/documents/DocumentFilters";
import { DocumentForm } from "@/features/documents/DocumentForm";
import {
  deleteDocumentFile,
  uploadDocumentFile,
} from "@/features/documents/documentFileService";
import {
  createDocumentForTrip,
  deleteDocumentForTrip,
  listDocumentsForTrip,
  updateDocumentForTrip,
} from "@/features/documents/documentService";
import type {
  CreateTravelDocumentInput,
  TravelDocument,
  TravelDocumentFilters,
  TravelDocumentFormValues,
  UpdateTravelDocumentInput,
} from "@/features/documents/documentTypes";
import { canEditTripContent } from "@/features/members/memberPermissions";
import { getTripMember } from "@/features/members/memberService";
import type { TripMember } from "@/features/members/memberTypes";
import type { Trip } from "@/features/trips/tripTypes";

type DocumentsPageClientProps = {
  trip: Trip;
};

const defaultFilters: TravelDocumentFilters = {
  query: "",
  category: "all",
  type: "all",
  importantOnly: false,
};

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase("nl-NL");
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function documentInputFromForm(
  values: TravelDocumentFormValues
): CreateTravelDocumentInput {
  return {
    title: values.title.trim(),
    category: values.category,
    type: values.type,
    url: optionalText(values.url),
    description: optionalText(values.description),
    notes: optionalText(values.notes),
    relatedDate: optionalText(values.relatedDate),
    relatedTime: optionalText(values.relatedTime),
    important: values.important,
  };
}

function documentUpdateInputFromForm(
  values: TravelDocumentFormValues
): UpdateTravelDocumentInput {
  return documentInputFromForm(values);
}

function matchesFilters(
  document: TravelDocument,
  filters: TravelDocumentFilters
) {
  const query = normalizeSearchValue(filters.query);
  const searchableText = [
    document.title,
    document.description,
    document.notes,
    document.url,
    document.fileName,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLocaleLowerCase("nl-NL");

  const matchesQuery = query.length === 0 || searchableText.includes(query);
  const matchesCategory =
    filters.category === "all" || document.category === filters.category;
  const matchesType = filters.type === "all" || document.type === filters.type;
  const matchesImportant = !filters.importantOnly || document.important;

  return matchesQuery && matchesCategory && matchesType && matchesImportant;
}

function sortDocuments(documents: TravelDocument[]) {
  return [...documents].sort((firstDocument, secondDocument) => {
    if (firstDocument.important !== secondDocument.important) {
      return firstDocument.important ? -1 : 1;
    }

    if (firstDocument.relatedDate && secondDocument.relatedDate) {
      const dateCompare = firstDocument.relatedDate.localeCompare(
        secondDocument.relatedDate
      );

      if (dateCompare !== 0) {
        return dateCompare;
      }
    } else if (firstDocument.relatedDate || secondDocument.relatedDate) {
      return firstDocument.relatedDate ? -1 : 1;
    }

    return (
      secondDocument.updatedAt.getTime() - firstDocument.updatedAt.getTime() ||
      secondDocument.createdAt.getTime() - firstDocument.createdAt.getTime()
    );
  });
}

export function DocumentsPageClient({ trip }: DocumentsPageClientProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<TravelDocument[]>([]);
  const [filters, setFilters] =
    useState<TravelDocumentFilters>(defaultFilters);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingDocument, setEditingDocument] = useState<TravelDocument>();
  const [documentToDelete, setDocumentToDelete] =
    useState<TravelDocument | null>(null);
  const [currentMember, setCurrentMember] = useState<TripMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<
    string | null
  >(null);
  const canEditDocuments = canEditTripContent(currentMember?.role);

  useEffect(() => {
    let isCancelled = false;

    async function loadDocuments() {
      setIsLoading(true);
      setLoadErrorMessage(null);

      try {
        const [loadedDocuments, loadedMember] = await Promise.all([
          listDocumentsForTrip(trip.id),
          user ? getTripMember(trip.id, user.uid) : Promise.resolve(null),
        ]);

        if (!isCancelled) {
          setDocuments(loadedDocuments);
          setCurrentMember(loadedMember);
        }
      } catch (error) {
        console.error("Documenten laden mislukt", error);

        if (!isCancelled) {
          setLoadErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDocuments();

    return () => {
      isCancelled = true;
    };
  }, [trip.id, user]);

  async function refreshDocuments() {
    setDocuments(await listDocumentsForTrip(trip.id));
  }

  const sortedDocuments = useMemo(() => sortDocuments(documents), [documents]);
  const filteredDocuments = useMemo(
    () => sortedDocuments.filter((document) => matchesFilters(document, filters)),
    [filters, sortedDocuments]
  );
  const hasActiveFilters =
    filters.query.trim().length > 0 ||
    filters.category !== "all" ||
    filters.type !== "all" ||
    filters.importantOnly;

  function openCreateDialog() {
    if (!canEditDocuments) {
      setMutationErrorMessage("Je hebt alleen kijkrechten voor deze reis.");
      return;
    }

    setEditingDocument(undefined);
    setMutationErrorMessage(null);
    setDialogMode("create");
  }

  function openEditDialog(document: TravelDocument) {
    if (!canEditDocuments) {
      setMutationErrorMessage("Je hebt alleen kijkrechten voor deze reis.");
      return;
    }

    setEditingDocument(document);
    setMutationErrorMessage(null);
    setDialogMode("edit");
  }

  function closeDialog() {
    setDialogMode(null);
    setEditingDocument(undefined);
    setMutationErrorMessage(null);
    setUploadProgress(null);
  }

  async function handleSubmit(values: TravelDocumentFormValues) {
    if (!canEditDocuments) {
      setMutationErrorMessage("Je hebt alleen kijkrechten voor deze reis.");
      return;
    }

    if (!user) {
      setMutationErrorMessage("Log opnieuw in om dit document op te slaan.");
      return;
    }

    setIsSaving(true);
    setMutationErrorMessage(null);
    setUploadProgress(null);

    try {
      if (dialogMode === "edit" && editingDocument) {
        await updateDocumentForTrip(
          trip.id,
          editingDocument.id,
          documentUpdateInputFromForm(values)
        );
      } else if (values.type === "file") {
        await createFileDocument(values, user.uid);
      } else {
        await createDocumentForTrip(
          trip.id,
          documentInputFromForm(values),
          user.uid
        );
      }

      await refreshDocuments();
      closeDialog();
    } catch (error) {
      console.error("Document opslaan mislukt", error);
      setMutationErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
    }
  }

  async function createFileDocument(
    values: TravelDocumentFormValues,
    userId: string
  ) {
    if (!values.file) {
      throw new Error("Kies een bestand.");
    }

    let documentId: string | null = null;
    let uploadedFilePath: string | null = null;

    try {
      documentId = await createDocumentForTrip(
        trip.id,
        documentInputFromForm(values),
        userId
      );

      const fileMetadata = await uploadDocumentFile(
        trip.id,
        documentId,
        values.file,
        {
          onProgress: (progress) => setUploadProgress(progress.percentage),
        }
      );
      uploadedFilePath = fileMetadata.filePath;

      await updateDocumentForTrip(trip.id, documentId, fileMetadata);
    } catch (error) {
      if (uploadedFilePath) {
        await deleteDocumentFile(uploadedFilePath).catch((cleanupError) =>
          console.error("Bestand opruimen mislukt", cleanupError)
        );
      }

      if (documentId) {
        await deleteDocumentForTrip(trip.id, documentId).catch((cleanupError) =>
          console.error("Leeg document opruimen mislukt", cleanupError)
        );
      }

      throw error;
    }
  }

  function handleDelete(document: TravelDocument) {
    if (!canEditDocuments) {
      setMutationErrorMessage("Je hebt alleen kijkrechten voor deze reis.");
      return;
    }

    setMutationErrorMessage(null);
    setDocumentToDelete(document);
  }

  async function confirmDelete() {
    if (!documentToDelete || !canEditDocuments) {
      return;
    }

    setIsSaving(true);
    setMutationErrorMessage(null);

    try {
      if (documentToDelete.type === "file" && documentToDelete.filePath) {
        await deleteDocumentFile(documentToDelete.filePath);
      }

      await deleteDocumentForTrip(trip.id, documentToDelete.id);
      await refreshDocuments();
      setDocumentToDelete(null);
    } catch (error) {
      console.error("Document verwijderen mislukt", error);
      setMutationErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  function retryLoading() {
    setIsLoading(true);
    setLoadErrorMessage(null);
    void refreshDocuments()
      .catch((error) => setLoadErrorMessage(getErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documenten"
        description={`Bewaar links, boekingen en belangrijke reisinfo voor ${trip.title}.`}
        backHref={`/trips/${trip.id}`}
        action={
          canEditDocuments ? (
            <Button
              type="button"
              onClick={openCreateDialog}
              disabled={isSaving}
              className="w-full bg-slate-950 text-white shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:bg-slate-800 sm:w-auto"
            >
              <Plus className="size-4" aria-hidden="true" />
              Document toevoegen
            </Button>
          ) : undefined
        }
      />

      {loadErrorMessage ? (
        <StatusState
          title="Documenten laden lukt niet"
          description={loadErrorMessage}
          actionLabel="Opnieuw proberen"
          onAction={retryLoading}
        />
      ) : isLoading ? (
        <StatusState
          title="Documenten laden"
          description="We halen de documenten, links en notities op uit Firestore."
        />
      ) : (
        <>
          <section className="rounded-xl border border-lime-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(132,204,22,0.08)]">
            <div className="flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lime-50 text-lime-700">
                <FileText className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-950">
                  Alles wat je snel terug wilt vinden
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Bewaar boekingslinks, reserveringsnummers en praktische
                  notities of bestanden die je onderweg snel nodig hebt.
                </p>
              </div>
            </div>
          </section>

          <DocumentFilters filters={filters} onChange={setFilters} />

          {documents.length > 0 ? (
            <div className="rounded-xl border border-cyan-100 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-[0_10px_24px_rgba(14,165,233,0.06)]">
              {filteredDocuments.length} van {documents.length} documenten
              zichtbaar
            </div>
          ) : null}

          {documents.length === 0 ? (
            <StatusState
              title="Geen documenten gevonden"
              description={
                canEditDocuments
                  ? "Voeg de eerste link, notitie of boeking toe voor deze reis."
                  : "Er staan nog geen documenten of links voor deze reis."
              }
              actionLabel={canEditDocuments ? "Document toevoegen" : undefined}
              onAction={canEditDocuments ? openCreateDialog : undefined}
            />
          ) : filteredDocuments.length === 0 ? (
            <StatusState
              title="Geen resultaten"
              description="Pas je zoekterm of filters aan om weer documenten te zien."
              actionLabel={hasActiveFilters ? "Filters wissen" : undefined}
              onAction={
                hasActiveFilters ? () => setFilters(defaultFilters) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredDocuments.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  onEdit={canEditDocuments ? openEditDialog : undefined}
                  onDelete={canEditDocuments ? handleDelete : undefined}
                />
              ))}
            </div>
          )}
        </>
      )}

      <Dialog
        open={dialogMode !== null}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-cyan-100 bg-white shadow-[0_22px_70px_rgba(14,165,233,0.18)] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "edit"
                ? "Document bewerken"
                : "Document toevoegen"}
            </DialogTitle>
            <DialogDescription>
              Bewaar een link, notitie, boekingsinformatie of bestand.
            </DialogDescription>
          </DialogHeader>
          {mutationErrorMessage ? (
            <InlineErrorMessage message={mutationErrorMessage} />
          ) : null}
          {uploadProgress !== null ? (
            <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-800">
              Bestand uploaden: {uploadProgress}%
            </div>
          ) : null}
          <DocumentForm
            key={editingDocument?.id ?? "new-document"}
            document={editingDocument}
            relatedDateRange={{
              startDate: trip.startDate,
              endDate: trip.endDate,
            }}
            isSubmitting={isSaving}
            onSubmit={handleSubmit}
            onCancel={closeDialog}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={documentToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDocumentToDelete(null);
            setMutationErrorMessage(null);
          }
        }}
      >
        <DialogContent className="border-cyan-100 bg-white shadow-[0_22px_70px_rgba(236,72,153,0.14)] sm:max-w-md">
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-pink-50 text-pink-700">
              <Trash2 className="size-5" aria-hidden="true" />
            </div>
            <DialogTitle>Document verwijderen?</DialogTitle>
            <DialogDescription>
              {documentToDelete
                ? `"${documentToDelete.title}" wordt uit deze reis verwijderd.`
                : "Dit document wordt uit deze reis verwijderd."}
            </DialogDescription>
          </DialogHeader>
          {mutationErrorMessage ? (
            <InlineErrorMessage message={mutationErrorMessage} />
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isSaving}
              onClick={() => {
                setDocumentToDelete(null);
                setMutationErrorMessage(null);
              }}
            >
              Annuleren
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              disabled={isSaving}
              onClick={confirmDelete}
            >
              {isSaving ? "Verwijderen..." : "Verwijderen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (isFirebasePermissionError(error)) {
    return "Je hebt geen rechten om documenten te bekijken of aan te passen.";
  }

  return error instanceof Error
    ? error.message
    : "Er ging iets mis. Probeer het opnieuw.";
}

function isFirebasePermissionError(error: unknown) {
  return isRecord(error) && error.code === "permission-denied";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

type InlineErrorMessageProps = {
  message: string;
};

function InlineErrorMessage({ message }: InlineErrorMessageProps) {
  return (
    <div className="rounded-xl border border-pink-100 bg-pink-50 px-4 py-3 text-sm leading-6 text-pink-800">
      {message}
    </div>
  );
}

type StatusStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

function StatusState({
  title,
  description,
  actionLabel,
  onAction,
}: StatusStateProps) {
  return (
    <section className="rounded-xl border border-dashed border-cyan-200 bg-white/80 px-5 py-10 text-center shadow-[0_12px_30px_rgba(14,165,233,0.08)]">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
        <Sparkles className="size-5" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        {description}
      </p>
      {actionLabel && onAction ? (
        <Button
          type="button"
          onClick={onAction}
          className="mt-5 bg-slate-950 text-white hover:bg-slate-800"
        >
          {actionLabel}
        </Button>
      ) : null}
    </section>
  );
}
