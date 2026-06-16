"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  ExternalLink,
  FileText,
  ImageIcon,
  LinkIcon,
  Loader2,
  Pencil,
  Star,
  StickyNote,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  documentCategoryLabels,
  documentTypeLabels,
} from "@/features/documents/documentLabels";
import {
  createDocumentFileObjectUrl,
  formatFileSize,
} from "@/features/documents/documentFileService";
import type { TravelDocument } from "@/features/documents/documentTypes";

type DocumentCardProps = {
  document: TravelDocument;
  onEdit?: (document: TravelDocument) => void;
  onDelete?: (document: TravelDocument) => void;
};

export function DocumentCard({
  document,
  onEdit,
  onDelete,
}: DocumentCardProps) {
  const hasActions = Boolean(onEdit || onDelete);
  const TypeIcon = document.type === "link" ? LinkIcon : FileText;
  const dateTimeText = formatRelatedDateTime(document);
  const fileMetaText = formatFileMeta(document);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isOpeningFile, setIsOpeningFile] = useState(false);

  async function openFile() {
    if (!document.filePath) {
      setPreviewError("Bestand niet beschikbaar");
      return;
    }

    setIsOpeningFile(true);
    setPreviewError(null);

    try {
      const objectUrl = await createDocumentFileObjectUrl(document.filePath);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      console.error("Bestand openen mislukt", error);
      setPreviewError("Bestand openen lukt niet");
    } finally {
      setIsOpeningFile(false);
    }
  }

  return (
    <Card className="border-cyan-100 bg-white/95 shadow-[0_14px_35px_rgba(14,165,233,0.10)] transition-shadow hover:shadow-[0_18px_42px_rgba(236,72,153,0.12)]">
      <CardHeader className="gap-3 pb-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100">
                {documentCategoryLabels[document.category]}
              </Badge>
              <Badge
                variant="outline"
                className="border-pink-100 bg-pink-50 text-pink-700"
              >
                <TypeIcon className="size-3" aria-hidden="true" />
                {documentTypeLabels[document.type]}
              </Badge>
              {document.important ? (
                <Badge
                  variant="outline"
                  className="border-lime-100 bg-lime-50 text-lime-700"
                >
                  <Star className="size-3 fill-current" aria-hidden="true" />
                  Belangrijk
                </Badge>
              ) : null}
            </div>
            <CardTitle className="break-words text-xl text-slate-950">
              {document.title}
            </CardTitle>
          </div>
          {hasActions ? (
            <div className="flex shrink-0 gap-1">
              {onEdit ? (
                <Button
                  aria-label="Document bewerken"
                  title="Document bewerken"
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-slate-500 hover:text-cyan-700"
                  onClick={() => onEdit(document)}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </Button>
              ) : null}
              {onDelete ? (
                <Button
                  aria-label="Document verwijderen"
                  title="Document verwijderen"
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-slate-500 hover:text-pink-700"
                  onClick={() => onDelete(document)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {dateTimeText ? (
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <CalendarClock
              className="size-4 text-cyan-600"
              aria-hidden="true"
            />
            {dateTimeText}
          </p>
        ) : null}
        {document.description ? (
          <p className="break-words text-sm leading-6 text-slate-600">
            {document.description}
          </p>
        ) : null}
        {document.notes ? (
          <p className="flex gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
            <StickyNote
              className="mt-0.5 size-4 shrink-0 text-lime-600"
              aria-hidden="true"
            />
            {document.notes}
          </p>
        ) : null}
        {document.type === "file" &&
        (document.fileName || fileMetaText || document.fileContentType) ? (
          <div className="rounded-lg border border-cyan-100 bg-cyan-50/70 px-3 py-2 text-sm leading-6 text-slate-700">
            {document.fileName ? (
              <p className="break-words font-semibold text-slate-950">
                {document.fileName}
              </p>
            ) : null}
            {fileMetaText ? <p>{fileMetaText}</p> : null}
            {document.fileContentType ? (
              <p className="break-words text-slate-500">
                {document.fileContentType}
              </p>
            ) : null}
          </div>
        ) : null}
        {document.type === "file" ? (
          <FilePreview document={document} errorMessage={previewError} />
        ) : null}
        {document.type === "file" && document.filePath ? (
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start sm:w-auto"
            disabled={isOpeningFile}
            onClick={openFile}
          >
            {isOpeningFile ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <ExternalLink className="size-4" aria-hidden="true" />
            )}
            {isOpeningFile ? "Bestand openen..." : "Open bestand"}
          </Button>
        ) : null}
        {document.type === "link" && document.url ? (
          <Button asChild variant="outline" className="w-full justify-start sm:w-auto">
            <a href={document.url} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" aria-hidden="true" />
              Open link
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

type FilePreviewProps = {
  document: TravelDocument;
  errorMessage: string | null;
};

function FilePreview({ document, errorMessage }: FilePreviewProps) {
  const isImage = isImageFile(document);
  const isPdf = document.fileContentType === "application/pdf";

  if (!isImage && !isPdf) {
    return (
      <div className="flex min-h-24 items-center gap-3 rounded-lg border border-cyan-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-cyan-700 shadow-sm">
          <FileText className="size-5" aria-hidden="true" />
        </div>
        <p className="leading-6">
          Voor dit bestandstype is geen voorbeeld beschikbaar.
        </p>
      </div>
    );
  }

  if (!hasFilePath(document)) {
    return (
      <div className="flex min-h-24 items-center gap-3 rounded-lg border border-pink-100 bg-pink-50 px-4 py-3 text-sm text-pink-800">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-pink-700 shadow-sm">
          <FileText className="size-5" aria-hidden="true" />
        </div>
        <p>Bestand niet beschikbaar</p>
      </div>
    );
  }

  return (
    <SecureFilePreview
      key={document.filePath ?? document.id}
      document={document}
      openErrorMessage={errorMessage}
    />
  );
}

type SecureFilePreviewProps = {
  document: TravelDocument & { filePath: string };
  openErrorMessage: string | null;
};

type SecureFilePreviewState =
  | { status: "loading" }
  | { status: "ready"; objectUrl: string }
  | { status: "error"; message: string };

function SecureFilePreview({
  document,
  openErrorMessage,
}: SecureFilePreviewProps) {
  const [previewState, setPreviewState] = useState<SecureFilePreviewState>({
    status: "loading",
  });
  const isImage = isImageFile(document);

  useEffect(() => {
    let isCancelled = false;
    let objectUrl: string | null = null;

    async function loadPreview(filePath: string) {
      try {
        objectUrl = await createDocumentFileObjectUrl(filePath);

        if (isCancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        setPreviewState({ status: "ready", objectUrl });
      } catch (error) {
        console.error("Bestandsvoorbeeld laden mislukt", error);

        if (!isCancelled) {
          setPreviewState({
            status: "error",
            message: "Voorvertoning niet beschikbaar",
          });
        }
      }
    }

    void loadPreview(document.filePath);

    return () => {
      isCancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [document.filePath]);

  if (previewState.status === "loading") {
    return (
      <div className="flex min-h-36 items-center justify-center rounded-lg border border-dashed border-cyan-200 bg-cyan-50/50 text-sm font-medium text-cyan-800">
        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
        Voorbeeld laden...
      </div>
    );
  }

  if (previewState.status === "error" || openErrorMessage) {
    const message =
      openErrorMessage ??
      (previewState.status === "error"
        ? previewState.message
        : "Voorvertoning niet beschikbaar");

    return (
      <div className="flex min-h-24 items-center gap-3 rounded-lg border border-pink-100 bg-pink-50 px-4 py-3 text-sm text-pink-800">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-pink-700 shadow-sm">
          <FileText className="size-5" aria-hidden="true" />
        </div>
        <p>{message}</p>
      </div>
    );
  }

  if (isImage) {
    return (
      <div className="overflow-hidden rounded-lg border border-cyan-100 bg-slate-50">
        {/* eslint-disable-next-line @next/next/no-img-element -- Blob previews cannot be optimized by next/image. */}
        <img
          src={previewState.objectUrl}
          alt={`Voorbeeld van ${document.fileName ?? document.title}`}
          className="max-h-72 w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-cyan-100 bg-slate-50">
      <div className="flex items-center gap-2 border-b border-cyan-100 bg-white px-3 py-2 text-sm font-medium text-slate-700">
        <ImageIcon className="size-4 text-cyan-700" aria-hidden="true" />
        PDF-voorbeeld
      </div>
      <iframe
        src={previewState.objectUrl}
        title={`Voorbeeld van ${document.fileName ?? document.title}`}
        className="h-72 w-full bg-white"
      />
    </div>
  );
}

function formatFileMeta(document: TravelDocument) {
  const parts = [
    typeof document.fileSize === "number"
      ? formatFileSize(document.fileSize)
      : "",
  ].filter(Boolean);

  return parts.join(" - ");
}

function isImageFile(document: TravelDocument) {
  return document.fileContentType?.startsWith("image/") ?? false;
}

function hasFilePath(
  document: TravelDocument
): document is TravelDocument & { filePath: string } {
  return typeof document.filePath === "string" && document.filePath.length > 0;
}

function formatRelatedDateTime(document: TravelDocument) {
  if (!document.relatedDate && !document.relatedTime) {
    return "";
  }

  const date = document.relatedDate ? formatDate(document.relatedDate) : "";
  const time = document.relatedTime ? document.relatedTime : "";

  return [date, time].filter(Boolean).join(" om ");
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
