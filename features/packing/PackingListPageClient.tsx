"use client";

import { useEffect, useMemo, useState } from "react";
import { PackageCheck, Plus, Search, Sparkles, Trash2, X } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/features/auth/useAuth";
import {
  packingCategories,
  packingCategoryLabels,
} from "@/features/packing/packingCategories";
import { PackingCategorySection } from "@/features/packing/PackingCategorySection";
import { PackingItemDialog } from "@/features/packing/PackingItemDialog";
import { PackingProgress } from "@/features/packing/PackingProgress";
import {
  createDefaultPackingItemsForUser,
  createPackingItemForUser,
  deletePackingItemForUser,
  listPackingChecksForTrip,
  listPackingItemsForUser,
  resetPackingChecksForTrip,
  setPackingCheckForTrip,
  updatePackingItemForUser,
} from "@/features/packing/packingService";
import type {
  CreatePackingItemInput,
  PackingCategory,
  PackingItem,
  PackingItemFormValues,
  PackingStatusFilter,
  UpdatePackingItemInput,
} from "@/features/packing/packingTypes";
import type { Trip } from "@/features/trips/tripTypes";

type PackingListPageClientProps = {
  trip?: Trip;
};

type CategoryFilter = PackingCategory | "all";

const statusFilterLabels: Record<PackingStatusFilter, string> = {
  all: "Alles",
  open: "Nog inpakken",
  checked: "Ingepakt",
};

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase("nl-NL");
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function inputFromForm(values: PackingItemFormValues): CreatePackingItemInput {
  return {
    name: values.name.trim(),
    category: values.category,
    quantity: Number(values.quantity),
    note: optionalText(values.note),
    isDefault: values.isDefault,
  };
}

function updateInputFromForm(values: PackingItemFormValues): UpdatePackingItemInput {
  return inputFromForm(values);
}

function sortPackingItems(items: PackingItem[]) {
  return [...items].sort((firstItem, secondItem) => {
    const categoryCompare =
      packingCategories.indexOf(firstItem.category) -
      packingCategories.indexOf(secondItem.category);

    if (categoryCompare !== 0) {
      return categoryCompare;
    }

    return (
      firstItem.sortOrder - secondItem.sortOrder ||
      firstItem.name.localeCompare(secondItem.name, "nl-NL")
    );
  });
}

function matchesFilters(
  item: PackingItem,
  checkedItemIds: Set<string>,
  query: string,
  categoryFilter: CategoryFilter,
  statusFilter: PackingStatusFilter,
  tripMode: boolean
) {
  const normalizedQuery = normalizeSearchValue(query);
  const searchableText = [
    item.name,
    item.note,
    packingCategoryLabels[item.category],
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLocaleLowerCase("nl-NL");
  const checked = checkedItemIds.has(item.id);

  const matchesQuery =
    normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);
  const matchesCategory =
    categoryFilter === "all" || item.category === categoryFilter;
  const matchesStatus =
    !tripMode ||
    statusFilter === "all" ||
    (statusFilter === "checked" && checked) ||
    (statusFilter === "open" && !checked);

  return matchesQuery && matchesCategory && matchesStatus;
}

export function PackingListPageClient({ trip }: PackingListPageClientProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<PackingItem[]>([]);
  const [checkedItemIds, setCheckedItemIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<PackingStatusFilter>("all");
  const [editingItem, setEditingItem] = useState<PackingItem>();
  const [itemToDelete, setItemToDelete] = useState<PackingItem | null>(null);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<
    string | null
  >(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const tripMode = Boolean(trip);

  useEffect(() => {
    let isCancelled = false;

    async function loadPackingList() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadErrorMessage(null);

      try {
        const [loadedItems, loadedChecks] = await Promise.all([
          listPackingItemsForUser(user.uid),
          trip ? listPackingChecksForTrip(trip.id, user.uid) : Promise.resolve([]),
        ]);

        if (!isCancelled) {
          setItems(loadedItems);
          setCheckedItemIds(
            new Set(
              loadedChecks
                .filter((check) => check.checked)
                .map((check) => check.itemId)
            )
          );
        }
      } catch (error) {
        console.error("Inpaklijst laden mislukt", error);

        if (!isCancelled) {
          setLoadErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPackingList();

    return () => {
      isCancelled = true;
    };
  }, [trip, user]);

  async function refreshItems() {
    if (!user) {
      return;
    }

    setItems(await listPackingItemsForUser(user.uid));
  }

  async function refreshChecks() {
    if (!user || !trip) {
      return;
    }

    const checks = await listPackingChecksForTrip(trip.id, user.uid);

    setCheckedItemIds(
      new Set(checks.filter((check) => check.checked).map((check) => check.itemId))
    );
  }

  const activeItems = useMemo(
    () => sortPackingItems(items.filter((item) => !item.isArchived)),
    [items]
  );
  const filteredItems = useMemo(
    () =>
      activeItems.filter((item) =>
        matchesFilters(
          item,
          checkedItemIds,
          query,
          categoryFilter,
          statusFilter,
          tripMode
        )
      ),
    [activeItems, categoryFilter, checkedItemIds, query, statusFilter, tripMode]
  );
  const groupedItems = useMemo(
    () =>
      packingCategories
        .map((category) => ({
          category,
          items: filteredItems.filter((item) => item.category === category),
        }))
        .filter((group) => group.items.length > 0),
    [filteredItems]
  );
  const checkedCount = activeItems.filter((item) =>
    checkedItemIds.has(item.id)
  ).length;
  const hasActiveFilters =
    query.trim().length > 0 ||
    categoryFilter !== "all" ||
    (tripMode && statusFilter !== "all");

  function openCreateDialog() {
    setEditingItem(undefined);
    setMutationErrorMessage(null);
    setStatusMessage(null);
    setIsItemDialogOpen(true);
  }

  function openEditDialog(item: PackingItem) {
    setEditingItem(item);
    setMutationErrorMessage(null);
    setStatusMessage(null);
    setIsItemDialogOpen(true);
  }

  function closeItemDialog() {
    setIsItemDialogOpen(false);
    setEditingItem(undefined);
    setMutationErrorMessage(null);
  }

  function clearFilters() {
    setQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
  }

  async function handleSubmit(values: PackingItemFormValues) {
    if (!user) {
      setMutationErrorMessage("Log opnieuw in om dit item op te slaan.");
      return;
    }

    setIsSaving(true);
    setMutationErrorMessage(null);
    setStatusMessage(null);

    try {
      if (editingItem) {
        await updatePackingItemForUser(
          user.uid,
          editingItem.id,
          updateInputFromForm(values)
        );
      } else {
        await createPackingItemForUser(user.uid, inputFromForm(values));
      }

      await refreshItems();
      closeItemDialog();
      setStatusMessage(
        editingItem ? "Item opgeslagen." : "Item toegevoegd aan je inpaklijst."
      );
    } catch (error) {
      console.error("Inpakitem opslaan mislukt", error);
      setMutationErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateDefaults() {
    if (!user) {
      setMutationErrorMessage("Log opnieuw in om de basislijst aan te maken.");
      return;
    }

    setIsSaving(true);
    setMutationErrorMessage(null);
    setStatusMessage(null);

    try {
      const createdCount = await createDefaultPackingItemsForUser(user.uid);
      await refreshItems();
      setStatusMessage(
        createdCount > 0
          ? "Basislijst aangemaakt."
          : "Je inpaklijst bevat al items."
      );
    } catch (error) {
      console.error("Basislijst aanmaken mislukt", error);
      setMutationErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleChecked(item: PackingItem, checked: boolean) {
    if (!user || !trip) {
      return;
    }

    setCheckedItemIds((currentCheckedItemIds) => {
      const nextCheckedItemIds = new Set(currentCheckedItemIds);

      if (checked) {
        nextCheckedItemIds.add(item.id);
      } else {
        nextCheckedItemIds.delete(item.id);
      }

      return nextCheckedItemIds;
    });

    try {
      await setPackingCheckForTrip(trip.id, user.uid, item.id, checked);
    } catch (error) {
      console.error("Inpakcheck opslaan mislukt", error);
      setMutationErrorMessage(getErrorMessage(error));
      await refreshChecks();
    }
  }

  async function confirmDelete() {
    if (!user || !itemToDelete) {
      return;
    }

    setIsSaving(true);
    setMutationErrorMessage(null);
    setStatusMessage(null);

    try {
      await deletePackingItemForUser(user.uid, itemToDelete.id);
      await refreshItems();
      setItemToDelete(null);
      setStatusMessage("Item verwijderd.");
    } catch (error) {
      console.error("Inpakitem verwijderen mislukt", error);
      setMutationErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmResetChecks() {
    if (!user || !trip) {
      return;
    }

    setIsSaving(true);
    setMutationErrorMessage(null);
    setStatusMessage(null);

    try {
      await resetPackingChecksForTrip(trip.id, user.uid);
      setCheckedItemIds(new Set());
      setIsResetDialogOpen(false);
      setStatusMessage("Checks voor deze reis zijn gereset.");
    } catch (error) {
      console.error("Inpakchecks resetten mislukt", error);
      setMutationErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  function retryLoading() {
    if (!user) {
      return;
    }

    setIsLoading(true);
    setLoadErrorMessage(null);
    Promise.all([
      listPackingItemsForUser(user.uid),
      trip ? listPackingChecksForTrip(trip.id, user.uid) : Promise.resolve([]),
    ])
      .then(([loadedItems, loadedChecks]) => {
        setItems(loadedItems);
        setCheckedItemIds(
          new Set(
            loadedChecks
              .filter((check) => check.checked)
              .map((check) => check.itemId)
          )
        );
      })
      .catch((error) => setLoadErrorMessage(getErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inpaklijst"
        description={
          trip
            ? `Vink je persoonlijke standaardlijst af voor ${trip.title}.`
            : "Beheer je persoonlijke standaardlijst voor elke reis."
        }
        backHref={trip ? `/trips/${trip.id}` : undefined}
        action={
          <Button
            type="button"
            onClick={openCreateDialog}
            disabled={isSaving}
            className="w-full bg-slate-950 text-white shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:bg-slate-800 sm:w-auto"
          >
            <Plus className="size-4" aria-hidden="true" />
            Item toevoegen
          </Button>
        }
      />

      {mutationErrorMessage ? (
        <InlineErrorMessage message={mutationErrorMessage} />
      ) : null}
      {statusMessage ? <InlineSuccessMessage message={statusMessage} /> : null}

      {trip ? (
        <PackingProgress
          checkedCount={checkedCount}
          totalCount={activeItems.length}
        />
      ) : null}

      {loadErrorMessage ? (
        <StatusState
          title="Inpaklijst laden lukt niet"
          description={loadErrorMessage}
          actionLabel="Opnieuw proberen"
          onAction={retryLoading}
        />
      ) : isLoading ? (
        <StatusState
          title="Inpaklijst laden"
          description="We halen je persoonlijke inpaklijst op uit Firestore."
        />
      ) : (
        <>
          <section className="rounded-xl border border-cyan-100 bg-white/95 p-3 shadow-[0_12px_30px_rgba(14,165,233,0.08)] sm:p-4">
            <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="packing-search">Zoeken</Label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <Input
                    id="packing-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="pl-9"
                    placeholder="Naam, categorie of notitie"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="packing-category-filter">Categorie</Label>
                <Select
                  value={categoryFilter}
                  onValueChange={(value) =>
                    setCategoryFilter(value as CategoryFilter)
                  }
                >
                  <SelectTrigger
                    id="packing-category-filter"
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle categorieen</SelectItem>
                    {packingCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {packingCategoryLabels[category]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="justify-start text-slate-600 hover:text-pink-700"
                  onClick={clearFilters}
                >
                  <X className="size-4" aria-hidden="true" />
                  Filters wissen
                </Button>
              ) : null}
            </div>
            {tripMode ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(statusFilterLabels).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    variant={statusFilter === value ? "default" : "outline"}
                    className={
                      statusFilter === value
                        ? "bg-slate-950 text-white hover:bg-slate-800"
                        : "bg-white"
                    }
                    onClick={() => setStatusFilter(value as PackingStatusFilter)}
                  >
                    {label}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="border-pink-100 bg-white text-pink-700 hover:bg-pink-50"
                  disabled={checkedItemIds.size === 0 || isSaving}
                  onClick={() => setIsResetDialogOpen(true)}
                >
                  Alle checks resetten
                </Button>
              </div>
            ) : null}
          </section>

          {activeItems.length === 0 ? (
            <StatusState
              title="Je inpaklijst is nog leeg"
              description={
                trip
                  ? "Maak eerst je persoonlijke inpaklijst aan. Daarna kun je hem per reis afvinken."
                  : "Voeg je eerste item toe of start met een kleine basislijst."
              }
              actionLabel="Eerste item toevoegen"
              onAction={openCreateDialog}
              secondaryActionLabel="Start met basislijst"
              onSecondaryAction={handleCreateDefaults}
              isActionDisabled={isSaving}
            />
          ) : filteredItems.length === 0 ? (
            <StatusState
              title="Geen resultaten"
              description="Pas je zoekterm of filters aan om weer items te zien."
              actionLabel={hasActiveFilters ? "Filters wissen" : undefined}
              onAction={hasActiveFilters ? clearFilters : undefined}
            />
          ) : (
            <div className="space-y-6">
              {groupedItems.map((group) => (
                <PackingCategorySection
                  key={group.category}
                  category={group.category}
                  items={group.items}
                  checkedItemIds={checkedItemIds}
                  tripMode={tripMode}
                  onToggleChecked={tripMode ? handleToggleChecked : undefined}
                  onEdit={openEditDialog}
                  onDelete={setItemToDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      <PackingItemDialog
        key={editingItem?.id ?? "new-packing-item"}
        open={isItemDialogOpen}
        item={editingItem}
        isSubmitting={isSaving}
        onOpenChange={(open) => {
          if (!open) {
            closeItemDialog();
          } else {
            setIsItemDialogOpen(true);
          }
        }}
        onSubmit={handleSubmit}
      />

      <Dialog
        open={itemToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setItemToDelete(null);
            setMutationErrorMessage(null);
          }
        }}
      >
        <DialogContent className="border-cyan-100 bg-white shadow-[0_22px_70px_rgba(236,72,153,0.14)] sm:max-w-md">
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-pink-50 text-pink-700">
              <Trash2 className="size-5" aria-hidden="true" />
            </div>
            <DialogTitle>Item verwijderen?</DialogTitle>
            <DialogDescription>
              {itemToDelete
                ? `"${itemToDelete.name}" wordt uit je inpaklijst verwijderd.`
                : "Dit item wordt uit je inpaklijst verwijderd."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isSaving}
              onClick={() => setItemToDelete(null)}
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

      <Dialog
        open={isResetDialogOpen}
        onOpenChange={(open) => setIsResetDialogOpen(open)}
      >
        <DialogContent className="border-cyan-100 bg-white shadow-[0_22px_70px_rgba(236,72,153,0.14)] sm:max-w-md">
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-pink-50 text-pink-700">
              <PackageCheck className="size-5" aria-hidden="true" />
            </div>
            <DialogTitle>Alle checks resetten?</DialogTitle>
            <DialogDescription>
              Alleen de afvinkstatus voor deze reis wordt gewist. Je globale
              inpaklijst blijft bestaan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isSaving}
              onClick={() => setIsResetDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              disabled={isSaving}
              onClick={confirmResetChecks}
            >
              {isSaving ? "Resetten..." : "Resetten"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (isFirebasePermissionError(error)) {
    return "Je hebt geen rechten om deze inpaklijst te bekijken of aan te passen.";
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

function InlineSuccessMessage({ message }: InlineErrorMessageProps) {
  return (
    <div className="rounded-xl border border-lime-100 bg-lime-50 px-4 py-3 text-sm leading-6 text-lime-800">
      {message}
    </div>
  );
}

type StatusStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  secondaryActionLabel?: string;
  isActionDisabled?: boolean;
  onAction?: () => void;
  onSecondaryAction?: () => void;
};

function StatusState({
  title,
  description,
  actionLabel,
  secondaryActionLabel,
  isActionDisabled = false,
  onAction,
  onSecondaryAction,
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
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={onAction}
            disabled={isActionDisabled}
            className="bg-slate-950 text-white hover:bg-slate-800"
          >
            {actionLabel}
          </Button>
          {secondaryActionLabel && onSecondaryAction ? (
            <Button
              type="button"
              variant="outline"
              disabled={isActionDisabled}
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
