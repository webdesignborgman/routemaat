"use client";

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
import {
  documentCategories,
  documentCategoryLabels,
  documentTypeLabels,
  documentTypes,
} from "@/features/documents/documentLabels";
import type {
  TravelDocumentCategory,
  TravelDocumentFilters,
  TravelDocumentType,
} from "@/features/documents/documentTypes";

type DocumentFiltersProps = {
  filters: TravelDocumentFilters;
  onChange: (filters: TravelDocumentFilters) => void;
};

export function DocumentFilters({ filters, onChange }: DocumentFiltersProps) {
  const hasActiveFilters =
    filters.query.trim().length > 0 ||
    filters.category !== "all" ||
    filters.type !== "all" ||
    filters.importantOnly;

  function clearFilters() {
    onChange({
      query: "",
      category: "all",
      type: "all",
      importantOnly: false,
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
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end">
        <div className="space-y-2">
          <Label htmlFor="document-search">Zoeken</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <Input
              id="document-search"
              value={filters.query}
              onChange={(event) =>
                onChange({ ...filters, query: event.target.value })
              }
              className="pl-9"
              placeholder="Titel, link of notities"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="document-category-filter">Categorie</Label>
          <Select
            value={filters.category}
            onValueChange={(value) =>
              onChange({
                ...filters,
                category: value as TravelDocumentCategory | "all",
              })
            }
          >
            <SelectTrigger id="document-category-filter" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle categorieen</SelectItem>
              {documentCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {documentCategoryLabels[category]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="document-type-filter">Type</Label>
          <Select
            value={filters.type}
            onValueChange={(value) =>
              onChange({
                ...filters,
                type: value as TravelDocumentType | "all",
              })
            }
          >
            <SelectTrigger id="document-type-filter" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle types</SelectItem>
              {documentTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {documentTypeLabels[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="flex min-h-9 items-center gap-2 rounded-lg border border-lime-100 bg-lime-50 px-3 text-sm font-medium text-lime-800">
          <input
            type="checkbox"
            checked={filters.importantOnly}
            onChange={(event) =>
              onChange({ ...filters, importantOnly: event.target.checked })
            }
            className="size-4 rounded border-lime-300"
          />
          Alleen belangrijk
        </label>
      </div>
    </section>
  );
}
