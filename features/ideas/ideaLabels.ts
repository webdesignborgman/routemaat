import type {
  IdeaCategory,
  IdeaPriority,
  IdeaStatus,
} from "@/features/ideas/ideaTypes";

export const ideaCategoryLabels: Record<IdeaCategory, string> = {
  sightseeing: "Bezienswaardigheid",
  restaurant: "Restaurant",
  hotel: "Hotel",
  shop: "Winkel",
  activity: "Activiteit",
  transport: "Vervoer",
  practical: "Praktisch",
  language: "Taal",
  custom: "Gewoonte / regel",
  document: "Document",
  other: "Overig",
};

export const ideaStatusLabels: Record<IdeaStatus, string> = {
  idea: "Idee",
  maybe: "Misschien",
  planned: "Gepland",
  booked: "Geboekt",
  skipped: "Afgevallen",
};

export const ideaPriorityLabels: Record<IdeaPriority, string> = {
  low: "Laag",
  medium: "Normaal",
  high: "Hoog",
};

export const ideaCategories = Object.keys(
  ideaCategoryLabels
) as IdeaCategory[];

export const ideaStatuses = Object.keys(ideaStatusLabels) as IdeaStatus[];

export const ideaPriorities = Object.keys(
  ideaPriorityLabels
) as IdeaPriority[];
