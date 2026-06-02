"use client";

import { useMemo, useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  phraseCategories,
  phraseCategoryLabels,
} from "@/features/language/languageLabels";
import type {
  PhraseCategory,
  PhraseFormValues,
  TravelPhrase,
} from "@/features/language/languageTypes";

type PhraseFormProps = {
  phrase?: TravelPhrase;
  onSubmit: (values: PhraseFormValues) => void;
  onCancel: () => void;
};

type PhraseFormErrors = {
  dutchText?: string;
  translatedText?: string;
  category?: string;
};

function getInitialValues(phrase?: TravelPhrase): PhraseFormValues {
  return {
    dutchText: phrase?.dutchText ?? "",
    translatedText: phrase?.translatedText ?? "",
    nativeText: phrase?.nativeText ?? "",
    pronunciation: phrase?.pronunciation ?? "",
    category: phrase?.category ?? "general",
    notes: phrase?.notes ?? "",
    favorite: phrase?.favorite ?? false,
  };
}

export function PhraseForm({ phrase, onSubmit, onCancel }: PhraseFormProps) {
  const initialValues = useMemo(() => getInitialValues(phrase), [phrase]);
  const [values, setValues] = useState<PhraseFormValues>(initialValues);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const errors = getValidationErrors(values);

  function updateValue<Key extends keyof PhraseFormValues>(
    key: Key,
    value: PhraseFormValues[Key]
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));
  }

  function handleSubmit() {
    setSubmitAttempted(true);

    if (Object.keys(getValidationErrors(values)).length > 0) {
      return;
    }

    onSubmit(values);
  }

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="phrase-dutch">Nederlandse tekst *</Label>
          <Textarea
            id="phrase-dutch"
            value={values.dutchText}
            onChange={(event) => updateValue("dutchText", event.target.value)}
            placeholder="Bijvoorbeeld: Dank u wel"
            rows={2}
            aria-invalid={submitAttempted && Boolean(errors.dutchText)}
          />
          {submitAttempted && errors.dutchText ? (
            <p className="text-sm font-medium text-pink-700">
              {errors.dutchText}
            </p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="phrase-translated">Vertaling *</Label>
          <Textarea
            id="phrase-translated"
            value={values.translatedText}
            onChange={(event) =>
              updateValue("translatedText", event.target.value)
            }
            placeholder="Bijvoorbeeld: Arigatou gozaimasu"
            rows={2}
            aria-invalid={submitAttempted && Boolean(errors.translatedText)}
          />
          {submitAttempted && errors.translatedText ? (
            <p className="text-sm font-medium text-pink-700">
              {errors.translatedText}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phrase-native">Originele tekens</Label>
          <Input
            id="phrase-native"
            value={values.nativeText}
            onChange={(event) => updateValue("nativeText", event.target.value)}
            placeholder="ありがとうございます"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phrase-pronunciation">Uitspraakhulp</Label>
          <Input
            id="phrase-pronunciation"
            value={values.pronunciation}
            onChange={(event) =>
              updateValue("pronunciation", event.target.value)
            }
            placeholder="a-rie-ga-too go-zai-mas"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phrase-category">Categorie *</Label>
          <Select
            value={values.category}
            onValueChange={(value) =>
              updateValue("category", value as PhraseCategory)
            }
          >
            <SelectTrigger
              id="phrase-category"
              className="w-full"
              aria-invalid={submitAttempted && Boolean(errors.category)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {phraseCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {phraseCategoryLabels[category]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {submitAttempted && errors.category ? (
            <p className="text-sm font-medium text-pink-700">
              {errors.category}
            </p>
          ) : null}
        </div>
        <label className="flex min-h-9 items-center gap-2 rounded-lg border border-lime-100 bg-lime-50 px-3 text-sm font-medium text-lime-800">
          <input
            type="checkbox"
            checked={values.favorite}
            onChange={(event) => updateValue("favorite", event.target.checked)}
            className="size-4 rounded border-lime-300"
          />
          Favoriet
        </label>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="phrase-notes">Notities</Label>
          <Textarea
            id="phrase-notes"
            value={values.notes}
            onChange={(event) => updateValue("notes", event.target.value)}
            placeholder="Wanneer of waar gebruik je deze zin?"
            rows={3}
          />
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-cyan-100 pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={onCancel}
        >
          Annuleren
        </Button>
        <Button
          type="submit"
          className="w-full bg-slate-950 text-white shadow-[0_0_20px_rgba(34,211,238,0.28)] hover:bg-slate-800 sm:w-auto"
        >
          Opslaan
        </Button>
      </div>
    </form>
  );
}

function getValidationErrors(values: PhraseFormValues): PhraseFormErrors {
  const errors: PhraseFormErrors = {};

  if (values.dutchText.trim().length === 0) {
    errors.dutchText = "Vul de Nederlandse tekst in.";
  }

  if (values.translatedText.trim().length === 0) {
    errors.translatedText = "Vul de vertaling in.";
  }

  if (!values.category) {
    errors.category = "Kies een categorie.";
  }

  return errors;
}
