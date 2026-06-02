export type IdeaStatus = "idea" | "maybe" | "planned" | "booked" | "skipped";

export type IdeaPriority = "low" | "medium" | "high";

export type IdeaCategory =
  | "sightseeing"
  | "restaurant"
  | "hotel"
  | "shop"
  | "activity"
  | "transport"
  | "practical"
  | "language"
  | "custom"
  | "document"
  | "other";

export type TripIdea = {
  id: string;
  tripId: string;
  title: string;
  description: string;
  category: IdeaCategory;
  tags: string[];
  city?: string;
  locationName?: string;
  googleMapsUrl?: string;
  websiteUrl?: string;
  notes?: string;
  customsNotes?: string;
  showInSchedule: boolean;
  scheduleDate?: string;
  startTime?: string;
  endTime?: string;
  status: IdeaStatus;
  priority: IdeaPriority;
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type IdeaFormValues = {
  title: string;
  description: string;
  category: IdeaCategory;
  status: IdeaStatus;
  priority: IdeaPriority;
  city: string;
  locationName: string;
  googleMapsUrl: string;
  websiteUrl: string;
  notes: string;
  customsNotes: string;
  showInSchedule: boolean;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  tagsText: string;
};

export type IdeaFilters = {
  query: string;
  category: IdeaCategory | "all";
  status: IdeaStatus | "all";
  priority: IdeaPriority | "all";
  tag: string;
};
