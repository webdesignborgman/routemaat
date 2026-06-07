"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Plus, Route, Sparkles, Trash2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/useAuth";
import {
  getTodayDateString,
  isUpcomingTrip,
  sortTripsByStartDate,
} from "@/features/trips/tripDates";
import {
  createTripForUser,
  deleteTrip,
  listTripsForUser,
} from "@/features/trips/tripService";
import { canManageMembers } from "@/features/members/memberPermissions";
import { TripCard } from "@/features/trips/TripCard";
import type { Trip } from "@/features/trips/tripTypes";

type TripFormErrors = {
  title?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
};

function defaultDateValue() {
  return getTodayDateString();
}

export function TripsPageClient() {
  const router = useRouter();
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null
  );
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState(defaultDateValue);
  const [endDate, setEndDate] = useState(defaultDateValue);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<TripFormErrors>({});

  useEffect(() => {
    let isCancelled = false;

    async function loadTrips() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadErrorMessage(null);

      try {
        const loadedTrips = await listTripsForUser(user.uid);

        if (!isCancelled) {
          setTrips(loadedTrips);
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

    void loadTrips();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  async function refreshTrips() {
    if (!user) {
      return;
    }

    setTrips(await listTripsForUser(user.uid));
  }

  const upcomingTrips = useMemo(
    () => sortTripsByStartDate(trips.filter((trip) => isUpcomingTrip(trip)), "asc"),
    [trips]
  );
  const previousTrips = useMemo(
    () =>
      sortTripsByStartDate(
        trips.filter((trip) => !isUpcomingTrip(trip)),
        "desc"
      ),
    [trips]
  );
  const hasTrips = trips.length > 0;

  function resetForm() {
    setTitle("");
    setDestination("");
    setStartDate(defaultDateValue());
    setEndDate(defaultDateValue());
    setDescription("");
    setErrors({});
  }

  function openCreateDialog() {
    resetForm();
    setSaveErrorMessage(null);
    setIsDialogOpen(true);
  }

  function closeCreateDialog() {
    setIsDialogOpen(false);
    setErrors({});
    setSaveErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDestination = destination.trim();
    const nextErrors: TripFormErrors = {};

    if (!trimmedTitle) {
      nextErrors.title = "Vul een titel in voor je reis.";
    }

    if (!trimmedDestination) {
      nextErrors.destination = "Vul een bestemming in.";
    }

    if (!startDate) {
      nextErrors.startDate = "Kies een startdatum.";
    }

    if (!endDate) {
      nextErrors.endDate = "Kies een einddatum.";
    } else if (startDate && endDate < startDate) {
      nextErrors.endDate = "De einddatum mag niet vóór de startdatum liggen.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!user) {
      setSaveErrorMessage("Log opnieuw in om deze reis op te slaan.");
      return;
    }

    setIsSaving(true);
    setSaveErrorMessage(null);

    try {
      const newTripId = await createTripForUser(
        {
          title: trimmedTitle,
          destination: trimmedDestination,
          description: description.trim() || undefined,
          startDate,
          endDate,
        },
        user
      );

      await refreshTrips();
      closeCreateDialog();
      resetForm();
      router.push(`/trips/${newTripId}`);
    } catch (error) {
      console.error("Reis opslaan mislukt", error);
      setSaveErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  function openDeleteDialog(trip: Trip) {
    setDeleteErrorMessage(null);
    setTripToDelete(trip);
  }

  function closeDeleteDialog() {
    setTripToDelete(null);
    setDeleteErrorMessage(null);
  }

  async function confirmDeleteTrip() {
    if (!tripToDelete) {
      return;
    }

    setIsDeleting(true);
    setDeleteErrorMessage(null);

    try {
      await deleteTrip(tripToDelete.id);
      await refreshTrips();
      closeDeleteDialog();
    } catch (error) {
      console.error("Reis verwijderen mislukt", error);
      setDeleteErrorMessage(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reizen"
        description="Kies een reis en verzamel samen ideeën, plekken en praktische notities."
        action={
          <Button
            type="button"
            onClick={openCreateDialog}
            disabled={isSaving}
            className="w-full bg-slate-950 text-white shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:bg-slate-800 sm:w-auto"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nieuwe reis maken
          </Button>
        }
      />

      {loadErrorMessage ? (
        <StatusState
          title="Reizen laden lukt niet"
          description={loadErrorMessage}
          actionLabel="Opnieuw proberen"
          onAction={() => {
            setIsLoading(true);
            setLoadErrorMessage(null);
            void refreshTrips()
              .catch((error) => setLoadErrorMessage(getErrorMessage(error)))
              .finally(() => setIsLoading(false));
          }}
        />
      ) : isLoading ? (
        <StatusState
          title="Reizen laden"
          description="We halen je reizen op uit Firestore."
        />
      ) : !hasTrips ? (
        <EmptyTripsState onCreate={openCreateDialog} />
      ) : (
        <div className="space-y-8">
          <TripSection
            title="Komende reizen"
            description="Reizen die nog lopen of op de planning staan."
            trips={upcomingTrips}
            emptyText="Er staan nog geen komende reizen klaar."
            onDelete={openDeleteDialog}
          />
          <TripSection
            title="Eerdere reizen"
            description="Reizen waarvan de einddatum al voorbij is."
            trips={previousTrips}
            emptyText="Je hebt nog geen eerdere reizen."
            onDelete={openDeleteDialog}
          />
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeCreateDialog()}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-cyan-100 bg-white shadow-[0_22px_70px_rgba(14,165,233,0.18)] sm:max-w-xl">
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 shadow-[0_0_22px_rgba(34,211,238,0.18)]">
              <CalendarPlus className="size-5" aria-hidden="true" />
            </div>
            <DialogTitle>Nieuwe reis maken</DialogTitle>
            <DialogDescription>
              Maak een reis aan en verzamel daarna ideeën, planning en notities.
            </DialogDescription>
          </DialogHeader>
          {saveErrorMessage ? <InlineErrorMessage message={saveErrorMessage} /> : null}

          <form className="space-y-4" noValidate onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="trip-title">Titel</Label>
              <Input
                id="trip-title"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setErrors((currentErrors) => ({
                    ...currentErrors,
                    title: undefined,
                  }));
                }}
                placeholder="Bijvoorbeeld Japan 2028"
                required
                aria-invalid={Boolean(errors.title)}
              />
              {errors.title ? (
                <p className="text-sm font-medium text-pink-700">{errors.title}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="trip-destination">Bestemming</Label>
              <Input
                id="trip-destination"
                value={destination}
                onChange={(event) => {
                  setDestination(event.target.value);
                  setErrors((currentErrors) => ({
                    ...currentErrors,
                    destination: undefined,
                  }));
                }}
                placeholder="Tokyo, Kyoto en Osaka"
                required
                aria-invalid={Boolean(errors.destination)}
              />
              {errors.destination ? (
                <p className="text-sm font-medium text-pink-700">
                  {errors.destination}
                </p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="trip-start-date">Startdatum</Label>
                <Input
                  id="trip-start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    const nextStartDate = event.target.value;
                    setStartDate(nextStartDate);
                    setErrors((currentErrors) => ({
                      ...currentErrors,
                      startDate: undefined,
                      endDate:
                        endDate && nextStartDate && endDate < nextStartDate
                          ? undefined
                          : currentErrors.endDate,
                    }));

                    if (endDate && nextStartDate && endDate < nextStartDate) {
                      setEndDate(nextStartDate);
                    }
                  }}
                  required
                  aria-invalid={Boolean(errors.startDate)}
                />
                {errors.startDate ? (
                  <p className="text-sm font-medium text-pink-700">
                    {errors.startDate}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="trip-end-date">Einddatum</Label>
                <Input
                  id="trip-end-date"
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(event) => {
                    setEndDate(event.target.value);
                    setErrors((currentErrors) => ({
                      ...currentErrors,
                      endDate: undefined,
                    }));
                  }}
                  required
                  aria-invalid={Boolean(errors.endDate)}
                />
                {errors.endDate ? (
                  <p className="text-sm font-medium text-pink-700">
                    {errors.endDate}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="trip-description">Korte omschrijving</Label>
              <Textarea
                id="trip-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Wat willen jullie verzamelen of onthouden?"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={isSaving}
                onClick={closeCreateDialog}
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full bg-slate-950 text-white hover:bg-slate-800 sm:w-auto"
              >
                {isSaving ? "Opslaan..." : "Opslaan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={tripToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeDeleteDialog();
          }
        }}
      >
        <DialogContent className="border-cyan-100 bg-white shadow-[0_22px_70px_rgba(236,72,153,0.14)] sm:max-w-md">
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-pink-50 text-pink-700">
              <Trash2 className="size-5" aria-hidden="true" />
            </div>
            <DialogTitle>Reis verwijderen?</DialogTitle>
            <DialogDescription>
              {tripToDelete
                ? `"${tripToDelete.title}" wordt verwijderd, inclusief leden en ideeën.`
                : "Deze reis wordt verwijderd, inclusief leden en ideeën."}
            </DialogDescription>
          </DialogHeader>
          {deleteErrorMessage ? (
            <InlineErrorMessage message={deleteErrorMessage} />
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isDeleting}
              onClick={closeDeleteDialog}
            >
              Annuleren
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              disabled={isDeleting}
              onClick={confirmDeleteTrip}
            >
              {isDeleting ? "Verwijderen..." : "Verwijderen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type TripSectionProps = {
  title: string;
  description: string;
  trips: Trip[];
  emptyText: string;
  onDelete: (trip: Trip) => void;
};

function TripSection({
  title,
  description,
  trips,
  emptyText,
  onDelete,
}: TripSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <span className="rounded-full border border-cyan-100 bg-white px-3 py-1 text-sm font-medium text-cyan-700 shadow-[0_0_18px_rgba(34,211,238,0.14)]">
          {trips.length}
        </span>
      </div>
      {trips.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onDelete={canManageMembers(trip.currentUserRole) ? onDelete : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-cyan-200 bg-white/75 px-5 py-8 text-sm leading-6 text-slate-600 shadow-[0_12px_30px_rgba(14,165,233,0.06)]">
          {emptyText}
        </div>
      )}
    </section>
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
    <section className="rounded-xl border border-dashed border-cyan-200 bg-white/85 px-5 py-12 text-center shadow-[0_18px_45px_rgba(14,165,233,0.10)]">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
        <Route className="size-5" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        {description}
      </p>
      {actionLabel && onAction ? (
        <Button
          type="button"
          onClick={onAction}
          className="mt-6 bg-slate-950 text-white hover:bg-slate-800"
        >
          {actionLabel}
        </Button>
      ) : null}
    </section>
  );
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

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Er ging iets mis. Probeer het opnieuw.";
}

type EmptyTripsStateProps = {
  onCreate: () => void;
};

function EmptyTripsState({ onCreate }: EmptyTripsStateProps) {
  return (
    <section className="rounded-xl border border-dashed border-cyan-200 bg-white/85 px-5 py-12 text-center shadow-[0_18px_45px_rgba(14,165,233,0.10)]">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-pink-50 text-pink-600 shadow-[0_0_22px_rgba(236,72,153,0.16)]">
        <Route className="size-5" aria-hidden="true" />
      </div>
      <div className="inline-flex items-center gap-2 rounded-full border border-lime-100 bg-lime-50 px-3 py-1 text-xs font-medium text-lime-700">
        <Sparkles className="size-3.5" aria-hidden="true" />
        Klaar voor jullie eerste plan
      </div>
      <h2 className="mt-4 text-xl font-semibold text-slate-950">
        Je hebt nog geen reizen
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        Maak een reis aan om ideeën, plekken en notities overzichtelijk bij
        elkaar te houden.
      </p>
      <Button
        type="button"
        onClick={onCreate}
        className="mt-6 bg-slate-950 text-white shadow-[0_0_24px_rgba(34,211,238,0.30)] hover:bg-slate-800"
      >
        <Plus className="size-4" aria-hidden="true" />
        Nieuwe reis maken
      </Button>
    </section>
  );
}
