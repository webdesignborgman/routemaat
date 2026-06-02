"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Languages, Plus, Sparkles, Trash2 } from "lucide-react";

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
import {
  loadTripPhrases,
  saveTripPhrases,
} from "@/features/language/languageClientStorage";
import { PhraseCard } from "@/features/language/PhraseCard";
import { PhraseFilters } from "@/features/language/PhraseFilters";
import { PhraseForm } from "@/features/language/PhraseForm";
import {
  phraseCategories,
  phraseCategoryLabels,
} from "@/features/language/languageLabels";
import { canSpeakPhrase } from "@/features/language/speechUtils";
import type {
  PhraseCategory,
  PhraseFilters as PhraseFiltersType,
  PhraseFormValues,
  TravelPhrase,
} from "@/features/language/languageTypes";
import type { Trip } from "@/features/trips/tripTypes";

type LanguagePageClientProps = {
  trip: Trip;
};

const defaultFilters: PhraseFiltersType = {
  query: "",
  category: "all",
  favoriteOnly: false,
};

const demoUserId = "demo-user";

type PhraseGroup = {
  category: PhraseCategory;
  phrases: TravelPhrase[];
};

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase("nl-NL");
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function matchesFilters(phrase: TravelPhrase, filters: PhraseFiltersType) {
  const query = normalizeSearchValue(filters.query);
  const searchableText = [
    phrase.dutchText,
    phrase.translatedText,
    phrase.nativeText,
    phrase.pronunciation,
    phrase.notes,
    phraseCategoryLabels[phrase.category],
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLocaleLowerCase("nl-NL");

  const matchesQuery = query.length === 0 || searchableText.includes(query);
  const matchesCategory =
    filters.category === "all" || phrase.category === filters.category;
  const matchesFavorite = !filters.favoriteOnly || phrase.favorite;

  return matchesQuery && matchesCategory && matchesFavorite;
}

function createPhrase(
  values: PhraseFormValues,
  tripId: string,
  createdBy: string
): TravelPhrase {
  const now = new Date();

  return {
    id: crypto.randomUUID(),
    tripId,
    category: values.category,
    dutchText: values.dutchText.trim(),
    translatedText: values.translatedText.trim(),
    nativeText: optionalText(values.nativeText),
    pronunciation: optionalText(values.pronunciation),
    notes: optionalText(values.notes),
    favorite: values.favorite,
    createdBy,
    createdAt: now,
    updatedAt: now,
  };
}

function updatePhrase(
  phrase: TravelPhrase,
  values: PhraseFormValues
): TravelPhrase {
  return {
    ...phrase,
    category: values.category,
    dutchText: values.dutchText.trim(),
    translatedText: values.translatedText.trim(),
    nativeText: optionalText(values.nativeText),
    pronunciation: optionalText(values.pronunciation),
    notes: optionalText(values.notes),
    favorite: values.favorite,
    updatedAt: new Date(),
  };
}

function sortPhrases(phrases: TravelPhrase[]) {
  return [...phrases].sort((firstPhrase, secondPhrase) => {
    if (firstPhrase.favorite !== secondPhrase.favorite) {
      return firstPhrase.favorite ? -1 : 1;
    }

    return firstPhrase.dutchText.localeCompare(secondPhrase.dutchText, "nl-NL");
  });
}

function groupPhrasesByCategory(phrases: TravelPhrase[]): PhraseGroup[] {
  return phraseCategories
    .map((category) => ({
      category,
      phrases: phrases.filter((phrase) => phrase.category === category),
    }))
    .filter((group) => group.phrases.length > 0);
}

export function LanguagePageClient({ trip }: LanguagePageClientProps) {
  const { user } = useAuth();
  const [phrases, setPhrases] = useState<TravelPhrase[]>(() =>
    loadTripPhrases(trip.id)
  );
  const [filters, setFilters] = useState<PhraseFiltersType>(defaultFilters);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingPhrase, setEditingPhrase] = useState<TravelPhrase | undefined>();
  const [phraseToDelete, setPhraseToDelete] = useState<TravelPhrase | null>(
    null
  );
  const [speechSupported, setSpeechSupported] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<
    PhraseCategory[]
  >([]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPhrases(loadTripPhrases(trip.id));
      setSpeechSupported(canSpeakPhrase());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [trip.id]);

  const sortedPhrases = useMemo(() => sortPhrases(phrases), [phrases]);
  const filteredPhrases = useMemo(
    () => sortedPhrases.filter((phrase) => matchesFilters(phrase, filters)),
    [filters, sortedPhrases]
  );
  const phraseGroups = useMemo(
    () => groupPhrasesByCategory(filteredPhrases),
    [filteredPhrases]
  );
  const collapsedCategorySet = useMemo(
    () => new Set(collapsedCategories),
    [collapsedCategories]
  );

  const hasActiveFilters =
    filters.query.trim().length > 0 ||
    filters.category !== "all" ||
    filters.favoriteOnly;

  function openCreateDialog() {
    setEditingPhrase(undefined);
    setDialogMode("create");
  }

  function openEditDialog(phrase: TravelPhrase) {
    setEditingPhrase(phrase);
    setDialogMode("edit");
  }

  function closeDialog() {
    setDialogMode(null);
    setEditingPhrase(undefined);
  }

  function toggleCategory(category: PhraseCategory) {
    setCollapsedCategories((currentCategories) =>
      currentCategories.includes(category)
        ? currentCategories.filter((currentCategory) => currentCategory !== category)
        : [...currentCategories, category]
    );
  }

  function handleSubmit(values: PhraseFormValues) {
    if (dialogMode === "edit" && editingPhrase) {
      setPhrases((currentPhrases) => {
        const nextPhrases = currentPhrases.map((phrase) =>
          phrase.id === editingPhrase.id ? updatePhrase(phrase, values) : phrase
        );
        saveTripPhrases(trip.id, nextPhrases);
        return nextPhrases;
      });
    } else {
      setPhrases((currentPhrases) => {
        const nextPhrases = [
          createPhrase(values, trip.id, user?.uid ?? demoUserId),
          ...currentPhrases,
        ];
        saveTripPhrases(trip.id, nextPhrases);
        return nextPhrases;
      });
    }

    closeDialog();
  }

  function toggleFavorite(phrase: TravelPhrase) {
    setPhrases((currentPhrases) => {
      const nextPhrases = currentPhrases.map((currentPhrase) =>
        currentPhrase.id === phrase.id
          ? {
              ...currentPhrase,
              favorite: !currentPhrase.favorite,
              updatedAt: new Date(),
            }
          : currentPhrase
      );
      saveTripPhrases(trip.id, nextPhrases);
      return nextPhrases;
    });
  }

  function confirmDelete() {
    if (!phraseToDelete) {
      return;
    }

    setPhrases((currentPhrases) => {
      const nextPhrases = currentPhrases.filter(
        (phrase) => phrase.id !== phraseToDelete.id
      );
      saveTripPhrases(trip.id, nextPhrases);
      return nextPhrases;
    });
    setPhraseToDelete(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Taal"
        description={`Handige zinnen voor onderweg tijdens ${trip.title}.`}
        backHref={`/trips/${trip.id}`}
        action={
          <Button
            type="button"
            onClick={openCreateDialog}
            className="w-full bg-slate-950 text-white shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:bg-slate-800 sm:w-auto"
          >
            <Plus className="size-4" aria-hidden="true" />
            Zin toevoegen
          </Button>
        }
      />

      <section className="rounded-xl border border-lime-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(132,204,22,0.08)]">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lime-50 text-lime-700">
            <Languages className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-950">
              Kleine zinnen, veel rust
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Bewaar vertalingen, uitspraak en notities die je onderweg snel
              nodig hebt.
            </p>
          </div>
        </div>
      </section>

      <PhraseFilters filters={filters} onChange={setFilters} />

      {phrases.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-cyan-100 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-[0_10px_24px_rgba(14,165,233,0.06)] sm:flex-row sm:items-center sm:justify-between">
          <span>
            {filteredPhrases.length} van {phrases.length} zinnen zichtbaar
          </span>
          {phraseGroups.length > 1 ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCollapsedCategories([])}
              >
                Alles openen
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setCollapsedCategories(
                    phraseGroups.map((group) => group.category)
                  )
                }
              >
                Alles inklappen
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {phrases.length === 0 ? (
        <EmptyState
          title="Geen zinnen gevonden"
          description="Voeg de eerste handige zin toe voor deze reis."
          actionLabel="Zin toevoegen"
          onAction={openCreateDialog}
        />
      ) : filteredPhrases.length === 0 ? (
        <EmptyState
          title="Geen resultaten"
          description="Pas je zoekterm of filters aan om weer zinnen te zien."
          actionLabel={hasActiveFilters ? "Filters wissen" : undefined}
          onAction={hasActiveFilters ? () => setFilters(defaultFilters) : undefined}
        />
      ) : (
        <div className="space-y-4">
          {phraseGroups.map((group) => (
            <PhraseCategorySection
              key={group.category}
              group={group}
              isCollapsed={collapsedCategorySet.has(group.category)}
              speechSupported={speechSupported}
              onToggleCategory={toggleCategory}
              onEdit={openEditDialog}
              onDelete={setPhraseToDelete}
              onToggleFavorite={toggleFavorite}
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
              {dialogMode === "edit" ? "Zin bewerken" : "Zin toevoegen"}
            </DialogTitle>
            <DialogDescription>
              Voeg een vertaling, uitspraak of korte gebruiksnotitie toe.
            </DialogDescription>
          </DialogHeader>
          <PhraseForm
            key={editingPhrase?.id ?? "new-phrase"}
            phrase={editingPhrase}
            onSubmit={handleSubmit}
            onCancel={closeDialog}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={phraseToDelete !== null}
        onOpenChange={(open) => !open && setPhraseToDelete(null)}
      >
        <DialogContent className="border-cyan-100 bg-white shadow-[0_22px_70px_rgba(236,72,153,0.14)] sm:max-w-md">
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-pink-50 text-pink-700">
              <Trash2 className="size-5" aria-hidden="true" />
            </div>
            <DialogTitle>Zin verwijderen?</DialogTitle>
            <DialogDescription>
              {phraseToDelete
                ? `"${phraseToDelete.dutchText}" wordt uit deze taallijst verwijderd.`
                : "Deze zin wordt uit de taallijst verwijderd."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setPhraseToDelete(null)}
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

type PhraseCategorySectionProps = {
  group: PhraseGroup;
  isCollapsed: boolean;
  speechSupported: boolean;
  onToggleCategory: (category: PhraseCategory) => void;
  onEdit: (phrase: TravelPhrase) => void;
  onDelete: (phrase: TravelPhrase) => void;
  onToggleFavorite: (phrase: TravelPhrase) => void;
};

function PhraseCategorySection({
  group,
  isCollapsed,
  speechSupported,
  onToggleCategory,
  onEdit,
  onDelete,
  onToggleFavorite,
}: PhraseCategorySectionProps) {
  const contentId = `phrase-category-${group.category}`;

  return (
    <section className="overflow-hidden rounded-xl border border-cyan-100 bg-white/80 shadow-[0_12px_30px_rgba(14,165,233,0.08)]">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-cyan-50/60"
        aria-controls={contentId}
        aria-expanded={!isCollapsed}
        onClick={() => onToggleCategory(group.category)}
      >
        <span className="min-w-0">
          <span className="block text-base font-semibold text-slate-950">
            {phraseCategoryLabels[group.category]}
          </span>
          <span className="mt-1 block text-sm text-slate-600">
            {group.phrases.length}{" "}
            {group.phrases.length === 1 ? "zin" : "zinnen"}
          </span>
        </span>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
          <ChevronDown
            className={`size-4 transition-transform ${
              isCollapsed ? "-rotate-90" : "rotate-0"
            }`}
            aria-hidden="true"
          />
        </span>
      </button>
      {!isCollapsed ? (
        <div
          id={contentId}
          className="grid gap-4 border-t border-cyan-100 p-4 lg:grid-cols-2"
        >
          {group.phrases.map((phrase) => (
            <PhraseCard
              key={phrase.id}
              phrase={phrase}
              speechSupported={speechSupported}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
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
