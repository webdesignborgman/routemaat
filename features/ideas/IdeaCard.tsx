import { ExternalLink, MapPin, Pencil, StickyNote, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ideaCategoryLabels,
  ideaPriorityLabels,
  ideaStatusLabels,
} from "@/features/ideas/ideaLabels";
import type {
  IdeaPriority,
  IdeaStatus,
  TripIdea,
} from "@/features/ideas/ideaTypes";
import { cn } from "@/lib/utils";

type IdeaCardProps = {
  idea: TripIdea;
  onEdit: (idea: TripIdea) => void;
  onDelete: (idea: TripIdea) => void;
};

const statusStyles: Record<IdeaStatus, string> = {
  idea: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  maybe: "bg-pink-50 text-pink-700 ring-pink-200",
  planned: "bg-lime-50 text-lime-700 ring-lime-200",
  booked: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  skipped: "bg-slate-100 text-slate-600 ring-slate-200",
};

const priorityStyles: Record<IdeaPriority, string> = {
  low: "bg-slate-50 text-slate-600 ring-slate-200",
  medium: "bg-blue-50 text-blue-700 ring-blue-200",
  high: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
};

export function IdeaCard({ idea, onEdit, onDelete }: IdeaCardProps) {
  const place = [idea.city, idea.locationName].filter(Boolean).join(" - ");

  return (
    <Card className="border-cyan-100 bg-white/95 shadow-[0_14px_35px_rgba(14,165,233,0.10)] transition-shadow hover:shadow-[0_18px_42px_rgba(236,72,153,0.12)]">
      <CardHeader className="gap-3 pb-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100">
              {ideaCategoryLabels[idea.category]}
            </Badge>
            <CardTitle className="break-words text-xl text-slate-950">
              {idea.title}
            </CardTitle>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              aria-label="Idee bewerken"
              title="Idee bewerken"
              type="button"
              variant="ghost"
              size="icon"
              className="text-slate-500 hover:text-cyan-700"
              onClick={() => onEdit(idea)}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label="Idee verwijderen"
              title="Idee verwijderen"
              type="button"
              variant="ghost"
              size="icon"
              className="text-slate-500 hover:text-pink-700"
              onClick={() => onDelete(idea)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {place ? (
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="size-4 text-pink-500" aria-hidden="true" />
            {place}
          </p>
        ) : null}
        {idea.description ? (
          <p className="break-words text-sm leading-6 text-slate-600">
            {idea.description}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium ring-1",
              statusStyles[idea.status]
            )}
          >
            {ideaStatusLabels[idea.status]}
          </span>
          <span
            className={cn(
              "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium ring-1",
              priorityStyles[idea.priority]
            )}
          >
            {ideaPriorityLabels[idea.priority]}
          </span>
          {idea.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-slate-200 bg-white text-slate-600"
            >
              #{tag}
            </Badge>
          ))}
        </div>
        {idea.notes ? (
          <p className="flex gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
            <StickyNote
              className="mt-0.5 size-4 shrink-0 text-lime-600"
              aria-hidden="true"
            />
            {idea.notes}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          {idea.googleMapsUrl ? (
            <Button asChild variant="outline" className="justify-start">
              <a href={idea.googleMapsUrl} target="_blank" rel="noreferrer">
                <MapPin className="size-4" aria-hidden="true" />
                Google Maps
              </a>
            </Button>
          ) : null}
          {idea.websiteUrl ? (
            <Button asChild variant="outline" className="justify-start">
              <a href={idea.websiteUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" aria-hidden="true" />
                Website
              </a>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
