import {
  CalendarClock,
  ExternalLink,
  FileText,
  LinkIcon,
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
import { formatFileSize } from "@/features/documents/documentFileService";
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
        {document.type === "file" && document.downloadUrl ? (
          <Button asChild variant="outline" className="w-full justify-start sm:w-auto">
            <a href={document.downloadUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" aria-hidden="true" />
              Open bestand
            </a>
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

function formatFileMeta(document: TravelDocument) {
  const parts = [
    typeof document.fileSize === "number"
      ? formatFileSize(document.fileSize)
      : "",
  ].filter(Boolean);

  return parts.join(" - ");
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
