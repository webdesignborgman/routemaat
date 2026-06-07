import type { TripIdea } from "@/features/ideas/ideaTypes";
import type { Trip } from "@/features/trips/tripTypes";
import {
  addDays,
  dateStringToLocalDate,
  dateToDateString,
  formatDutchDate,
} from "@/lib/dateUtils";

export type TripScheduleDay = {
  date: string;
  dayNumber: number;
  ideas: TripIdea[];
};

function normalizeTime(time: string) {
  const [hours = "", minutes = ""] = time.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

export function formatScheduleDate(dateString: string) {
  return formatDutchDate(dateString);
}

export function formatScheduleTime(idea: TripIdea) {
  if (!idea.startTime) {
    return "";
  }

  const startTime = normalizeTime(idea.startTime);
  return idea.endTime
    ? `${startTime} - ${normalizeTime(idea.endTime)}`
    : startTime;
}

export function formatScheduleDateTime(idea: TripIdea) {
  if (!idea.scheduleDate) {
    return formatScheduleTime(idea);
  }

  const time = formatScheduleTime(idea);
  return time
    ? `${formatScheduleDate(idea.scheduleDate)} · ${time}`
    : formatScheduleDate(idea.scheduleDate);
}

export function getScheduledIdeas(ideas: TripIdea[]) {
  return ideas
    .filter(
      (idea) =>
        idea.showInSchedule &&
        Boolean(idea.scheduleDate) &&
        Boolean(idea.startTime)
    )
    .sort((firstIdea, secondIdea) => {
      const firstDate = firstIdea.scheduleDate ?? "";
      const secondDate = secondIdea.scheduleDate ?? "";
      const dateOrder =
        dateStringToLocalDate(firstDate).getTime() -
        dateStringToLocalDate(secondDate).getTime();

      if (dateOrder !== 0) {
        return dateOrder;
      }

      return normalizeTime(firstIdea.startTime ?? "").localeCompare(
        normalizeTime(secondIdea.startTime ?? "")
      );
    });
}

export function groupScheduledIdeasByDate(ideas: TripIdea[]) {
  const groupedIdeas = new Map<string, TripIdea[]>();

  for (const idea of getScheduledIdeas(ideas)) {
    if (!idea.scheduleDate) {
      continue;
    }

    groupedIdeas.set(idea.scheduleDate, [
      ...(groupedIdeas.get(idea.scheduleDate) ?? []),
      idea,
    ]);
  }

  return Array.from(groupedIdeas.entries())
    .sort(
      ([firstDate], [secondDate]) =>
        dateStringToLocalDate(firstDate).getTime() -
        dateStringToLocalDate(secondDate).getTime()
    )
    .map(([date, scheduledIdeas]) => ({
      date,
      ideas: scheduledIdeas,
    }));
}

export function getTripScheduleDays(
  trip: Trip,
  ideas: TripIdea[]
): TripScheduleDay[] {
  const scheduledIdeasByDate = new Map<string, TripIdea[]>();

  for (const idea of getScheduledIdeas(ideas)) {
    if (!idea.scheduleDate) {
      continue;
    }

    scheduledIdeasByDate.set(idea.scheduleDate, [
      ...(scheduledIdeasByDate.get(idea.scheduleDate) ?? []),
      idea,
    ]);
  }

  const startDate = dateStringToLocalDate(trip.startDate);
  const endDate = dateStringToLocalDate(trip.endDate);
  const days: TripScheduleDay[] = [];

  for (
    let currentDate = startDate;
    currentDate.getTime() <= endDate.getTime();
    currentDate = addDays(currentDate, 1)
  ) {
    const date = dateToDateString(currentDate);

    days.push({
      date,
      dayNumber: getTripDayNumber(trip, date),
      ideas: scheduledIdeasByDate.get(date) ?? [],
    });
  }

  return days;
}

export function getTripDayNumber(trip: Trip, dateString: string) {
  const tripStartDate = dateStringToLocalDate(trip.startDate);
  const activityDate = dateStringToLocalDate(dateString);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const differenceInDays = Math.round(
    (activityDate.getTime() - tripStartDate.getTime()) / millisecondsPerDay
  );

  return Math.max(differenceInDays + 1, 1);
}

export function formatScheduleDayHeading(trip: Trip, dateString: string) {
  return `Dag ${getTripDayNumber(trip, dateString)} · ${formatScheduleDate(
    dateString
  )}`;
}
