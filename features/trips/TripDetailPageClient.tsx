"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarClock,
  FileText,
  Languages,
  Lightbulb,
  ListTodo,
  MapPin,
  Pencil,
  Route,
  Users,
  Backpack,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/useAuth";
import { canEditTripContent } from "@/features/members/memberPermissions";
import { getTripMember } from "@/features/members/memberService";
import type { TripMember } from "@/features/members/memberTypes";
import {
  TripLanguageFields,
  type TripLanguageFormValues,
} from "@/features/trips/TripLanguageFields";
import { getPresetForLanguageSettings } from "@/features/trips/tripLanguagePresets";
import {
  formatTripPeriod,
  getTripDayCount,
  getTripStatus,
  getTripStatusLabel,
  type TripStatus,
} from "@/features/trips/tripDates";
import { updateTrip } from "@/features/trips/tripService";
import type { Trip } from "@/features/trips/tripTypes";
import { useTripLookup } from "@/features/trips/useTripLookup";

type TripDetailPageClientProps = {
  tripId: string;
};

type QuickAction = {
  title: string;
  description: string;
  icon: typeof Lightbulb;
  href?: string;
  accentClassName: string;
};

type TripFormErrors = {
  title?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
};

const statusBadgeClasses: Record<TripStatus, string> = {
  upcoming: "border-cyan-200 bg-cyan-50 text-cyan-700",
  ongoing: "border-lime-200 bg-lime-50 text-lime-700",
  past: "border-pink-200 bg-pink-50 text-pink-700",
};

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function getLanguageValuesFromTrip(trip: Trip): TripLanguageFormValues {
  return {
    presetId: getPresetForLanguageSettings({
      countryCode: trip.countryCode,
      languageCode: trip.languageCode,
      languageName: trip.languageName,
      nativeLanguageName: trip.nativeLanguageName,
    }),
    countryCode: trip.countryCode ?? "",
    languageCode: trip.languageCode ?? "",
    languageName: trip.languageName ?? "",
    nativeLanguageName: trip.nativeLanguageName ?? "",
  };
}

export function TripDetailPageClient({ tripId }: TripDetailPageClientProps) {
  const { user } = useAuth();
  const { trip, isLoading, errorMessage } = useTripLookup(tripId);
  const [currentMember, setCurrentMember] = useState<TripMember | null>(null);
  const [editedTrip, setEditedTrip] = useState<Trip | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [languageValues, setLanguageValues] = useState<TripLanguageFormValues>({
    presetId: "none",
    countryCode: "",
    languageCode: "",
    languageName: "",
    nativeLanguageName: "",
  });
  const [errors, setErrors] = useState<TripFormErrors>({});
  const currentTrip = editedTrip ?? trip;
  const canEditTrip = canEditTripContent(currentMember?.role);

  useEffect(() => {
    let isCancelled = false;

    async function loadCurrentMember() {
      if (!user || !trip) {
        setCurrentMember(null);
        return;
      }

      try {
        const member = await getTripMember(trip.id, user.uid);

        if (!isCancelled) {
          setCurrentMember(member);
        }
      } catch (error) {
        console.error("Reisrol laden mislukt", error);

        if (!isCancelled) {
          setCurrentMember(null);
        }
      }
    }

    void loadCurrentMember();

    return () => {
      isCancelled = true;
    };
  }, [trip, user]);

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        title: "Reisschema",
        description: "Bekijk geplande activiteiten per dag.",
        icon: CalendarClock,
        href: currentTrip ? `/trips/${currentTrip.id}/schedule` : undefined,
        accentClassName: "bg-pink-50 text-pink-600",
      },
      {
        title: "Ideeën / Activiteiten",
        description: "Plekken, activiteiten, links en notities.",
        icon: Lightbulb,
        href: currentTrip ? `/trips/${currentTrip.id}/ideas` : undefined,
        accentClassName: "bg-cyan-50 text-cyan-700",
      },
      {
        title: "Taal",
        description: currentTrip?.languageName
          ? `Handige ${currentTrip.languageName.toLocaleLowerCase("nl-NL")}e zinnen.`
          : "Handige zinnen voor onderweg.",
        icon: Languages,
        href: currentTrip ? `/trips/${currentTrip.id}/language` : undefined,
        accentClassName: "bg-lime-50 text-lime-700",
      },
      {
        title: "Documenten",
        description: "Bewaar links, boekingen en belangrijke reisinfo.",
        icon: FileText,
        href: currentTrip ? `/trips/${currentTrip.id}/documents` : undefined,
        accentClassName: "bg-lime-50 text-lime-700",
      },
      {
        title: "Taken",
        description: "Houd bij wat nog geregeld moet worden.",
        icon: ListTodo,
        href: currentTrip ? `/trips/${currentTrip.id}/tasks` : undefined,
        accentClassName: "bg-pink-50 text-pink-600",
      },
      {
        title: "Inpaklijst",
        description: "Vink je persoonlijke inpaklijst af.",
        icon: Backpack,
        href: currentTrip
          ? `/trips/${currentTrip.id}/inpaklijst`
          : undefined,
        accentClassName: "bg-cyan-50 text-cyan-700",
      },
      {
        title: "Leden",
        description: "Beheer wie mee kan kijken en plannen.",
        icon: Users,
        href: currentTrip ? `/trips/${currentTrip.id}/members` : undefined,
        accentClassName: "bg-slate-100 text-slate-700",
      },
    ],
    [currentTrip]
  );

  if (isLoading) {
    return (
      <section className="rounded-xl border border-cyan-100 bg-white/85 px-5 py-12 text-center shadow-[0_18px_45px_rgba(14,165,233,0.10)]">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
          <Route className="size-5" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-slate-950">Reis laden</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          We halen deze reis op uit Firestore.
        </p>
      </section>
    );
  }

  if (errorMessage) {
    return <TripErrorState message={errorMessage} />;
  }

  if (!currentTrip) {
    return <TripNotFoundState />;
  }

  const activeTrip = currentTrip;
  const status = getTripStatus(activeTrip);
  const dayCount = getTripDayCount(activeTrip);
  const memberCount = activeTrip.memberCount ?? activeTrip.memberIds.length;

  function openEditDialog() {
    setTitle(activeTrip.title);
    setDestination(activeTrip.destination);
    setDescription(activeTrip.description ?? "");
    setStartDate(activeTrip.startDate);
    setEndDate(activeTrip.endDate);
    setLanguageValues(getLanguageValuesFromTrip(activeTrip));
    setErrors({});
    setSaveErrorMessage(null);
    setIsEditDialogOpen(true);
  }

  function closeEditDialog() {
    setIsEditDialogOpen(false);
    setErrors({});
    setSaveErrorMessage(null);
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDestination = destination.trim();
    const nextErrors: TripFormErrors = {};

    if (!trimmedTitle) {
      nextErrors.title = "Vul een titel in voor je reis.";
    }

    if (!trimmedDestination) {
      nextErrors.destination = "Vul een bestemming in.";
    }

    if (!startDate) {
      nextErrors.startDate = "Kies een startdatum.";
    }

    if (!endDate) {
      nextErrors.endDate = "Kies een einddatum.";
    } else if (startDate && endDate < startDate) {
      nextErrors.endDate = "De einddatum mag niet vóór de startdatum liggen.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    setSaveErrorMessage(null);

    try {
      await updateTrip(activeTrip.id, {
        title: trimmedTitle,
        destination: trimmedDestination,
        description: description.trim() || undefined,
        startDate,
        endDate,
        countryCode: optionalText(languageValues.countryCode),
        languageCode: optionalText(languageValues.languageCode),
        languageName: optionalText(languageValues.languageName),
        nativeLanguageName: optionalText(languageValues.nativeLanguageName),
      });

      setEditedTrip({
        ...activeTrip,
        title: trimmedTitle,
        destination: trimmedDestination,
        description: description.trim() || undefined,
        startDate,
        endDate,
        countryCode: optionalText(languageValues.countryCode),
        languageCode: optionalText(languageValues.languageCode),
        languageName: optionalText(languageValues.languageName),
        nativeLanguageName: optionalText(languageValues.nativeLanguageName),
        updatedAt: new Date(),
      });
      closeEditDialog();
    } catch (error) {
      console.error("Reis bewerken mislukt", error);
      setSaveErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={activeTrip.title}
        description={activeTrip.description}
        backHref="/trips"
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {canEditTrip ? (
              <Button
                type="button"
                variant="outline"
                className="w-full border-cyan-100 bg-white sm:w-auto"
                onClick={openEditDialog}
              >
                <Pencil className="size-4" aria-hidden="true" />
                Reis bewerken
              </Button>
            ) : null}
            <Button
              asChild
              className="w-full bg-slate-950 text-white shadow-[0_0_24px_rgba(236,72,153,0.24)] hover:bg-slate-800 sm:w-auto"
            >
              <Link href={`/trips/${activeTrip.id}/ideas`}>
                <Lightbulb className="size-4" aria-hidden="true" />
                Naar Ideeën / Activiteiten
              </Link>
            </Button>
          </div>
        }
      />

      <section className="rounded-xl border border-cyan-100 bg-white/95 p-4 shadow-[0_18px_45px_rgba(14,165,233,0.10)] sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className={statusBadgeClasses[status]}>
              {getTripStatusLabel(status)}
            </Badge>
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Reisoverzicht
              </h2>
              {activeTrip.description ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {activeTrip.description}
                </p>
              ) : null}
            </div>
          </div>
          <div className="rounded-xl border border-lime-100 bg-lime-50 px-4 py-3 text-sm text-lime-800">
            <span className="block text-2xl font-semibold">{dayCount}</span>
            {dayCount === 1 ? "dag" : "dagen"}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard
          title="Bestemming"
          value={activeTrip.destination}
          icon={MapPin}
          iconClassName="text-pink-500"
        />
        <InfoCard
          title="Periode"
          value={formatTripPeriod(activeTrip)}
          icon={CalendarDays}
          iconClassName="text-cyan-600"
        />
        <InfoCard
          title="Groep"
          value={`${memberCount} ${memberCount === 1 ? "lid" : "leden"}`}
          icon={Users}
          iconClassName="text-lime-600"
        />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Snelle acties</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Open de onderdelen van deze reis. Sommige tegels zijn alvast
            gereserveerd voor later.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <QuickActionCard key={action.title} action={action} />
          ))}
        </div>
      </section>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => !open && closeEditDialog()}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-cyan-100 bg-white shadow-[0_22px_70px_rgba(14,165,233,0.18)] sm:max-w-xl">
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 shadow-[0_0_22px_rgba(34,211,238,0.18)]">
              <Pencil className="size-5" aria-hidden="true" />
            </div>
            <DialogTitle>Reis bewerken</DialogTitle>
            <DialogDescription>
              Pas de basisgegevens van deze reis aan. De reis-id blijft hetzelfde.
            </DialogDescription>
          </DialogHeader>
          {saveErrorMessage ? (
            <InlineErrorMessage message={saveErrorMessage} />
          ) : null}

          <form className="space-y-4" noValidate onSubmit={handleEditSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="edit-trip-title">Titel</Label>
              <Input
                id="edit-trip-title"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setErrors((currentErrors) => ({
                    ...currentErrors,
                    title: undefined,
                  }));
                }}
                required
                aria-invalid={Boolean(errors.title)}
              />
              {errors.title ? (
                <p className="text-sm font-medium text-pink-700">
                  {errors.title}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-trip-destination">Bestemming</Label>
              <Input
                id="edit-trip-destination"
                value={destination}
                onChange={(event) => {
                  setDestination(event.target.value);
                  setErrors((currentErrors) => ({
                    ...currentErrors,
                    destination: undefined,
                  }));
                }}
                required
                aria-invalid={Boolean(errors.destination)}
              />
              {errors.destination ? (
                <p className="text-sm font-medium text-pink-700">
                  {errors.destination}
                </p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-trip-start-date">Startdatum</Label>
                <Input
                  id="edit-trip-start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    const nextStartDate = event.target.value;
                    setStartDate(nextStartDate);
                    setErrors((currentErrors) => ({
                      ...currentErrors,
                      startDate: undefined,
                      endDate:
                        endDate && nextStartDate && endDate < nextStartDate
                          ? undefined
                          : currentErrors.endDate,
                    }));

                    if (endDate && nextStartDate && endDate < nextStartDate) {
                      setEndDate(nextStartDate);
                    }
                  }}
                  required
                  aria-invalid={Boolean(errors.startDate)}
                />
                {errors.startDate ? (
                  <p className="text-sm font-medium text-pink-700">
                    {errors.startDate}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-trip-end-date">Einddatum</Label>
                <Input
                  id="edit-trip-end-date"
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(event) => {
                    setEndDate(event.target.value);
                    setErrors((currentErrors) => ({
                      ...currentErrors,
                      endDate: undefined,
                    }));
                  }}
                  required
                  aria-invalid={Boolean(errors.endDate)}
                />
                {errors.endDate ? (
                  <p className="text-sm font-medium text-pink-700">
                    {errors.endDate}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-trip-description">Korte omschrijving</Label>
              <Textarea
                id="edit-trip-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <TripLanguageFields
              values={languageValues}
              onChange={setLanguageValues}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={isSaving}
                onClick={closeEditDialog}
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full bg-slate-950 text-white hover:bg-slate-800 sm:w-auto"
              >
                {isSaving ? "Opslaan..." : "Opslaan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type InfoCardProps = {
  title: string;
  value: string;
  icon: typeof MapPin;
  iconClassName: string;
};

function InfoCard({ title, value, icon: Icon, iconClassName }: InfoCardProps) {
  return (
    <Card className="border-cyan-100 bg-white/95 shadow-[0_14px_35px_rgba(14,165,233,0.10)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`size-4 ${iconClassName}`} aria-hidden="true" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-6 text-slate-600">
        {value}
      </CardContent>
    </Card>
  );
}

type QuickActionCardProps = {
  action: QuickAction;
};

function QuickActionCard({ action }: QuickActionCardProps) {
  const Icon = action.icon;
  const content = (
    <>
      <div
        className={`mb-4 flex size-11 items-center justify-center rounded-xl ${action.accentClassName}`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-950">
            {action.title}
          </h3>
          {!action.href ? (
            <Badge
              variant="outline"
              className="border-pink-100 bg-pink-50 text-pink-700"
            >
              Binnenkort
            </Badge>
          ) : null}
        </div>
        <p className="text-sm leading-6 text-slate-600">{action.description}</p>
      </div>
    </>
  );

  if (action.href) {
    return (
      <Link
        href={action.href}
        className="rounded-xl border border-cyan-100 bg-white/95 p-4 shadow-[0_14px_35px_rgba(14,165,233,0.10)] transition hover:shadow-[0_18px_45px_rgba(34,211,238,0.14)]"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-cyan-100 bg-white/75 p-4 opacity-80 shadow-[0_12px_30px_rgba(14,165,233,0.06)]">
      {content}
    </div>
  );
}

type InlineErrorMessageProps = {
  message: string;
};

function InlineErrorMessage({ message }: InlineErrorMessageProps) {
  return (
    <div className="rounded-xl border border-pink-100 bg-pink-50 px-4 py-3 text-sm leading-6 text-pink-800">
      {message}
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (isFirebasePermissionError(error)) {
    return "Je hebt geen rechten om deze reis aan te passen.";
  }

  return error instanceof Error
    ? error.message
    : "Er ging iets mis. Probeer het opnieuw.";
}

function isFirebasePermissionError(error: unknown) {
  return isRecord(error) && error.code === "permission-denied";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

type TripErrorStateProps = {
  message: string;
};

function TripErrorState({ message }: TripErrorStateProps) {
  return (
    <section className="rounded-xl border border-dashed border-cyan-200 bg-white/85 px-5 py-12 text-center shadow-[0_18px_45px_rgba(14,165,233,0.10)]">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-pink-50 text-pink-600">
        <Route className="size-5" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-semibold text-slate-950">
        Reis laden lukt niet
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        {message}
      </p>
      <Button
        asChild
        className="mt-6 bg-slate-950 text-white hover:bg-slate-800"
      >
        <Link href="/trips">Terug naar reizen</Link>
      </Button>
    </section>
  );
}

function TripNotFoundState() {
  return (
    <section className="rounded-xl border border-dashed border-cyan-200 bg-white/85 px-5 py-12 text-center shadow-[0_18px_45px_rgba(14,165,233,0.10)]">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
        <Route className="size-5" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-semibold text-slate-950">
        Reis niet gevonden
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        Deze reis staat niet in Firestore of je hebt geen toegang.
      </p>
      <Button
        asChild
        className="mt-6 bg-slate-950 text-white hover:bg-slate-800"
      >
        <Link href="/trips">Terug naar reizen</Link>
      </Button>
    </section>
  );
}
