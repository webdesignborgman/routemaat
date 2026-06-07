"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";

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
import { IdeaCard } from "@/features/ideas/IdeaCard";
import {
  createIdeaInputFromForm,
  updateIdeaInputFromForm,
} from "@/features/ideas/ideaFormMapping";
import { IdeaFilters } from "@/features/ideas/IdeaFilters";
import { IdeaForm } from "@/features/ideas/IdeaForm";
import {
  createIdeaForTrip,
  deleteIdeaForTrip,
  listIdeasForTrip,
  updateIdeaForTrip,
} from "@/features/ideas/ideaService";
import type {
  IdeaFilters as IdeaFiltersType,
  IdeaFormValues,
  TripIdea,
} from "@/features/ideas/ideaTypes";
import type { Trip } from "@/features/trips/tripTypes";

type IdeasPageClientProps = {
  trip: Trip;
};

const defaultFilters: IdeaFiltersType = {
  query: "",
  category: "all",
  status: "all",
  priority: "all",
  tag: "all",
};

const firestoreActionTimeoutMs = 15_000;

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase("nl-NL");
}

function matchesFilters(idea: TripIdea, filters: IdeaFiltersType) {
  const query = normalizeSearchValue(filters.query);
  const searchableText = [
    idea.title,
    idea.description,
    idea.city,
    idea.locationName,
    ...idea.tags,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLocaleLowerCase("nl-NL");

  const matchesQuery = query.length === 0 || searchableText.includes(query);
  const matchesCategory =
    filters.category === "all" || idea.category === filters.category;
  const matchesStatus = filters.status === "all" || idea.status === filters.status;
  const matchesPriority =
    filters.priority === "all" || idea.priority === filters.priority;
  const matchesTag =
    filters.tag === "all" ||
    idea.tags.some(
      (tag) =>
        tag.toLocaleLowerCase("nl-NL") ===
        filters.tag.toLocaleLowerCase("nl-NL")
    );

  return (
    matchesQuery &&
    matchesCategory &&
    matchesStatus &&
    matchesPriority &&
    matchesTag
  );
}

export function IdeasPageClient({ trip }: IdeasPageClientProps) {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<TripIdea[]>([]);
  const [filters, setFilters] = useState<IdeaFiltersType>(defaultFilters);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingIdea, setEditingIdea] = useState<TripIdea | undefined>();
  const [ideaToDelete, setIdeaToDelete] = useState<TripIdea | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    let isCancelled = false;

    async function loadIdeas() {
      setIsLoading(true);
      setLoadErrorMessage(null);

      try {
        const loadedIdeas = await listIdeasForTrip(trip.id);

        if (!isCancelled) {
          setIdeas(loadedIdeas);
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadIdeas();

    return () => {
      isCancelled = true;
    };
  }, [trip.id]);

  async function refreshIdeas() {
    const loadedIdeas = await listIdeasForTrip(trip.id);
    setIdeas(loadedIdeas);
  }

  const availableTags = useMemo(() => {
    const tags = ideas.flatMap((idea) => idea.tags);
    return Array.from(new Set(tags)).sort((a, b) => a.localeCompare(b, "nl-NL"));
  }, [ideas]);

  const filteredIdeas = useMemo(
    () => ideas.filter((idea) => matchesFilters(idea, filters)),
    [filters, ideas]
  );

  const hasActiveFilters =
    filters.query.trim().length > 0 ||
    filters.category !== "all" ||
    filters.status !== "all" ||
    filters.priority !== "all" ||
    filters.tag !== "all";

  function openCreateDialog() {
    setEditingIdea(undefined);
    setMutationErrorMessage(null);
    setDialogMode("create");
  }

  function openEditDialog(idea: TripIdea) {
    setEditingIdea(idea);
    setMutationErrorMessage(null);
    setDialogMode("edit");
  }

  function closeDialog() {
    setDialogMode(null);
    setEditingIdea(undefined);
    setMutationErrorMessage(null);
  }

  async function handleSubmit(values: IdeaFormValues) {
    if (!user) {
      setMutationErrorMessage("Log opnieuw in om dit idee op te slaan.");
      return;
    }

    setIsSaving(true);
    setMutationErrorMessage(null);

    try {
      if (dialogMode === "edit" && editingIdea) {
        await withFirestoreTimeout(
          updateIdeaForTrip(
            trip.id,
            editingIdea.id,
            updateIdeaInputFromForm(values)
          )
        );
      } else {
        await withFirestoreTimeout(
          createIdeaForTrip(trip.id, createIdeaInputFromForm(values), user.uid)
        );
      }

      await refreshIdeas();
      closeDialog();
    } catch (error) {
      console.error("Idee opslaan mislukt", error);
      setMutationErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  function handleDelete(idea: TripIdea) {
    setMutationErrorMessage(null);
    setIdeaToDelete(idea);
  }

  async function confirmDelete() {
    if (!ideaToDelete) {
      return;
    }

    setIsSaving(true);
    setMutationErrorMessage(null);

    try {
      await withFirestoreTimeout(deleteIdeaForTrip(trip.id, ideaToDelete.id));
      await refreshIdeas();
      setIdeaToDelete(null);
    } catch (error) {
      console.error("Idee verwijderen mislukt", error);
      setMutationErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  function retryLoading() {
    setIsLoading(true);
    setLoadErrorMessage(null);
    void refreshIdeas()
      .catch((error) => setLoadErrorMessage(getErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ideeën / Activiteiten"
        description={`Verzamel plekken, restaurants, activiteiten en praktische tips voor ${trip.title}.`}
        backHref={`/trips/${trip.id}`}
        action={
          <Button
            type="button"
            onClick={openCreateDialog}
            disabled={isSaving}
            className="w-full bg-slate-950 text-white shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:bg-slate-800 sm:w-auto"
          >
            <Plus className="size-4" aria-hidden="true" />
            Idee / activiteit toevoegen
          </Button>
        }
      />

      {loadErrorMessage ? (
        <EmptyState
          title="Ideeën laden lukt niet"
          description={loadErrorMessage}
          actionLabel="Opnieuw proberen"
          onAction={retryLoading}
        />
      ) : isLoading ? (
        <EmptyState
          title="Ideeën laden"
          description="We halen de ideeën en activiteiten voor deze reis op uit Firestore."
        />
      ) : (
        <>
          <IdeaFilters
            filters={filters}
            availableTags={availableTags}
            onChange={setFilters}
          />

          {ideas.length > 0 ? (
            <div className="rounded-xl border border-cyan-100 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-[0_10px_24px_rgba(14,165,233,0.06)]">
              {filteredIdeas.length} van {ideas.length} items zichtbaar in Ideeën / Activiteiten
            </div>
          ) : null}

          {ideas.length === 0 ? (
            <EmptyState
              title="Geen items gevonden"
              description="Voeg het eerste idee of de eerste activiteit toe voor deze reis."
              actionLabel="Idee / activiteit toevoegen"
              onAction={openCreateDialog}
            />
          ) : filteredIdeas.length === 0 ? (
            <EmptyState
              title="Geen resultaten"
              description="Pas je zoekterm of filters aan om weer items in Ideeën / Activiteiten te zien."
              actionLabel={hasActiveFilters ? "Filters wissen" : undefined}
              onAction={
                hasActiveFilters ? () => setFilters(defaultFilters) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredIdeas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onEdit={openEditDialog}
                  onDelete={handleDelete}
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
                ? "Idee / activiteit bewerken"
                : "Idee / activiteit toevoegen"}
            </DialogTitle>
            <DialogDescription>
              Vul alleen in wat nu al bekend is. Details kunnen later worden aangepast.
            </DialogDescription>
          </DialogHeader>
          {mutationErrorMessage ? (
            <InlineErrorMessage message={mutationErrorMessage} />
          ) : null}
          <IdeaForm
            key={editingIdea?.id ?? "new-idea"}
            idea={editingIdea}
            isSubmitting={isSaving}
            scheduleDateRange={{
              startDate: trip.startDate,
              endDate: trip.endDate,
            }}
            onSubmit={handleSubmit}
            onCancel={closeDialog}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={ideaToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIdeaToDelete(null);
            setMutationErrorMessage(null);
          }
        }}
      >
        <DialogContent className="border-cyan-100 bg-white shadow-[0_22px_70px_rgba(236,72,153,0.14)] sm:max-w-md">
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-pink-50 text-pink-700">
              <Trash2 className="size-5" aria-hidden="true" />
            </div>
            <DialogTitle>Idee verwijderen?</DialogTitle>
            <DialogDescription>
              {ideaToDelete
                ? `"${ideaToDelete.title}" wordt uit deze lijst verwijderd.`
                : "Dit idee wordt uit deze lijst verwijderd."}
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
              onClick={() => {
                setIdeaToDelete(null);
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
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (isFirestoreTimeoutError(error)) {
    return "Firestore reageert niet binnen 15 seconden. Controleer je internetverbinding, Firebase-configuratie of security rules.";
  }

  if (isFirebasePermissionError(error)) {
    return "Je hebt nog geen rechten om ideeën in Firestore op te slaan. Controleer de security rules voor trips/{tripId}/ideas.";
  }

  return error instanceof Error
    ? error.message
    : "Er ging iets mis. Probeer het opnieuw.";
}

async function withFirestoreTimeout<T>(operation: Promise<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("firestore-timeout"));
    }, firestoreActionTimeoutMs);
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function isFirestoreTimeoutError(error: unknown) {
  return error instanceof Error && error.message === "firestore-timeout";
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

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
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
