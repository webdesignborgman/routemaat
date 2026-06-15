import type {
  TravelDocumentCategory,
  TravelDocumentType,
} from "@/features/documents/documentTypes";

export const documentCategories = [
  "hotel",
  "transport",
  "ticket",
  "reservation",
  "restaurant",
  "activity",
  "esim",
  "insurance",
  "passport",
  "practical",
  "other",
] as const satisfies readonly TravelDocumentCategory[];

export const documentTypes = [
  "link",
  "note",
  "file",
] as const satisfies readonly TravelDocumentType[];

export const documentCategoryLabels: Record<TravelDocumentCategory, string> = {
  hotel: "Hotel",
  transport: "Vervoer",
  ticket: "Ticket",
  reservation: "Reservering",
  restaurant: "Restaurant",
  activity: "Activiteit",
  esim: "eSIM / internet",
  insurance: "Verzekering",
  passport: "Paspoort / reisdocument",
  practical: "Praktisch",
  other: "Overig",
};

export const documentTypeLabels: Record<TravelDocumentType, string> = {
  link: "Link",
  note: "Notitie",
  file: "Bestand",
};
