import { Search, SlidersHorizontal } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ideaCategories,
  ideaCategoryLabels,
  ideaPriorities,
  ideaPriorityLabels,
  ideaStatuses,
  ideaStatusLabels,
} from "@/features/ideas/ideaLabels";
import type {
  IdeaCategory,
  IdeaFilters as IdeaFiltersType,
  IdeaPriority,
  IdeaStatus,
} from "@/features/ideas/ideaTypes";

type IdeaFiltersProps = {
  filters: IdeaFiltersType;
  availableTags: string[];
  onChange: (filters: IdeaFiltersType) => void;
};

export function IdeaFilters({
  filters,
  availableTags,
  onChange,
}: IdeaFiltersProps) {
  return (
    <section className="rounded-xl border border-cyan-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(14,165,233,0.08)]">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <SlidersHorizontal className="size-4 text-cyan-600" aria-hidden="true" />
        Filters
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="space-y-2">
          <Label htmlFor="idea-search">Zoeken</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <Input
              id="idea-search"
              value={filters.query}
              onChange={(event) =>
                onChange({ ...filters, query: event.target.value })
              }
              className="pl-9"
              placeholder="Titel, stad, locatie of tag"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Categorie</Label>
          <Select
            value={filters.category}
            onValueChange={(value) =>
              onChange({
                ...filters,
                category: value as IdeaCategory | "all",
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Alle categorieën" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle categorieën</SelectItem>
              {ideaCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {ideaCategoryLabels[category]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onChange({ ...filters, status: value as IdeaStatus | "all" })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Alle statussen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statussen</SelectItem>
              {ideaStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {ideaStatusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Prioriteit</Label>
          <Select
            value={filters.priority}
            onValueChange={(value) =>
              onChange({
                ...filters,
                priority: value as IdeaPriority | "all",
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Alle prioriteiten" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle prioriteiten</SelectItem>
              {ideaPriorities.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {ideaPriorityLabels[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tag</Label>
          <Select
            value={filters.tag}
            onValueChange={(value) => onChange({ ...filters, tag: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Alle tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle tags</SelectItem>
              {availableTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  #{tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
