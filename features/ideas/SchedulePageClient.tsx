"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  ExternalLink,
  Languages,
  MapPin,
  Pencil,
  ScrollText,
  Sparkles,
  StickyNote,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ideaCategoryLabels } from "@/features/ideas/ideaLabels";
import { updateIdeaInputFromForm } from "@/features/ideas/ideaFormMapping";
import {
  formatScheduleDayHeading,
  formatScheduleTime,
  getTripScheduleDays,
} from "@/features/ideas/ideaScheduleUtils";
import { IdeaForm } from "@/features/ideas/IdeaForm";
import {
  listIdeasForTrip,
  updateIdeaForTrip,
} from "@/features/ideas/ideaService";
import type { IdeaFormValues, TripIdea } from "@/features/ideas/ideaTypes";
import { getTodayDateString } from "@/features/trips/tripDates";
import type { Trip } from "@/features/trips/tripTypes";

type SchedulePageClientProps = {
  trip: Trip;
};

export function SchedulePageClient({ trip }: SchedulePageClientProps) {
  const [ideas, setIdeas] = useState<TripIdea[]>([]);
  const [editingIdea, setEditingIdea] = useState<TripIdea | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const todayDate = getTodayDateString();

  useEffect(() => {
    let isCancelled = false;

    async function loadIdeas() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const loadedIdeas = await listIdeasForTrip(trip.id);

        if (!isCancelled) {
          setIdeas(loadedIdeas);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(getErrorMessage(error));
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

  const scheduleDays = useMemo(
    () => getTripScheduleDays(trip, ideas),
    [ideas, trip]
  );
  const todayDay = scheduleDays.find((day) => day.date === todayDate);
  const plannedIdeaCount = scheduleDays.reduce(
    (total, day) => total + day.ideas.length,
    0
  );

  function scrollToToday() {
    if (!todayDay) {
      return;
    }

    document
      .getElementById(getScheduleDayId(todayDay.date))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeDialog() {
    setEditingIdea(undefined);
  }

  async function handleSubmit(values: IdeaFormValues) {
    if (!editingIdea) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateIdeaForTrip(
        trip.id,
        editingIdea.id,
        updateIdeaInputFromForm(values)
      );
      await refreshIdeas();
      closeDialog();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reisschema"
        description={`Geplande items uit Ideeën / Activiteiten voor ${trip.title}.`}
        backHref={`/trips/${trip.id}`}
        action={
          todayDay ? (
            <Button
              type="button"
              onClick={scrollToToday}
              className="w-full bg-slate-950 text-white shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:bg-slate-800 sm:w-auto"
            >
              <CalendarClock className="size-4" aria-hidden="true" />
              Naar vandaag
            </Button>
          ) : undefined
        }
      />

      {errorMessage ? (
        <ScheduleStatusState
          title="Reisschema laden lukt niet"
          description={errorMessage}
          actionLabel="Opnieuw proberen"
          onAction={() => {
            setIsLoading(true);
            setErrorMessage(null);
            void refreshIdeas()
              .catch((error) => setErrorMessage(getErrorMessage(error)))
              .finally(() => setIsLoading(false));
          }}
        />
      ) : isLoading ? (
        <ScheduleStatusState
          title="Reisschema laden"
          description="We halen de geplande ideeën en activiteiten op uit Firestore."
        />
      ) : (
        <>
          {scheduleDays.length > 0 ? (
            <section className="rounded-xl border border-cyan-100 bg-white/85 px-4 py-3 text-sm text-slate-600 shadow-[0_10px_24px_rgba(14,165,233,0.06)]">
              <span className="font-medium text-slate-800">
                {scheduleDays.length}{" "}
                {scheduleDays.length === 1 ? "dag" : "dagen"}
              </span>{" "}
              in dit reisschema, met {plannedIdeaCount}{" "}
              {plannedIdeaCount === 1 ? "gepland item" : "geplande items"}.
            </section>
          ) : null}

          {scheduleDays.length === 0 ? (
            <MissingScheduleDaysState />
          ) : (
            <div className="space-y-8">
              {scheduleDays.map((day) => (
                <section
                  key={day.date}
                  id={getScheduleDayId(day.date)}
                  className="scroll-mt-24 space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                      <CalendarClock className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold text-slate-950">
                          {formatScheduleDayHeading(trip, day.date)}
                        </h2>
                        {day.date === todayDate ? (
                          <Badge className="bg-lime-100 text-lime-800 hover:bg-lime-100">
                            Vandaag
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {day.ideas.length === 0
                          ? "Nog niets gepland"
                          : `${day.ideas.length} ${
                              day.ideas.length === 1
                                ? "activiteit"
                                : "activiteiten"
                            } gepland`}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 border-l border-cyan-100 pl-4">
                    {day.ideas.length > 0 ? (
                      day.ideas.map((idea) => (
                        <ScheduleItem
                          key={idea.id}
                          idea={idea}
                          tripId={trip.id}
                          isDisabled={isSaving}
                          onEdit={setEditingIdea}
                        />
                      ))
                    ) : (
                      <EmptyScheduleDay tripId={trip.id} />
                    )}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog
        open={Boolean(editingIdea)}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-cyan-100 bg-white shadow-[0_22px_70px_rgba(14,165,233,0.18)] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Activiteit bewerken</DialogTitle>
            <DialogDescription>
              Pas de activiteit of de plek in het reisschema aan.
            </DialogDescription>
          </DialogHeader>
          {editingIdea ? (
            <IdeaForm
              key={editingIdea.id}
              idea={editingIdea}
              isSubmitting={isSaving}
              scheduleDateRange={{
                startDate: trip.startDate,
                endDate: trip.endDate,
              }}
              onSubmit={handleSubmit}
              onCancel={closeDialog}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getScheduleDayId(date: string) {
  return `reisschema-dag-${date}`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Er ging iets mis. Probeer het opnieuw.";
}

type ScheduleStatusStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

function ScheduleStatusState({
  title,
  description,
  actionLabel,
  onAction,
}: ScheduleStatusStateProps) {
  return (
    <section className="rounded-xl border border-dashed border-cyan-200 bg-white/85 px-5 py-12 text-center shadow-[0_18px_45px_rgba(14,165,233,0.10)]">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
        <Sparkles className="size-5" aria-hidden="true" />
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

type ScheduleItemProps = {
  idea: TripIdea;
  tripId: string;
  isDisabled: boolean;
  onEdit: (idea: TripIdea) => void;
};

function ScheduleItem({ idea, tripId, isDisabled, onEdit }: ScheduleItemProps) {
  const place = [idea.city, idea.locationName].filter(Boolean).join(" - ");

  return (
    <article className="relative rounded-xl border border-cyan-100 bg-white/95 p-4 shadow-[0_14px_35px_rgba(14,165,233,0.10)]">
      <div className="absolute -left-[1.38rem] top-6 size-3 rounded-full border-2 border-white bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.45)]" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100">
              {ideaCategoryLabels[idea.category]}
            </Badge>
            <span className="text-sm font-medium text-slate-700">
              {formatScheduleTime(idea)}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-950">
              {idea.title}
            </h3>
            {idea.description ? (
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {idea.description}
              </p>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full border-cyan-100 bg-white sm:w-auto"
          disabled={isDisabled}
          onClick={() => onEdit(idea)}
        >
          <Pencil className="size-4" aria-hidden="true" />
          Bewerken
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {place ? (
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="size-4 text-pink-500" aria-hidden="true" />
            {place}
          </p>
        ) : null}
        {idea.notes ? (
          <p className="flex gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
            <StickyNote
              className="mt-0.5 size-4 shrink-0 text-lime-600"
              aria-hidden="true"
            />
            {idea.notes}
          </p>
        ) : null}
        {idea.customsNotes ? (
          <p className="flex gap-2 rounded-lg bg-pink-50 px-3 py-2 text-sm leading-6 text-pink-800">
            <ScrollText
              className="mt-0.5 size-4 shrink-0 text-pink-600"
              aria-hidden="true"
            />
            <span>
              <span className="font-medium">Gebruiken: </span>
              {idea.customsNotes}
            </span>
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          {idea.googleMapsUrl ? (
            <Button asChild variant="outline" className="justify-start">
              <a href={idea.googleMapsUrl} target="_blank" rel="noreferrer">
                <MapPin className="size-4" aria-hidden="true" />
                Google Maps
              </a>
            </Button>
          ) : null}
          {idea.websiteUrl ? (
            <Button asChild variant="outline" className="justify-start">
              <a href={idea.websiteUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" aria-hidden="true" />
                Website
              </a>
            </Button>
          ) : null}
          <Button asChild variant="outline" className="justify-start">
            <Link href={`/trips/${tripId}/language`}>
              <Languages className="size-4" aria-hidden="true" />
              Handige zinnen
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

type EmptyScheduleDayProps = {
  tripId: string;
};

function EmptyScheduleDay({ tripId }: EmptyScheduleDayProps) {
  return (
    <div className="rounded-xl border border-dashed border-cyan-200 bg-white/75 px-4 py-5 shadow-[0_12px_30px_rgba(14,165,233,0.06)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
            <Sparkles className="size-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-950">Nog niets gepland</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Kies in Ideeën / Activiteiten een item en zet Plaats in reisschema aan.
            </p>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          className="w-full justify-start border-cyan-100 bg-white sm:w-auto"
        >
          <Link href={`/trips/${tripId}/ideas`}>Naar Ideeën / Activiteiten</Link>
        </Button>
      </div>
    </div>
  );
}

function MissingScheduleDaysState() {
  return (
    <section className="rounded-xl border border-dashed border-cyan-200 bg-white/85 px-5 py-12 text-center shadow-[0_18px_45px_rgba(14,165,233,0.10)]">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
        <Sparkles className="size-5" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold text-slate-950">
        Geen reisdagen gevonden
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        Controleer de start- en einddatum van deze reis.
      </p>
    </section>
  );
}
