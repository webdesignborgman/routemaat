import type {
  TripTaskCategory,
  TripTaskPriority,
  TripTaskStatus,
} from "@/features/tasks/taskTypes";

export const taskStatuses = ["open", "in_progress", "done"] as const;

export const taskPriorities = ["low", "medium", "high"] as const;

export const taskCategories = [
  "general",
  "booking",
  "documents",
  "transport",
  "money",
  "health",
  "packing",
  "tickets",
  "food",
  "other",
] as const;

export const taskStatusLabels: Record<TripTaskStatus, string> = {
  open: "Open",
  in_progress: "Bezig",
  done: "Klaar",
};

export const taskPriorityLabels: Record<TripTaskPriority, string> = {
  low: "Laag",
  medium: "Normaal",
  high: "Hoog",
};

export const taskCategoryLabels: Record<TripTaskCategory, string> = {
  general: "Algemeen",
  booking: "Boekingen",
  documents: "Documenten",
  transport: "Vervoer",
  money: "Geldzaken",
  health: "Gezondheid",
  packing: "Inpakken",
  tickets: "Tickets",
  food: "Eten",
  other: "Overig",
};
