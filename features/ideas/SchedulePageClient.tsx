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
import {
  ideaCategoryLabels,
} from "@/features/ideas/ideaLabels";
import {
  loadTripIdeas,
  saveTripIdeas,
} from "@/features/ideas/ideaClientStorage";
import {
  formatScheduleDayHeading,
  formatScheduleTime,
  groupScheduledIdeasByDate,
} from "@/features/ideas/ideaScheduleUtils";
import { IdeaForm } from "@/features/ideas/IdeaForm";
import type { IdeaFormValues, TripIdea } from "@/features/ideas/ideaTypes";
import type { Trip } from "@/features/trips/tripTypes";

type SchedulePageClientProps = {
  trip: Trip;
};

function parseTags(tagsText: string) {
  const tags = tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  return Array.from(
    new Map(tags.map((tag) => [tag.toLocaleLowerCase("nl-NL"), tag])).values()
  );
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function updateIdea(idea: TripIdea, values: IdeaFormValues): TripIdea {
  return {
    ...idea,
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    status: values.status,
    priority: values.priority,
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
    tags: parseTags(values.tagsText),
    updatedAt: new Date(),
  };
}

export function SchedulePageClient({ trip }: SchedulePageClientProps) {
  const [ideas, setIdeas] = useState<TripIdea[]>(() => loadTripIdeas(trip.id));
  const [editingIdea, setEditingIdea] = useState<TripIdea | undefined>();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIdeas(loadTripIdeas(trip.id));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [trip.id]);

  const scheduleGroups = useMemo(
    () => groupScheduledIdeasByDate(ideas),
    [ideas]
  );

  function closeDialog() {
    setEditingIdea(undefined);
  }

  function handleSubmit(values: IdeaFormValues) {
    if (!editingIdea) {
      return;
    }

    setIdeas((currentIdeas) => {
      const nextIdeas = currentIdeas.map((idea) =>
        idea.id === editingIdea.id ? updateIdea(idea, values) : idea
      );
      saveTripIdeas(trip.id, nextIdeas);
      return nextIdeas;
    });
    closeDialog();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reisschema"
        description={`Geplande ideeën en activiteiten voor ${trip.title}.`}
        backHref={`/trips/${trip.id}`}
      />

      {scheduleGroups.length === 0 ? (
        <EmptyScheduleState tripId={trip.id} />
      ) : (
        <div className="space-y-8">
          {scheduleGroups.map((group) => (
            <section key={group.date} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                  <CalendarClock className="size-5" aria-hidden="true" />
                </div>
                <h2 className="text-xl font-semibold text-slate-950">
                  {formatScheduleDayHeading(trip, group.date)}
                </h2>
              </div>
              <div className="space-y-4 border-l border-cyan-100 pl-4">
                {group.ideas.map((idea) => (
                  <ScheduleItem
                    key={idea.id}
                    idea={idea}
                    tripId={trip.id}
                    onEdit={setEditingIdea}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
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
              onSubmit={handleSubmit}
              onCancel={closeDialog}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

type ScheduleItemProps = {
  idea: TripIdea;
  tripId: string;
  onEdit: (idea: TripIdea) => void;
};

function ScheduleItem({ idea, tripId, onEdit }: ScheduleItemProps) {
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

type EmptyScheduleStateProps = {
  tripId: string;
};

function EmptyScheduleState({ tripId }: EmptyScheduleStateProps) {
  return (
    <section className="rounded-xl border border-dashed border-cyan-200 bg-white/85 px-5 py-12 text-center shadow-[0_18px_45px_rgba(14,165,233,0.10)]">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
        <Sparkles className="size-5" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold text-slate-950">
        Nog geen activiteiten in het reisschema
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        Zet bij een idee of activiteit de optie Plaats in reisschema aan.
      </p>
      <Button
        asChild
        className="mt-6 bg-slate-950 text-white hover:bg-slate-800"
      >
        <Link href={`/trips/${tripId}/ideas`}>Naar ideeën / activiteiten</Link>
      </Button>
    </section>
  );
}
