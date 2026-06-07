export type PhraseCategory =
  | "general"
  | "restaurant"
  | "hotel"
  | "transport"
  | "temple"
  | "onsen"
  | "shop"
  | "emergency"
  | "custom";

export type TravelPhrase = {
  id: string;
  tripId: string;
  category: PhraseCategory;
  dutchText: string;
  translatedText: string;
  nativeText?: string;
  pronunciation?: string;
  notes?: string;
  favorite: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTravelPhraseInput = {
  category: PhraseCategory;
  dutchText: string;
  translatedText: string;
  nativeText?: string;
  pronunciation?: string;
  notes?: string;
  favorite: boolean;
};

export type UpdateTravelPhraseInput = Partial<CreateTravelPhraseInput>;

export type PhraseFormValues = {
  dutchText: string;
  translatedText: string;
  nativeText: string;
  pronunciation: string;
  category: PhraseCategory;
  notes: string;
  favorite: boolean;
};

export type PhraseFilters = {
  query: string;
  category: PhraseCategory | "all";
  favoriteOnly: boolean;
};
