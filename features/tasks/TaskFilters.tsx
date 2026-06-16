"use client";

import type { ReactNode } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TripMember } from "@/features/members/memberTypes";
import {
  taskCategories,
  taskCategoryLabels,
  taskPriorities,
  taskPriorityLabels,
  taskStatuses,
  taskStatusLabels,
} from "@/features/tasks/taskLabels";
import type {
  TripTaskCategory,
  TripTaskFilters,
  TripTaskPriority,
  TripTaskStatus,
} from "@/features/tasks/taskTypes";

type TaskFiltersProps = {
  filters: TripTaskFilters;
  members: TripMember[];
  onChange: (filters: TripTaskFilters) => void;
};

export function TaskFilters({ filters, members, onChange }: TaskFiltersProps) {
  const hasActiveFilters =
    filters.query.trim().length > 0 ||
    filters.status !== "all" ||
    filters.category !== "all" ||
    filters.priority !== "all" ||
    filters.assignedToUserId !== "all";

  function clearFilters() {
    onChange({
      query: "",
      status: "all",
      category: "all",
      priority: "all",
      assignedToUserId: "all",
    });
  }

  return (
    <section className="rounded-xl border border-cyan-100 bg-white/95 p-3 shadow-[0_12px_30px_rgba(14,165,233,0.08)] sm:p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <SlidersHorizontal
            className="size-4 text-cyan-600"
            aria-hidden="true"
          />
          Filters
        </div>
        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-pink-700"
            onClick={clearFilters}
          >
            <X className="size-4" aria-hidden="true" />
            Wissen
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
        <div className="space-y-2">
          <Label htmlFor="task-search">Zoeken</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <Input
              id="task-search"
              value={filters.query}
              onChange={(event) =>
                onChange({ ...filters, query: event.target.value })
              }
              className="pl-9"
              placeholder="Titel, omschrijving of persoon"
            />
          </div>
        </div>

        <FilterSelect
          id="task-status-filter"
          label="Status"
          value={filters.status}
          allLabel="Alle statussen"
          onValueChange={(value) =>
            onChange({
              ...filters,
              status: value as TripTaskStatus | "all",
            })
          }
        >
          {taskStatuses.map((status) => (
            <SelectItem key={status} value={status}>
              {taskStatusLabels[status]}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          id="task-category-filter"
          label="Categorie"
          value={filters.category}
          allLabel="Alle categorieen"
          onValueChange={(value) =>
            onChange({
              ...filters,
              category: value as TripTaskCategory | "all",
            })
          }
        >
          {taskCategories.map((category) => (
            <SelectItem key={category} value={category}>
              {taskCategoryLabels[category]}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          id="task-priority-filter"
          label="Prioriteit"
          value={filters.priority}
          allLabel="Alle prioriteiten"
          onValueChange={(value) =>
            onChange({
              ...filters,
              priority: value as TripTaskPriority | "all",
            })
          }
        >
          {taskPriorities.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {taskPriorityLabels[priority]}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          id="task-assignee-filter"
          label="Toegewezen aan"
          value={filters.assignedToUserId}
          allLabel="Iedereen"
          onValueChange={(value) =>
            onChange({
              ...filters,
              assignedToUserId: value as TripTaskFilters["assignedToUserId"],
            })
          }
        >
          <SelectItem value="unassigned">Niemand specifiek</SelectItem>
          {members.map((member) => (
            <SelectItem key={member.userId} value={member.userId}>
              {getMemberDisplayName(member)}
            </SelectItem>
          ))}
        </FilterSelect>
      </div>
    </section>
  );
}

type FilterSelectProps = {
  id: string;
  label: string;
  value: string;
  allLabel: string;
  children: ReactNode;
  onValueChange: (value: string) => void;
};

function FilterSelect({
  id,
  label,
  value,
  allLabel,
  children,
  onValueChange,
}: FilterSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {children}
        </SelectContent>
      </Select>
    </div>
  );
}

function getMemberDisplayName(member: TripMember) {
  return member.displayName ?? member.email ?? "Onbekend";
}
