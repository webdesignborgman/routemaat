export type TravelDocumentCategory =
  | "hotel"
  | "transport"
  | "ticket"
  | "reservation"
  | "restaurant"
  | "activity"
  | "esim"
  | "insurance"
  | "passport"
  | "practical"
  | "other";

export type TravelDocumentType = "link" | "note" | "file";

export type TravelDocument = {
  id: string;
  tripId: string;
  title: string;
  category: TravelDocumentCategory;
  type: TravelDocumentType;
  url?: string;
  description?: string;
  notes?: string;
  relatedDate?: string;
  relatedTime?: string;
  fileName?: string;
  filePath?: string;
  fileContentType?: string;
  fileSize?: number;
  downloadUrl?: string;
  important: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTravelDocumentInput = {
  title: string;
  category: TravelDocumentCategory;
  type: TravelDocumentType;
  url?: string;
  description?: string;
  notes?: string;
  relatedDate?: string;
  relatedTime?: string;
  fileName?: string;
  filePath?: string;
  fileContentType?: string;
  fileSize?: number;
  downloadUrl?: string;
  important: boolean;
};

export type UpdateTravelDocumentInput = Partial<CreateTravelDocumentInput>;

export type TravelDocumentFilters = {
  query: string;
  category: TravelDocumentCategory | "all";
  type: TravelDocumentType | "all";
  importantOnly: boolean;
};

export type TravelDocumentFormValues = {
  title: string;
  category: TravelDocumentCategory;
  type: TravelDocumentType;
  url: string;
  description: string;
  notes: string;
  relatedDate: string;
  relatedTime: string;
  file: File | null;
  important: boolean;
};
