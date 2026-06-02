"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ideaCategories,
  ideaCategoryLabels,
  ideaPriorities,
  ideaPriorityLabels,
  ideaStatuses,
  ideaStatusLabels,
} from "@/features/ideas/ideaLabels";
import type {
  IdeaCategory,
  IdeaFormValues,
  IdeaPriority,
  IdeaStatus,
  TripIdea,
} from "@/features/ideas/ideaTypes";

type IdeaFormProps = {
  idea?: TripIdea;
  onSubmit: (values: IdeaFormValues) => void;
  onCancel: () => void;
};

type IdeaFormErrors = {
  title?: string;
  scheduleDate?: string;
  startTime?: string;
  endTime?: string;
};

function getInitialValues(idea?: TripIdea): IdeaFormValues {
  return {
    title: idea?.title ?? "",
    description: idea?.description ?? "",
    category: idea?.category ?? "sightseeing",
    status: idea?.status ?? "idea",
    priority: idea?.priority ?? "medium",
    city: idea?.city ?? "",
    locationName: idea?.locationName ?? "",
    googleMapsUrl: idea?.googleMapsUrl ?? "",
    websiteUrl: idea?.websiteUrl ?? "",
    notes: idea?.notes ?? "",
    customsNotes: idea?.customsNotes ?? "",
    showInSchedule: idea?.showInSchedule ?? false,
    scheduleDate: idea?.scheduleDate ?? "",
    startTime: idea?.startTime ?? "",
    endTime: idea?.endTime ?? "",
    tagsText: idea?.tags.join(", ") ?? "",
  };
}

function sanitizeTimeInput(value: string) {
  return value.replace(/[^\d:]/g, "").slice(0, 5);
}

function normalizeTimeInput(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  if (trimmedValue.includes(":")) {
    const [rawHours = "", rawMinutes = ""] = trimmedValue.split(":");
    const hours = rawHours.padStart(2, "0");
    const minutes = rawMinutes.padEnd(2, "0").slice(0, 2);
    const normalizedValue = `${hours}:${minutes}`;

    return isValidTime(normalizedValue) ? normalizedValue : trimmedValue;
  }

  if (!/^\d{1,4}$/.test(trimmedValue)) {
    return trimmedValue;
  }

  const paddedValue =
    trimmedValue.length <= 2
      ? `${trimmedValue.padStart(2, "0")}00`
      : trimmedValue.padStart(4, "0");
  const normalizedValue = `${paddedValue.slice(0, 2)}:${paddedValue.slice(2, 4)}`;

  return isValidTime(normalizedValue) ? normalizedValue : trimmedValue;
}

export function IdeaForm({ idea, onSubmit, onCancel }: IdeaFormProps) {
  const initialValues = useMemo(() => getInitialValues(idea), [idea]);
  const [values, setValues] = useState<IdeaFormValues>(initialValues);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = getValidationErrors(values);
  const showTitleError = submitAttempted && Boolean(errors.title);
  const showScheduleDateError = submitAttempted && Boolean(errors.scheduleDate);
  const showStartTimeError = submitAttempted && Boolean(errors.startTime);
  const showEndTimeError = submitAttempted && Boolean(errors.endTime);

  function updateValue<Key extends keyof IdeaFormValues>(
    key: Key,
    value: IdeaFormValues[Key]
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));
  }

  function handleSubmit(valuesToSubmit: IdeaFormValues) {
    setSubmitAttempted(true);

    if (Object.keys(getValidationErrors(valuesToSubmit)).length > 0) {
      return;
    }

    onSubmit(valuesToSubmit);
  }

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit(values);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-4 sm:col-span-2">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={values.showInSchedule}
              onChange={(event) =>
                updateValue("showInSchedule", event.target.checked)
              }
              className="mt-1 size-4 rounded border-cyan-300 text-cyan-700"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-950">
                Plaats in reisschema
              </span>
              <span className="mt-1 block text-sm leading-6 text-slate-600">
                Toon deze activiteit straks in het reisschema.
              </span>
            </span>
          </label>
        </div>

        {values.showInSchedule ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="idea-schedule-date">Datum *</Label>
              <Input
                id="idea-schedule-date"
                type="date"
                value={values.scheduleDate}
                onChange={(event) =>
                  updateValue("scheduleDate", event.target.value)
                }
                aria-invalid={showScheduleDateError}
              />
              {showScheduleDateError ? (
                <p className="text-sm font-medium text-pink-700">
                  {errors.scheduleDate}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="idea-start-time">Starttijd *</Label>
              <Input
                id="idea-start-time"
                type="text"
                inputMode="numeric"
                pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"
                value={values.startTime}
                onChange={(event) =>
                  updateValue("startTime", sanitizeTimeInput(event.target.value))
                }
                onBlur={() =>
                  updateValue("startTime", normalizeTimeInput(values.startTime))
                }
                placeholder="09:30"
                aria-invalid={showStartTimeError}
              />
              {showStartTimeError ? (
                <p className="text-sm font-medium text-pink-700">
                  {errors.startTime}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="idea-end-time">Eindtijd optioneel</Label>
              <Input
                id="idea-end-time"
                type="text"
                inputMode="numeric"
                pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"
                value={values.endTime}
                onChange={(event) =>
                  updateValue("endTime", sanitizeTimeInput(event.target.value))
                }
                onBlur={() =>
                  updateValue("endTime", normalizeTimeInput(values.endTime))
                }
                placeholder="11:00"
                aria-invalid={showEndTimeError}
              />
              {showEndTimeError ? (
                <p className="text-sm font-medium text-pink-700">
                  {errors.endTime}
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="idea-title">Titel *</Label>
          <Input
            id="idea-title"
            value={values.title}
            onChange={(event) => updateValue("title", event.target.value)}
            placeholder="Bijvoorbeeld: Fushimi Inari vroeg bezoeken"
            required
            aria-invalid={showTitleError}
            aria-describedby={showTitleError ? "idea-title-error" : undefined}
          />
          {showTitleError ? (
            <p id="idea-title-error" className="text-sm font-medium text-pink-700">
              {errors.title}
            </p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="idea-description">Omschrijving</Label>
          <Textarea
            id="idea-description"
            value={values.description}
            onChange={(event) => updateValue("description", event.target.value)}
            placeholder="Waarom is dit leuk of handig?"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="idea-category">Categorie</Label>
          <Select
            value={values.category}
            onValueChange={(value) =>
              updateValue("category", value as IdeaCategory)
            }
          >
            <SelectTrigger id="idea-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ideaCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {ideaCategoryLabels[category]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="idea-status">Status</Label>
          <Select
            value={values.status}
            onValueChange={(value) => updateValue("status", value as IdeaStatus)}
          >
            <SelectTrigger id="idea-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ideaStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {ideaStatusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="idea-priority">Prioriteit</Label>
          <Select
            value={values.priority}
            onValueChange={(value) =>
              updateValue("priority", value as IdeaPriority)
            }
          >
            <SelectTrigger id="idea-priority" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ideaPriorities.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {ideaPriorityLabels[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="idea-city">Stad</Label>
          <Input
            id="idea-city"
            value={values.city}
            onChange={(event) => updateValue("city", event.target.value)}
            placeholder="Tokyo"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="idea-location">Locatienaam</Label>
          <Input
            id="idea-location"
            value={values.locationName}
            onChange={(event) => updateValue("locationName", event.target.value)}
            placeholder="Shibuya Sky"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="idea-maps">Google Maps-link</Label>
          <Input
            id="idea-maps"
            value={values.googleMapsUrl}
            onChange={(event) => updateValue("googleMapsUrl", event.target.value)}
            placeholder="https://maps.google.com/..."
            type="url"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="idea-website">Website-link</Label>
          <Input
            id="idea-website"
            value={values.websiteUrl}
            onChange={(event) => updateValue("websiteUrl", event.target.value)}
            placeholder="https://..."
            type="url"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="idea-tags">Tags</Label>
          <Input
            id="idea-tags"
            value={values.tagsText}
            onChange={(event) => updateValue("tagsText", event.target.value)}
            placeholder="Tokyo, eten, regenplan"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="idea-customs">
            Gewoontes / gebruiken / beleefdheden
          </Label>
          <Textarea
            id="idea-customs"
            value={values.customsNotes}
            onChange={(event) => updateValue("customsNotes", event.target.value)}
            placeholder="Bijvoorbeeld: schoenen uit, stil zijn, niet fotograferen, contant betalen..."
            rows={3}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="idea-notes">Notities</Label>
          <Textarea
            id="idea-notes"
            value={values.notes}
            onChange={(event) => updateValue("notes", event.target.value)}
            placeholder="Praktische details, timing of afspraken"
            rows={3}
          />
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-cyan-100 pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={onCancel}
        >
          Annuleren
        </Button>
        <Button
          type="submit"
          disabled={values.title.trim().length === 0}
          className="w-full bg-slate-950 text-white shadow-[0_0_20px_rgba(34,211,238,0.28)] hover:bg-slate-800 sm:w-auto"
        >
          Opslaan
        </Button>
      </div>
    </form>
  );
}

function getValidationErrors(values: IdeaFormValues): IdeaFormErrors {
  const errors: IdeaFormErrors = {};

  if (values.title.trim().length === 0) {
    errors.title = "Vul een titel in om dit idee op te slaan.";
  }

  if (values.showInSchedule) {
    if (!values.scheduleDate) {
      errors.scheduleDate = "Kies een datum voor het reisschema.";
    }

    if (!values.startTime) {
      errors.startTime = "Kies een starttijd voor het reisschema.";
    } else if (!isValidTime(values.startTime)) {
      errors.startTime = "Gebruik 24-uurs formaat, bijvoorbeeld 09:30.";
    }

    if (values.endTime && !isValidTime(values.endTime)) {
      errors.endTime = "Gebruik 24-uurs formaat, bijvoorbeeld 11:00.";
    } else if (
      values.endTime &&
      values.startTime &&
      isValidTime(values.startTime) &&
      values.endTime < values.startTime
    ) {
      errors.endTime = "De eindtijd mag niet vóór de starttijd liggen.";
    }
  }

  return errors;
}

function isValidTime(value: string) {
  return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value);
}
