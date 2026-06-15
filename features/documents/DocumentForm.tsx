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
  formatFileSize,
  getDocumentFileValidationMessage,
  maxDocumentFileSize,
  validateDocumentFile,
} from "@/features/documents/documentFileService";
import {
  documentCategories,
  documentCategoryLabels,
  documentTypeLabels,
  documentTypes,
} from "@/features/documents/documentLabels";
import type {
  TravelDocument,
  TravelDocumentCategory,
  TravelDocumentFormValues,
  TravelDocumentType,
} from "@/features/documents/documentTypes";

type DocumentFormProps = {
  document?: TravelDocument;
  isSubmitting?: boolean;
  relatedDateRange?: {
    startDate: string;
    endDate: string;
  };
  onSubmit: (values: TravelDocumentFormValues) => void | Promise<void>;
  onCancel: () => void;
};

type DocumentFormErrors = {
  title?: string;
  category?: string;
  type?: string;
  url?: string;
  relatedDate?: string;
  relatedTime?: string;
  file?: string;
};

function getInitialValues(document?: TravelDocument): TravelDocumentFormValues {
  return {
    title: document?.title ?? "",
    category: document?.category ?? "practical",
    type: document?.type ?? "link",
    url: document?.url ?? "",
    description: document?.description ?? "",
    notes: document?.notes ?? "",
    relatedDate: document?.relatedDate ?? "",
    relatedTime: document?.relatedTime ?? "",
    file: null,
    important: document?.important ?? false,
  };
}

function sanitizeTimeInput(value: string) {
  return value.replace(/[^\d:]/g, "").slice(0, 5);
}

function normalizeTimeInput(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  if (trimmedValue.includes(":")) {
    const [rawHours = "", rawMinutes = ""] = trimmedValue.split(":");
    const hours = rawHours.padStart(2, "0");
    const minutes = rawMinutes.padEnd(2, "0").slice(0, 2);
    const normalizedValue = `${hours}:${minutes}`;

    return isValidTime(normalizedValue) ? normalizedValue : trimmedValue;
  }

  if (!/^\d{1,4}$/.test(trimmedValue)) {
    return trimmedValue;
  }

  const paddedValue =
    trimmedValue.length <= 2
      ? `${trimmedValue.padStart(2, "0")}00`
      : trimmedValue.padStart(4, "0");
  const normalizedValue = `${paddedValue.slice(0, 2)}:${paddedValue.slice(2, 4)}`;

  return isValidTime(normalizedValue) ? normalizedValue : trimmedValue;
}

export function DocumentForm({
  document,
  isSubmitting = false,
  relatedDateRange,
  onSubmit,
  onCancel,
}: DocumentFormProps) {
  const initialValues = useMemo(() => getInitialValues(document), [document]);
  const [values, setValues] = useState<TravelDocumentFormValues>(initialValues);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const isEditing = Boolean(document);
  const showUrlField = values.type === "link";
  const showFileField = values.type === "file" && !isEditing;
  const selectedFileName = values.file?.name;
  const errors = getValidationErrors(
    values,
    relatedDateRange,
    showFileField
  );

  function updateValue<Key extends keyof TravelDocumentFormValues>(
    key: Key,
    value: TravelDocumentFormValues[Key]
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));
  }

  async function handleSubmit() {
    const valuesToSubmit: TravelDocumentFormValues = {
      ...values,
      relatedTime: normalizeTimeInput(values.relatedTime),
    };

    setSubmitAttempted(true);
    setValues(valuesToSubmit);

    if (
      Object.keys(
        getValidationErrors(valuesToSubmit, relatedDateRange, showFileField)
      ).length > 0
    ) {
      return;
    }

    await onSubmit(valuesToSubmit);
  }

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="document-title">Titel *</Label>
          <Input
            id="document-title"
            value={values.title}
            onChange={(event) => updateValue("title", event.target.value)}
            placeholder="Bijvoorbeeld: Hotel Kyoto boeking"
            required
            aria-invalid={submitAttempted && Boolean(errors.title)}
          />
          {submitAttempted && errors.title ? (
            <p className="text-sm font-medium text-pink-700">{errors.title}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="document-category">Categorie *</Label>
          <Select
            value={values.category}
            onValueChange={(value) =>
              updateValue("category", value as TravelDocumentCategory)
            }
          >
            <SelectTrigger
              id="document-category"
              className="w-full"
              aria-invalid={submitAttempted && Boolean(errors.category)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {documentCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {documentCategoryLabels[category]}
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

        <div className="space-y-2">
          <Label htmlFor="document-type">Type *</Label>
          <Select
            value={values.type}
            disabled={isEditing}
            onValueChange={(value) => {
              const type = value as TravelDocumentType;

              setValues((currentValues) => ({
                ...currentValues,
                type,
                url: type === "link" ? currentValues.url : "",
                file: type === "file" ? currentValues.file : null,
              }));
            }}
          >
            <SelectTrigger
              id="document-type"
              className="w-full"
              aria-invalid={submitAttempted && Boolean(errors.type)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {documentTypeLabels[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {submitAttempted && errors.type ? (
            <p className="text-sm font-medium text-pink-700">{errors.type}</p>
          ) : null}
          {isEditing ? (
            <p className="text-xs leading-5 text-slate-500">
              Het type blijft vast tijdens bewerken.
            </p>
          ) : null}
        </div>

        {showUrlField ? (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="document-url">URL *</Label>
            <Input
              id="document-url"
              type="url"
              value={values.url}
              onChange={(event) => updateValue("url", event.target.value)}
              placeholder="https://..."
              required
              aria-invalid={submitAttempted && Boolean(errors.url)}
            />
            {submitAttempted && errors.url ? (
              <p className="text-sm font-medium text-pink-700">{errors.url}</p>
            ) : null}
          </div>
        ) : null}

        {showFileField ? (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="document-file">Bestand *</Label>
            <Input
              id="document-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.docx,.xlsx,.pptx,application/pdf,image/jpeg,image/png,image/webp,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              onChange={(event) =>
                updateValue("file", event.target.files?.item(0) ?? null)
              }
              required
              aria-invalid={submitAttempted && Boolean(errors.file)}
            />
            <p className="text-xs leading-5 text-slate-500">
              PDF, afbeeldingen, tekstbestanden of Office-documenten tot{" "}
              {formatFileSize(maxDocumentFileSize)}.
            </p>
            {selectedFileName ? (
              <p className="text-sm font-medium text-slate-700">
                Gekozen bestand: {selectedFileName}
              </p>
            ) : null}
            {submitAttempted && errors.file ? (
              <p className="text-sm font-medium text-pink-700">
                {errors.file}
              </p>
            ) : null}
          </div>
        ) : null}

        {isEditing && document?.type === "file" ? (
          <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm leading-6 text-slate-700 sm:col-span-2">
            Bestand vervangen komt later. Je kunt nu titel, categorie,
            omschrijving, datum, tijd, belangrijk en notities bewerken.
          </div>
        ) : null}

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="document-description">Omschrijving</Label>
          <Textarea
            id="document-description"
            value={values.description}
            onChange={(event) => updateValue("description", event.target.value)}
            placeholder="Wat is dit en waarom is het handig?"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="document-date">Datum</Label>
          <Input
            id="document-date"
            type="date"
            min={relatedDateRange?.startDate}
            max={relatedDateRange?.endDate}
            value={values.relatedDate}
            onChange={(event) => updateValue("relatedDate", event.target.value)}
            aria-invalid={submitAttempted && Boolean(errors.relatedDate)}
          />
          {submitAttempted && errors.relatedDate ? (
            <p className="text-sm font-medium text-pink-700">
              {errors.relatedDate}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="document-time">Tijd</Label>
          <Input
            id="document-time"
            type="text"
            inputMode="numeric"
            pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"
            value={values.relatedTime}
            onChange={(event) =>
              updateValue("relatedTime", sanitizeTimeInput(event.target.value))
            }
            onBlur={() =>
              updateValue("relatedTime", normalizeTimeInput(values.relatedTime))
            }
            placeholder="14:00"
            aria-invalid={submitAttempted && Boolean(errors.relatedTime)}
          />
          {submitAttempted && errors.relatedTime ? (
            <p className="text-sm font-medium text-pink-700">
              {errors.relatedTime}
            </p>
          ) : null}
        </div>

        <label className="flex min-h-12 items-start gap-3 rounded-xl border border-lime-100 bg-lime-50 px-4 py-3 text-sm text-lime-800 sm:col-span-2">
          <input
            type="checkbox"
            checked={values.important}
            onChange={(event) => updateValue("important", event.target.checked)}
            className="mt-1 size-4 rounded border-lime-300"
          />
          <span>
            <span className="block font-semibold">Belangrijk</span>
            <span className="mt-1 block leading-6">
              Zet dit bovenaan als het snel terug te vinden moet zijn.
            </span>
          </span>
        </label>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="document-notes">Notities</Label>
          <Textarea
            id="document-notes"
            value={values.notes}
            onChange={(event) => updateValue("notes", event.target.value)}
            placeholder="Boekingsnummer, afspraken, voorwaarden of andere details"
            rows={4}
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-cyan-100 pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          Annuleren
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-slate-950 text-white shadow-[0_0_20px_rgba(34,211,238,0.28)] hover:bg-slate-800 sm:w-auto"
        >
          {isSubmitting ? "Opslaan..." : "Opslaan"}
        </Button>
      </div>
    </form>
  );
}

function getValidationErrors(
  values: TravelDocumentFormValues,
  relatedDateRange?: DocumentFormProps["relatedDateRange"],
  isFileRequired = false
): DocumentFormErrors {
  const errors: DocumentFormErrors = {};
  const url = values.url.trim();

  if (values.title.trim().length === 0) {
    errors.title = "Vul een titel in.";
  }

  if (!values.category) {
    errors.category = "Kies een categorie.";
  }

  if (!values.type) {
    errors.type = "Kies een type.";
  }

  if (values.type === "link" && url.length === 0) {
    errors.url = "Vul een link in.";
  } else if (url.length > 0 && !isValidUrl(url)) {
    errors.url = "Gebruik een link die begint met http:// of https://.";
  }

  if (isFileRequired) {
    const fileError = validateDocumentFile(values.file);

    if (fileError) {
      errors.file = getDocumentFileValidationMessage(fileError);
    }
  }

  if (
    values.relatedDate &&
    relatedDateRange &&
    (values.relatedDate < relatedDateRange.startDate ||
      values.relatedDate > relatedDateRange.endDate)
  ) {
    errors.relatedDate = "Kies een datum binnen de reisperiode.";
  }

  if (values.relatedTime && !isValidTime(values.relatedTime)) {
    errors.relatedTime = "Gebruik 24-uurs formaat, bijvoorbeeld 14:00.";
  }

  return errors;
}

function isValidUrl(value: string) {
  return /^https?:\/\/\S+\.\S+/.test(value.trim());
}

function isValidTime(value: string) {
  return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value);
}
