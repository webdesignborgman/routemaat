import type {
  CreateTripIdeaInput,
  IdeaFormValues,
  TripIdea,
  UpdateTripIdeaInput,
} from "@/features/ideas/ideaTypes";

export function parseIdeaTags(tagsText: string) {
  const tags = tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  return Array.from(
    new Map(tags.map((tag) => [tag.toLocaleLowerCase("nl-NL"), tag])).values()
  );
}

export function optionalIdeaText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function createIdeaFromForm(
  values: IdeaFormValues,
  tripId: string,
  addedBy: string
): TripIdea {
  const now = new Date();

  return {
    id: crypto.randomUUID(),
    tripId,
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    tags: parseIdeaTags(values.tagsText),
    city: optionalIdeaText(values.city),
    locationName: optionalIdeaText(values.locationName),
    googleMapsUrl: optionalIdeaText(values.googleMapsUrl),
    websiteUrl: optionalIdeaText(values.websiteUrl),
    notes: optionalIdeaText(values.notes),
    customsNotes: optionalIdeaText(values.customsNotes),
    showInSchedule: values.showInSchedule,
    scheduleDate: values.showInSchedule
      ? optionalIdeaText(values.scheduleDate)
      : undefined,
    startTime: values.showInSchedule
      ? optionalIdeaText(values.startTime)
      : undefined,
    endTime: values.showInSchedule ? optionalIdeaText(values.endTime) : undefined,
    status: values.status,
    priority: values.priority,
    addedBy,
    createdAt: now,
    updatedAt: now,
  };
}

export function createIdeaInputFromForm(
  values: IdeaFormValues
): CreateTripIdeaInput {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    tags: parseIdeaTags(values.tagsText),
    city: optionalIdeaText(values.city),
    locationName: optionalIdeaText(values.locationName),
    googleMapsUrl: optionalIdeaText(values.googleMapsUrl),
    websiteUrl: optionalIdeaText(values.websiteUrl),
    notes: optionalIdeaText(values.notes),
    customsNotes: optionalIdeaText(values.customsNotes),
    showInSchedule: values.showInSchedule,
    scheduleDate: values.showInSchedule
      ? optionalIdeaText(values.scheduleDate)
      : undefined,
    startTime: values.showInSchedule
      ? optionalIdeaText(values.startTime)
      : undefined,
    endTime: values.showInSchedule ? optionalIdeaText(values.endTime) : undefined,
    status: values.status,
    priority: values.priority,
  };
}

export function updateIdeaInputFromForm(
  values: IdeaFormValues
): UpdateTripIdeaInput {
  return createIdeaInputFromForm(values);
}

export function updateIdeaFromForm(
  idea: TripIdea,
  values: IdeaFormValues
): TripIdea {
  return {
    ...idea,
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    tags: parseIdeaTags(values.tagsText),
    city: optionalIdeaText(values.city),
    locationName: optionalIdeaText(values.locationName),
    googleMapsUrl: optionalIdeaText(values.googleMapsUrl),
    websiteUrl: optionalIdeaText(values.websiteUrl),
    notes: optionalIdeaText(values.notes),
    customsNotes: optionalIdeaText(values.customsNotes),
    showInSchedule: values.showInSchedule,
    scheduleDate: values.showInSchedule
      ? optionalIdeaText(values.scheduleDate)
      : undefined,
    startTime: values.showInSchedule
      ? optionalIdeaText(values.startTime)
      : undefined,
    endTime: values.showInSchedule ? optionalIdeaText(values.endTime) : undefined,
    status: values.status,
    priority: values.priority,
    updatedAt: new Date(),
  };
}
