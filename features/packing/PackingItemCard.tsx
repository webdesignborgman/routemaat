import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { packingCategoryLabels } from "@/features/packing/packingCategories";
import type { PackingItem } from "@/features/packing/packingTypes";

type PackingItemCardProps = {
  item: PackingItem;
  checked?: boolean;
  tripMode?: boolean;
  onToggleChecked?: (item: PackingItem, checked: boolean) => void;
  onEdit?: (item: PackingItem) => void;
  onDelete?: (item: PackingItem) => void;
};

export function PackingItemCard({
  item,
  checked = false,
  tripMode = false,
  onToggleChecked,
  onEdit,
  onDelete,
}: PackingItemCardProps) {
  return (
    <Card
      className={`border-cyan-100 bg-white/95 shadow-[0_10px_26px_rgba(14,165,233,0.08)] ${
        checked ? "opacity-75" : ""
      }`}
      size="sm"
    >
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100">
                {packingCategoryLabels[item.category]}
              </Badge>
              <Badge
                variant="outline"
                className="border-lime-100 bg-lime-50 text-lime-700"
              >
                Aantal: {item.quantity}
              </Badge>
              {item.isDefault ? (
                <Badge
                  variant="outline"
                  className="border-pink-100 bg-pink-50 text-pink-700"
                >
                  Altijd mee
                </Badge>
              ) : null}
            </div>
            <CardTitle
              className={`break-words text-base text-slate-950 ${
                checked ? "text-slate-500 line-through" : ""
              }`}
            >
              {item.name}
            </CardTitle>
          </div>
          <div className="flex shrink-0 gap-1">
            {onEdit ? (
              <Button
                aria-label="Item bewerken"
                title="Item bewerken"
                type="button"
                variant="ghost"
                size="icon"
                className="text-slate-500 hover:text-cyan-700"
                onClick={() => onEdit(item)}
              >
                <Pencil className="size-4" aria-hidden="true" />
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                aria-label="Item verwijderen"
                title="Item verwijderen"
                type="button"
                variant="ghost"
                size="icon"
                className="text-slate-500 hover:text-pink-700"
                onClick={() => onDelete(item)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {item.note ? (
          <p className="break-words text-sm leading-6 text-slate-600">
            {item.note}
          </p>
        ) : null}
        {tripMode ? (
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-lime-100 bg-lime-50 px-3 py-2 text-sm font-medium text-lime-800 transition hover:bg-lime-100">
            <input
              type="checkbox"
              checked={checked}
              aria-label={`${item.name} ${
                checked ? "niet ingepakt" : "ingepakt"
              } markeren`}
              onChange={(event) => onToggleChecked?.(item, event.target.checked)}
              className="size-4 rounded border-lime-300"
            />
            {checked ? "Ingepakt" : "Nog inpakken"}
          </label>
        ) : null}
      </CardContent>
    </Card>
  );
}
