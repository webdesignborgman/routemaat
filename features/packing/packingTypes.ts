export type PackingCategory =
  | "documenten"
  | "kleding"
  | "toiletartikelen"
  | "elektronica"
  | "medicatie"
  | "geld"
  | "onderweg"
  | "weer"
  | "activiteiten"
  | "overig";

export type PackingItem = {
  id: string;
  userId: string;
  name: string;
  category: PackingCategory;
  quantity: number;
  note?: string;
  isDefault: boolean;
  isArchived: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePackingItemInput = {
  name: string;
  category: PackingCategory;
  quantity: number;
  note?: string;
  isDefault: boolean;
  sortOrder?: number;
};

export type UpdatePackingItemInput = Partial<CreatePackingItemInput> & {
  isArchived?: boolean;
};

export type PackingCheck = {
  id: string;
  tripId: string;
  userId: string;
  itemId: string;
  checked: boolean;
  updatedAt: Date;
};

export type PackingItemFormValues = {
  name: string;
  category: PackingCategory;
  quantity: string;
  note: string;
  isDefault: boolean;
};

export type PackingStatusFilter = "all" | "open" | "checked";
