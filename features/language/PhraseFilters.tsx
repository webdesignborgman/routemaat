"use client";

import { Search } from "lucide-react";

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
  phraseCategories,
  phraseCategoryLabels,
} from "@/features/language/languageLabels";
import type {
  PhraseCategory,
  PhraseFilters as PhraseFiltersType,
} from "@/features/language/languageTypes";

type PhraseFiltersProps = {
  filters: PhraseFiltersType;
  onChange: (filters: PhraseFiltersType) => void;
};

export function PhraseFilters({ filters, onChange }: PhraseFiltersProps) {
  return (
    <section className="rounded-xl border border-cyan-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(14,165,233,0.08)]">
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto] md:items-end">
        <div className="space-y-2">
          <Label htmlFor="phrase-search">Zoeken</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <Input
              id="phrase-search"
              value={filters.query}
              onChange={(event) =>
                onChange({ ...filters, query: event.target.value })
              }
              className="pl-9"
              placeholder="Zoek op tekst, uitspraak of notities"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phrase-category">Categorie</Label>
          <Select
            value={filters.category}
            onValueChange={(value) =>
              onChange({
                ...filters,
                category: value as PhraseCategory | "all",
              })
            }
          >
            <SelectTrigger id="phrase-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle categorieën</SelectItem>
              {phraseCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {phraseCategoryLabels[category]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="flex min-h-9 items-center gap-2 rounded-lg border border-cyan-100 bg-cyan-50 px-3 text-sm font-medium text-cyan-800">
          <input
            type="checkbox"
            checked={filters.favoriteOnly}
            onChange={(event) =>
              onChange({ ...filters, favoriteOnly: event.target.checked })
            }
            className="size-4 rounded border-cyan-300"
          />
          Alleen favorieten
        </label>
      </div>
    </section>
  );
}
