"use client";

import { Edit, Star, Trash2, Volume2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { phraseCategoryLabels } from "@/features/language/languageLabels";
import { speakPhrase } from "@/features/language/speechUtils";
import type { TravelPhrase } from "@/features/language/languageTypes";

type PhraseCardProps = {
  phrase: TravelPhrase;
  speechSupported: boolean;
  speechLanguage: string;
  onEdit?: (phrase: TravelPhrase) => void;
  onDelete?: (phrase: TravelPhrase) => void;
  onToggleFavorite?: (phrase: TravelPhrase) => void;
};

export function PhraseCard({
  phrase,
  speechSupported,
  speechLanguage,
  onEdit,
  onDelete,
  onToggleFavorite,
}: PhraseCardProps) {
  const speechText = phrase.nativeText ?? phrase.translatedText;
  const hasActions = Boolean(onEdit || onDelete || onToggleFavorite);

  return (
    <article className="rounded-xl border border-cyan-100 bg-white/95 p-4 shadow-[0_14px_35px_rgba(14,165,233,0.10)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-cyan-100 bg-cyan-50 text-cyan-700"
            >
              {phraseCategoryLabels[phrase.category]}
            </Badge>
            {phrase.favorite ? (
              <Badge
                variant="outline"
                className="border-lime-100 bg-lime-50 text-lime-700"
              >
                Favoriet
              </Badge>
            ) : null}
          </div>
          <div>
            <h3 className="text-base font-semibold leading-6 text-slate-950">
              {phrase.dutchText}
            </h3>
            <p className="mt-1 text-lg font-semibold leading-7 text-cyan-800">
              {phrase.translatedText}
            </p>
            {phrase.nativeText ? (
              <p className="mt-1 text-xl leading-8 text-slate-950">
                {phrase.nativeText}
              </p>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="border-cyan-100 bg-white text-cyan-700"
          disabled={!speechSupported}
          onClick={() => speakPhrase(speechText, speechLanguage)}
          aria-label="Zin uitspreken"
          title={
            speechSupported
              ? "Zin uitspreken"
              : "Uitspreken wordt niet ondersteund in deze browser"
          }
        >
          <Volume2 className="size-4" aria-hidden="true" />
        </Button>
      </div>

      {phrase.pronunciation ? (
        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
          <span className="font-medium text-slate-800">Uitspraak: </span>
          {phrase.pronunciation}
        </p>
      ) : null}

      {phrase.notes ? (
        <p className="mt-3 rounded-lg bg-pink-50 px-3 py-2 text-sm leading-6 text-pink-800">
          {phrase.notes}
        </p>
      ) : null}

      {hasActions ? (
        <div className="mt-4 flex flex-col gap-2 border-t border-cyan-100 pt-4 sm:flex-row sm:justify-end">
          {onToggleFavorite ? (
            <Button
              type="button"
              variant="outline"
              className="justify-start border-lime-100 bg-lime-50 text-lime-800 hover:bg-lime-100"
              onClick={() => onToggleFavorite(phrase)}
            >
              <Star
                className={`size-4 ${phrase.favorite ? "fill-current" : ""}`}
                aria-hidden="true"
              />
              {phrase.favorite ? "Favoriet" : "Favoriet maken"}
            </Button>
          ) : null}
          {onEdit ? (
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              onClick={() => onEdit(phrase)}
            >
              <Edit className="size-4" aria-hidden="true" />
              Bewerken
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              type="button"
              variant="outline"
              className="justify-start border-pink-100 text-pink-700 hover:bg-pink-50"
              onClick={() => onDelete(phrase)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Verwijderen
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
