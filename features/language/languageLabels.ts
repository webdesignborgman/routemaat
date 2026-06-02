import type { PhraseCategory } from "@/features/language/languageTypes";

export const phraseCategories: PhraseCategory[] = [
  "general",
  "restaurant",
  "hotel",
  "transport",
  "temple",
  "onsen",
  "shop",
  "emergency",
  "custom",
];

export const phraseCategoryLabels: Record<PhraseCategory, string> = {
  general: "Algemeen",
  restaurant: "Restaurant",
  hotel: "Hotel",
  transport: "Vervoer",
  temple: "Tempel",
  onsen: "Onsen",
  shop: "Winkel",
  emergency: "Noodgeval",
  custom: "Overig",
};
