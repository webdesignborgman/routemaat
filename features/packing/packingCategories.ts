import type { PackingCategory } from "@/features/packing/packingTypes";

export const packingCategories = [
  "documenten",
  "kleding",
  "toiletartikelen",
  "elektronica",
  "medicatie",
  "geld",
  "onderweg",
  "weer",
  "activiteiten",
  "overig",
] as const;

export const packingCategoryLabels: Record<PackingCategory, string> = {
  documenten: "Documenten",
  kleding: "Kleding",
  toiletartikelen: "Toiletartikelen",
  elektronica: "Elektronica",
  medicatie: "Medicatie",
  geld: "Geld & betaalmiddelen",
  onderweg: "Voor onderweg",
  weer: "Weer & seizoen",
  activiteiten: "Activiteiten",
  overig: "Overig",
};

export const defaultPackingItems: Array<{
  name: string;
  category: PackingCategory;
  quantity: number;
}> = [
  { name: "Paspoort", category: "documenten", quantity: 1 },
  { name: "Rijbewijs", category: "documenten", quantity: 1 },
  { name: "Reisverzekering", category: "documenten", quantity: 1 },
  { name: "Telefoonlader", category: "elektronica", quantity: 1 },
  { name: "Powerbank", category: "elektronica", quantity: 1 },
  { name: "Wereldstekker", category: "elektronica", quantity: 1 },
  { name: "Medicatie", category: "medicatie", quantity: 1 },
  { name: "Paracetamol", category: "medicatie", quantity: 1 },
  { name: "Tandenborstel", category: "toiletartikelen", quantity: 1 },
  { name: "Tandpasta", category: "toiletartikelen", quantity: 1 },
  { name: "Ondergoed", category: "kleding", quantity: 1 },
  { name: "Sokken", category: "kleding", quantity: 1 },
  { name: "Regenjas", category: "weer", quantity: 1 },
  { name: "Zonnebril", category: "weer", quantity: 1 },
  { name: "Snacks voor onderweg", category: "onderweg", quantity: 1 },
];
