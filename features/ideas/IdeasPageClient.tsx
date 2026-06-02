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
import { IdeaCard } from "@/features/ideas/IdeaCard";
import { loadTripIdeas, saveTripIdeas } from "@/features/ideas/ideaClientStorage";
import { IdeaFilters } from "@/features/ideas/IdeaFilters";
import { IdeaForm } from "@/features/ideas/IdeaForm";
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

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase("nl-NL");
}

function parseTags(tagsText: string) {
  const tags = tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  return Array.from(new Map(tags.map((tag) => [tag.toLocaleLowerCase("nl-NL"), tag])).values());
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
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

function createIdea(values: IdeaFormValues, tripId: string): TripIdea {
  const now = new Date();

  return {
    id: crypto.randomUUID(),
    tripId,
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    tags: parseTags(values.tagsText),
    city: optionalText(values.city),
    locationName: optionalText(values.locationName),
    googleMapsUrl: optionalText(values.googleMapsUrl),
    websiteUrl: optionalText(values.websiteUrl),
    notes: optionalText(values.notes),
    customsNotes: optionalText(values.customsNotes),
    showInSchedule: values.showInSchedule,
    scheduleDate: values.showInSchedule
      ? optionalText(values.scheduleDate)
      : undefined,
    startTime: values.showInSchedule ? optionalText(values.startTime) : undefined,
    endTime: values.showInSchedule ? optionalText(values.endTime) : undefined,
    status: values.status,
    priority: values.priority,
    addedBy: "mock-user",
    createdAt: now,
    updatedAt: now,
  };
}

function updateIdea(idea: TripIdea, values: IdeaFormValues): TripIdea {
  return {
    ...idea,
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    tags: parseTags(values.tagsText),
    city: optionalText(values.city),
    locationName: optionalText(values.locationName),
    googleMapsUrl: optionalText(values.googleMapsUrl),
    websiteUrl: optionalText(values.websiteUrl),
    notes: optionalText(values.notes),
    customsNotes: optionalText(values.customsNotes),
    showInSchedule: values.showInSchedule,
    scheduleDate: values.showInSchedule
      ? optionalText(values.scheduleDate)
      : undefined,
    startTime: values.showInSchedule ? optionalText(values.startTime) : undefined,
    endTime: values.showInSchedule ? optionalText(values.endTime) : undefined,
    status: values.status,
    priority: values.priority,
    updatedAt: new Date(),
  };
}

export function IdeasPageClient({ trip }: IdeasPageClientProps) {
  const [ideas, setIdeas] = useState<TripIdea[]>(() => loadTripIdeas(trip.id));
  const [filters, setFilters] = useState<IdeaFiltersType>(defaultFilters);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingIdea, setEditingIdea] = useState<TripIdea | undefined>();
  const [ideaToDelete, setIdeaToDelete] = useState<TripIdea | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIdeas(loadTripIdeas(trip.id));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [trip.id]);

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
    setDialogMode("create");
  }

  function openEditDialog(idea: TripIdea) {
    setEditingIdea(idea);
    setDialogMode("edit");
  }

  function closeDialog() {
    setDialogMode(null);
    setEditingIdea(undefined);
  }

  function handleSubmit(values: IdeaFormValues) {
    if (dialogMode === "edit" && editingIdea) {
      setIdeas((currentIdeas) => {
        const nextIdeas = currentIdeas.map((idea) =>
          idea.id === editingIdea.id ? updateIdea(idea, values) : idea
        );
        saveTripIdeas(trip.id, nextIdeas);
        return nextIdeas;
      });
    } else {
      setIdeas((currentIdeas) => {
        const nextIdeas = [createIdea(values, trip.id), ...currentIdeas];
        saveTripIdeas(trip.id, nextIdeas);
        return nextIdeas;
      });
    }
    closeDialog();
  }

  function handleDelete(idea: TripIdea) {
    setIdeaToDelete(idea);
  }

  function confirmDelete() {
    if (!ideaToDelete) {
      return;
    }

    setIdeas((currentIdeas) => {
      const nextIdeas = currentIdeas.filter((idea) => idea.id !== ideaToDelete.id);
      saveTripIdeas(trip.id, nextIdeas);
      return nextIdeas;
    });
    setIdeaToDelete(null);
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
            className="w-full bg-slate-950 text-white shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:bg-slate-800 sm:w-auto"
          >
            <Plus className="size-4" aria-hidden="true" />
            Idee / activiteit toevoegen
          </Button>
        }
      />

      <IdeaFilters
        filters={filters}
        availableTags={availableTags}
        onChange={setFilters}
      />

      {ideas.length > 0 ? (
        <div className="rounded-xl border border-cyan-100 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-[0_10px_24px_rgba(14,165,233,0.06)]">
          {filteredIdeas.length} van {ideas.length} ideeën / activiteiten zichtbaar
        </div>
      ) : null}

      {ideas.length === 0 ? (
        <EmptyState
          title="Geen ideeën / activiteiten gevonden"
          description="Voeg het eerste idee of de eerste activiteit toe voor deze reis."
          actionLabel="Idee / activiteit toevoegen"
          onAction={openCreateDialog}
        />
      ) : filteredIdeas.length === 0 ? (
        <EmptyState
          title="Geen resultaten"
          description="Pas je zoekterm of filters aan om weer ideeën en activiteiten te zien."
          actionLabel={hasActiveFilters ? "Filters wissen" : undefined}
          onAction={hasActiveFilters ? () => setFilters(defaultFilters) : undefined}
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
          <IdeaForm
            key={editingIdea?.id ?? "new-idea"}
            idea={editingIdea}
            onSubmit={handleSubmit}
            onCancel={closeDialog}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={ideaToDelete !== null}
        onOpenChange={(open) => !open && setIdeaToDelete(null)}
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
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setIdeaToDelete(null)}
            >
              Annuleren
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
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
