import {
  Backpack,
  CloudSunRain,
  CreditCard,
  FileText,
  HeartPulse,
  Package,
  Plane,
  Shirt,
  Sparkles,
  TabletSmartphone,
  type LucideIcon,
} from "lucide-react";

import { packingCategoryLabels } from "@/features/packing/packingCategories";
import { PackingItemCard } from "@/features/packing/PackingItemCard";
import type {
  PackingCategory,
  PackingItem,
} from "@/features/packing/packingTypes";

type PackingCategorySectionProps = {
  category: PackingCategory;
  items: PackingItem[];
  checkedItemIds: Set<string>;
  tripMode?: boolean;
  onToggleChecked?: (item: PackingItem, checked: boolean) => void;
  onEdit?: (item: PackingItem) => void;
  onDelete?: (item: PackingItem) => void;
};

const categoryIcons: Record<PackingCategory, LucideIcon> = {
  documenten: FileText,
  kleding: Shirt,
  toiletartikelen: Sparkles,
  elektronica: TabletSmartphone,
  medicatie: HeartPulse,
  geld: CreditCard,
  onderweg: Plane,
  weer: CloudSunRain,
  activiteiten: Backpack,
  overig: Package,
};

export function PackingCategorySection({
  category,
  items,
  checkedItemIds,
  tripMode = false,
  onToggleChecked,
  onEdit,
  onDelete,
}: PackingCategorySectionProps) {
  const Icon = categoryIcons[category];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
            <Icon className="size-4" aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold text-slate-950">
            {packingCategoryLabels[category]}
          </h2>
        </div>
        <span className="text-sm text-slate-500">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((item) => (
          <PackingItemCard
            key={item.id}
            item={item}
            checked={checkedItemIds.has(item.id)}
            tripMode={tripMode}
            onToggleChecked={onToggleChecked}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}
