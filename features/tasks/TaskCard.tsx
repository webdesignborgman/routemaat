import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  UserRound,
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
  taskCategoryLabels,
  taskPriorityLabels,
  taskStatusLabels,
} from "@/features/tasks/taskLabels";
import type { TripTask } from "@/features/tasks/taskTypes";

type TaskCardProps = {
  task: TripTask;
  canEdit: boolean;
  onToggleDone?: (task: TripTask) => void;
  onEdit?: (task: TripTask) => void;
  onDelete?: (task: TripTask) => void;
};

const statusBadgeClasses: Record<TripTask["status"], string> = {
  open: "border-cyan-100 bg-cyan-50 text-cyan-800",
  in_progress: "border-pink-100 bg-pink-50 text-pink-700",
  done: "border-lime-100 bg-lime-50 text-lime-700",
};

const priorityBadgeClasses: Record<TripTask["priority"], string> = {
  low: "border-slate-200 bg-slate-50 text-slate-600",
  medium: "border-cyan-100 bg-white text-cyan-700",
  high: "border-pink-100 bg-pink-50 text-pink-700",
};

export function TaskCard({
  task,
  canEdit,
  onToggleDone,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const isDone = task.status === "done";
  const hasActions = canEdit && Boolean(onEdit || onDelete);
  const ToggleIcon = isDone ? CheckCircle2 : Circle;

  return (
    <Card
      className={`border-cyan-100 bg-white/95 shadow-[0_14px_35px_rgba(14,165,233,0.10)] transition-shadow hover:shadow-[0_18px_42px_rgba(236,72,153,0.12)] ${
        isDone ? "opacity-80" : ""
      }`}
    >
      <CardHeader className="gap-3 pb-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={statusBadgeClasses[task.status]}>
                {taskStatusLabels[task.status]}
              </Badge>
              <Badge
                variant="outline"
                className={priorityBadgeClasses[task.priority]}
              >
                {taskPriorityLabels[task.priority]}
              </Badge>
              <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100">
                {taskCategoryLabels[task.category]}
              </Badge>
            </div>
            <CardTitle
              className={`break-words text-xl text-slate-950 ${
                isDone ? "text-slate-500 line-through" : ""
              }`}
            >
              {task.title}
            </CardTitle>
          </div>

          {hasActions ? (
            <div className="flex shrink-0 gap-1">
              {onEdit ? (
                <Button
                  aria-label="Taak bewerken"
                  title="Taak bewerken"
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-slate-500 hover:text-cyan-700"
                  onClick={() => onEdit(task)}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </Button>
              ) : null}
              {onDelete ? (
                <Button
                  aria-label="Taak verwijderen"
                  title="Taak verwijderen"
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-slate-500 hover:text-pink-700"
                  onClick={() => onDelete(task)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
          {task.assignedToDisplayName ? (
            <p className="flex items-center gap-2">
              <UserRound className="size-4 text-cyan-600" aria-hidden="true" />
              {task.assignedToDisplayName}
            </p>
          ) : null}
          {task.dueDate ? (
            <p className="flex items-center gap-2">
              <CalendarClock
                className="size-4 text-pink-600"
                aria-hidden="true"
              />
              {formatDate(task.dueDate)}
            </p>
          ) : null}
        </div>

        {task.description ? (
          <p className="break-words text-sm leading-6 text-slate-600">
            {task.description}
          </p>
        ) : null}

        {isDone && task.completedAt ? (
          <p className="rounded-lg bg-lime-50 px-3 py-2 text-sm leading-6 text-lime-800">
            Klaar sinds {formatDateTime(task.completedAt)}
          </p>
        ) : null}

        <Button
          type="button"
          variant={isDone ? "outline" : "default"}
          className={
            isDone
              ? "w-full justify-start border-lime-100 bg-white text-lime-800 hover:bg-lime-50 sm:w-auto"
              : "w-full justify-start bg-slate-950 text-white hover:bg-slate-800 sm:w-auto"
          }
          disabled={!canEdit}
          onClick={() => onToggleDone?.(task)}
        >
          <ToggleIcon className="size-4" aria-hidden="true" />
          {isDone ? "Opnieuw openen" : "Markeer als klaar"}
        </Button>
      </CardContent>
    </Card>
  );
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

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}
