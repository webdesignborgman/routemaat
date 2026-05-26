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
  ideaCategories,
  ideaCategoryLabels,
  ideaPriorities,
  ideaPriorityLabels,
  ideaStatuses,
  ideaStatusLabels,
} from "@/features/ideas/ideaLabels";
import type {
  IdeaCategory,
  IdeaFormValues,
  IdeaPriority,
  IdeaStatus,
  TripIdea,
} from "@/features/ideas/ideaTypes";

type IdeaFormProps = {
  idea?: TripIdea;
  onSubmit: (values: IdeaFormValues) => void;
  onCancel: () => void;
};

function getInitialValues(idea?: TripIdea): IdeaFormValues {
  return {
    title: idea?.title ?? "",
    description: idea?.description ?? "",
    category: idea?.category ?? "sightseeing",
    status: idea?.status ?? "idea",
    priority: idea?.priority ?? "medium",
    city: idea?.city ?? "",
    locationName: idea?.locationName ?? "",
    googleMapsUrl: idea?.googleMapsUrl ?? "",
    websiteUrl: idea?.websiteUrl ?? "",
    notes: idea?.notes ?? "",
    tagsText: idea?.tags.join(", ") ?? "",
  };
}

export function IdeaForm({ idea, onSubmit, onCancel }: IdeaFormProps) {
  const initialValues = useMemo(() => getInitialValues(idea), [idea]);
  const [values, setValues] = useState<IdeaFormValues>(initialValues);

  const titleIsValid = values.title.trim().length > 0;

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!titleIsValid) {
          return;
        }
        onSubmit(values);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="idea-title">Titel *</Label>
          <Input
            id="idea-title"
            value={values.title}
            onChange={(event) =>
              setValues({ ...values, title: event.target.value })
            }
            placeholder="Bijvoorbeeld: Fushimi Inari vroeg bezoeken"
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="idea-description">Omschrijving</Label>
          <Textarea
            id="idea-description"
            value={values.description}
            onChange={(event) =>
              setValues({ ...values, description: event.target.value })
            }
            placeholder="Waarom is dit leuk of handig?"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Categorie</Label>
          <Select
            value={values.category}
            onValueChange={(value) =>
              setValues({ ...values, category: value as IdeaCategory })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
            value={values.status}
            onValueChange={(value) =>
              setValues({ ...values, status: value as IdeaStatus })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
            value={values.priority}
            onValueChange={(value) =>
              setValues({ ...values, priority: value as IdeaPriority })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ideaPriorities.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {ideaPriorityLabels[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="idea-city">Stad</Label>
          <Input
            id="idea-city"
            value={values.city}
            onChange={(event) =>
              setValues({ ...values, city: event.target.value })
            }
            placeholder="Tokyo"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="idea-location">Locatienaam</Label>
          <Input
            id="idea-location"
            value={values.locationName}
            onChange={(event) =>
              setValues({ ...values, locationName: event.target.value })
            }
            placeholder="Shibuya Sky"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="idea-maps">Google Maps-link</Label>
          <Input
            id="idea-maps"
            value={values.googleMapsUrl}
            onChange={(event) =>
              setValues({ ...values, googleMapsUrl: event.target.value })
            }
            placeholder="https://maps.google.com/..."
            type="url"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="idea-website">Website-link</Label>
          <Input
            id="idea-website"
            value={values.websiteUrl}
            onChange={(event) =>
              setValues({ ...values, websiteUrl: event.target.value })
            }
            placeholder="https://..."
            type="url"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="idea-tags">Tags</Label>
          <Input
            id="idea-tags"
            value={values.tagsText}
            onChange={(event) =>
              setValues({ ...values, tagsText: event.target.value })
            }
            placeholder="Tokyo, eten, regenplan"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="idea-notes">Notities</Label>
          <Textarea
            id="idea-notes"
            value={values.notes}
            onChange={(event) =>
              setValues({ ...values, notes: event.target.value })
            }
            placeholder="Praktische details, timing of afspraken"
            rows={3}
          />
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuleren
        </Button>
        <Button
          type="submit"
          disabled={!titleIsValid}
          className="bg-slate-950 text-white hover:bg-slate-800"
        >
          Opslaan
        </Button>
      </div>
    </form>
  );
}
