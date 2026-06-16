"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ListTodo, Plus, Sparkles, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/useAuth";
import { canEditTripContent } from "@/features/members/memberPermissions";
import {
  getTripMember,
  listTripMembers,
} from "@/features/members/memberService";
import type { TripMember } from "@/features/members/memberTypes";
import { TaskCard } from "@/features/tasks/TaskCard";
import { TaskFilters } from "@/features/tasks/TaskFilters";
import { TaskForm } from "@/features/tasks/TaskForm";
import {
  createTaskForTrip,
  deleteTaskForTrip,
  listTasksForTrip,
  toggleTaskDone,
  updateTaskForTrip,
} from "@/features/tasks/taskService";
import type {
  CreateTripTaskInput,
  TripTask,
  TripTaskFilters,
  TripTaskFormValues,
  UpdateTripTaskInput,
} from "@/features/tasks/taskTypes";
import type { Trip } from "@/features/trips/tripTypes";

type TasksPageClientProps = {
  trip: Trip;
};

const defaultFilters: TripTaskFilters = {
  query: "",
  status: "all",
  category: "all",
  priority: "all",
  assignedToUserId: "all",
};

const statusSortValues: Record<TripTask["status"], number> = {
  open: 0,
  in_progress: 1,
  done: 2,
};

const prioritySortValues: Record<TripTask["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase("nl-NL");
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function getMemberDisplayName(member: TripMember) {
  return member.displayName ?? member.email ?? "Onbekend";
}

function taskInputFromForm(
  values: TripTaskFormValues,
  members: TripMember[]
): CreateTripTaskInput {
  const assignedMember = members.find(
    (member) => member.userId === values.assignedToUserId
  );

  return {
    title: values.title.trim(),
    description: optionalText(values.description),
    status: values.status,
    priority: values.priority,
    category: values.category,
    assignedToUserId: assignedMember?.userId,
    assignedToDisplayName: assignedMember
      ? getMemberDisplayName(assignedMember)
      : undefined,
    dueDate: optionalText(values.dueDate),
  };
}

function taskUpdateInputFromForm(
  values: TripTaskFormValues,
  members: TripMember[],
  task: TripTask,
  userId: string
): UpdateTripTaskInput {
  const input: UpdateTripTaskInput = taskInputFromForm(values, members);

  if (values.status === "done" && task.status !== "done") {
    input.completedAt = new Date();
    input.completedBy = userId;
  }

  if (values.status !== "done" && task.status === "done") {
    input.completedAt = null;
    input.completedBy = null;
  }

  return input;
}

function matchesFilters(task: TripTask, filters: TripTaskFilters) {
  const query = normalizeSearchValue(filters.query);
  const searchableText = [
    task.title,
    task.description,
    task.assignedToDisplayName,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLocaleLowerCase("nl-NL");

  const matchesQuery = query.length === 0 || searchableText.includes(query);
  const matchesStatus = filters.status === "all" || task.status === filters.status;
  const matchesCategory =
    filters.category === "all" || task.category === filters.category;
  const matchesPriority =
    filters.priority === "all" || task.priority === filters.priority;
  const matchesAssignee =
    filters.assignedToUserId === "all" ||
    (filters.assignedToUserId === "unassigned" && !task.assignedToUserId) ||
    task.assignedToUserId === filters.assignedToUserId;

  return (
    matchesQuery &&
    matchesStatus &&
    matchesCategory &&
    matchesPriority &&
    matchesAssignee
  );
}

function sortTasks(tasks: TripTask[]) {
  return [...tasks].sort((firstTask, secondTask) => {
    const statusCompare =
      statusSortValues[firstTask.status] - statusSortValues[secondTask.status];

    if (statusCompare !== 0) {
      return statusCompare;
    }

    const priorityCompare =
      prioritySortValues[firstTask.priority] -
      prioritySortValues[secondTask.priority];

    if (priorityCompare !== 0) {
      return priorityCompare;
    }

    if (firstTask.dueDate && secondTask.dueDate) {
      const dueDateCompare = firstTask.dueDate.localeCompare(secondTask.dueDate);

      if (dueDateCompare !== 0) {
        return dueDateCompare;
      }
    } else if (firstTask.dueDate || secondTask.dueDate) {
      return firstTask.dueDate ? -1 : 1;
    }

    return (
      secondTask.updatedAt.getTime() - firstTask.updatedAt.getTime() ||
      secondTask.createdAt.getTime() - firstTask.createdAt.getTime()
    );
  });
}

export function TasksPageClient({ trip }: TasksPageClientProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TripTask[]>([]);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [currentMember, setCurrentMember] = useState<TripMember | null>(null);
  const [filters, setFilters] = useState<TripTaskFilters>(defaultFilters);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingTask, setEditingTask] = useState<TripTask>();
  const [taskToDelete, setTaskToDelete] = useState<TripTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<
    string | null
  >(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const canEditTasks = canEditTripContent(currentMember?.role);

  useEffect(() => {
    let isCancelled = false;

    async function loadTasks() {
      setIsLoading(true);
      setLoadErrorMessage(null);

      try {
        const [loadedTasks, loadedMembers, loadedMember] = await Promise.all([
          listTasksForTrip(trip.id),
          listTripMembers(trip.id),
          user ? getTripMember(trip.id, user.uid) : Promise.resolve(null),
        ]);

        if (!isCancelled) {
          setTasks(loadedTasks);
          setMembers(loadedMembers);
          setCurrentMember(loadedMember);
        }
      } catch (error) {
        console.error("Taken laden mislukt", error);

        if (!isCancelled) {
          setLoadErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadTasks();

    return () => {
      isCancelled = true;
    };
  }, [trip.id, user]);

  async function refreshTasks() {
    setTasks(await listTasksForTrip(trip.id));
  }

  const sortedTasks = useMemo(() => sortTasks(tasks), [tasks]);
  const filteredTasks = useMemo(
    () => sortedTasks.filter((task) => matchesFilters(task, filters)),
    [filters, sortedTasks]
  );
  const openTaskCount = tasks.filter((task) => task.status !== "done").length;
  const doneTaskCount = tasks.filter((task) => task.status === "done").length;
  const donePercentage =
    tasks.length > 0 ? Math.round((doneTaskCount / tasks.length) * 100) : 0;
  const hasActiveFilters =
    filters.query.trim().length > 0 ||
    filters.status !== "all" ||
    filters.category !== "all" ||
    filters.priority !== "all" ||
    filters.assignedToUserId !== "all";

  function openCreateDialog() {
    if (!canEditTasks) {
      setMutationErrorMessage("Je hebt alleen kijkrechten voor deze reis.");
      return;
    }

    setEditingTask(undefined);
    setMutationErrorMessage(null);
    setStatusMessage(null);
    setDialogMode("create");
  }

  function openEditDialog(task: TripTask) {
    if (!canEditTasks) {
      setMutationErrorMessage("Je hebt alleen kijkrechten voor deze reis.");
      return;
    }

    setEditingTask(task);
    setMutationErrorMessage(null);
    setStatusMessage(null);
    setDialogMode("edit");
  }

  function closeDialog() {
    setDialogMode(null);
    setEditingTask(undefined);
    setMutationErrorMessage(null);
  }

  async function handleSubmit(values: TripTaskFormValues) {
    if (!canEditTasks) {
      setMutationErrorMessage("Je hebt alleen kijkrechten voor deze reis.");
      return;
    }

    if (!user) {
      setMutationErrorMessage("Log opnieuw in om deze taak op te slaan.");
      return;
    }

    setIsSaving(true);
    setMutationErrorMessage(null);
    setStatusMessage(null);

    try {
      if (dialogMode === "edit" && editingTask) {
        await updateTaskForTrip(
          trip.id,
          editingTask.id,
          taskUpdateInputFromForm(values, members, editingTask, user.uid)
        );
      } else {
        await createTaskForTrip(
          trip.id,
          taskInputFromForm(values, members),
          user.uid
        );
      }

      await refreshTasks();
      closeDialog();
      setStatusMessage(
        dialogMode === "edit" ? "Taak opgeslagen." : "Taak toegevoegd."
      );
    } catch (error) {
      console.error("Taak opslaan mislukt", error);
      setMutationErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleDone(task: TripTask) {
    if (!canEditTasks) {
      setMutationErrorMessage("Je hebt alleen kijkrechten voor deze reis.");
      return;
    }

    if (!user) {
      setMutationErrorMessage("Log opnieuw in om deze taak af te vinken.");
      return;
    }

    setIsSaving(true);
    setMutationErrorMessage(null);
    setStatusMessage(null);

    try {
      await toggleTaskDone(trip.id, task.id, task.status !== "done", user.uid);
      await refreshTasks();
      setStatusMessage(
        task.status === "done" ? "Taak opnieuw geopend." : "Taak afgevinkt."
      );
    } catch (error) {
      console.error("Taak afvinken mislukt", error);
      setMutationErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  function handleDelete(task: TripTask) {
    if (!canEditTasks) {
      setMutationErrorMessage("Je hebt alleen kijkrechten voor deze reis.");
      return;
    }

    setMutationErrorMessage(null);
    setStatusMessage(null);
    setTaskToDelete(task);
  }

  async function confirmDelete() {
    if (!taskToDelete || !canEditTasks) {
      return;
    }

    setIsSaving(true);
    setMutationErrorMessage(null);
    setStatusMessage(null);

    try {
      await deleteTaskForTrip(trip.id, taskToDelete.id);
      await refreshTasks();
      setTaskToDelete(null);
      setStatusMessage("Taak verwijderd.");
    } catch (error) {
      console.error("Taak verwijderen mislukt", error);
      setMutationErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  function retryLoading() {
    setIsLoading(true);
    setLoadErrorMessage(null);
    Promise.all([
      listTasksForTrip(trip.id),
      listTripMembers(trip.id),
      user ? getTripMember(trip.id, user.uid) : Promise.resolve(null),
    ])
      .then(([loadedTasks, loadedMembers, loadedMember]) => {
        setTasks(loadedTasks);
        setMembers(loadedMembers);
        setCurrentMember(loadedMember);
      })
      .catch((error) => setLoadErrorMessage(getErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Taken"
        description={`Houd bij wat nog geregeld moet worden voor ${trip.title}.`}
        backHref={`/trips/${trip.id}`}
        action={
          canEditTasks ? (
            <Button
              type="button"
              onClick={openCreateDialog}
              disabled={isSaving}
              className="w-full bg-slate-950 text-white shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:bg-slate-800 sm:w-auto"
            >
              <Plus className="size-4" aria-hidden="true" />
              Taak toevoegen
            </Button>
          ) : undefined
        }
      />

      {mutationErrorMessage ? (
        <InlineErrorMessage message={mutationErrorMessage} />
      ) : null}
      {statusMessage ? <InlineSuccessMessage message={statusMessage} /> : null}

      {loadErrorMessage ? (
        <StatusState
          title="Taken laden lukt niet"
          description={loadErrorMessage}
          actionLabel="Opnieuw proberen"
          onAction={retryLoading}
        />
      ) : isLoading ? (
        <StatusState
          title="Taken laden"
          description="We halen de taken en reisleden op uit Firestore."
        />
      ) : (
        <>
          <section className="rounded-xl border border-lime-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(132,204,22,0.08)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lime-50 text-lime-700">
                  <ListTodo className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-950">
                    {doneTaskCount} van {tasks.length} taken klaar
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {openTaskCount === 0
                      ? "Alles staat op klaar. Lekker overzichtelijk."
                      : `${openTaskCount} ${
                          openTaskCount === 1 ? "taak staat" : "taken staan"
                        } nog open.`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-lime-800">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                {donePercentage}%
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-lime-50">
              <div
                className="h-full rounded-full bg-lime-400 transition-all"
                style={{ width: `${donePercentage}%` }}
              />
            </div>
          </section>

          <TaskFilters
            filters={filters}
            members={members}
            onChange={setFilters}
          />

          {tasks.length > 0 ? (
            <div className="rounded-xl border border-cyan-100 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-[0_10px_24px_rgba(14,165,233,0.06)]">
              {filteredTasks.length} van {tasks.length} taken zichtbaar
            </div>
          ) : null}

          {tasks.length === 0 ? (
            <StatusState
              title="Geen taken gevonden"
              description={
                canEditTasks
                  ? "Voeg de eerste taak toe voor deze reis."
                  : "Er staan nog geen taken voor deze reis."
              }
              actionLabel={canEditTasks ? "Taak toevoegen" : undefined}
              onAction={canEditTasks ? openCreateDialog : undefined}
            />
          ) : filteredTasks.length === 0 ? (
            <StatusState
              title="Geen resultaten"
              description="Pas je zoekterm of filters aan om weer taken te zien."
              actionLabel={hasActiveFilters ? "Filters wissen" : undefined}
              onAction={
                hasActiveFilters ? () => setFilters(defaultFilters) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  canEdit={canEditTasks && !isSaving}
                  onToggleDone={handleToggleDone}
                  onEdit={canEditTasks ? openEditDialog : undefined}
                  onDelete={canEditTasks ? handleDelete : undefined}
                />
              ))}
            </div>
          )}
        </>
      )}

      <Dialog
        open={dialogMode !== null}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-cyan-100 bg-white shadow-[0_22px_70px_rgba(14,165,233,0.18)] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "edit" ? "Taak bewerken" : "Taak toevoegen"}
            </DialogTitle>
            <DialogDescription>
              Leg vast wat er nog geregeld moet worden en wie ermee bezig is.
            </DialogDescription>
          </DialogHeader>
          {mutationErrorMessage ? (
            <InlineErrorMessage message={mutationErrorMessage} />
          ) : null}
          <TaskForm
            key={editingTask?.id ?? "new-task"}
            task={editingTask}
            members={members}
            isSubmitting={isSaving}
            onSubmit={handleSubmit}
            onCancel={closeDialog}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={taskToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTaskToDelete(null);
            setMutationErrorMessage(null);
          }
        }}
      >
        <DialogContent className="border-cyan-100 bg-white shadow-[0_22px_70px_rgba(236,72,153,0.14)] sm:max-w-md">
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-pink-50 text-pink-700">
              <Trash2 className="size-5" aria-hidden="true" />
            </div>
            <DialogTitle>Taak verwijderen?</DialogTitle>
            <DialogDescription>
              {taskToDelete
                ? `"${taskToDelete.title}" wordt uit deze reis verwijderd.`
                : "Deze taak wordt uit deze reis verwijderd."}
            </DialogDescription>
          </DialogHeader>
          {mutationErrorMessage ? (
            <InlineErrorMessage message={mutationErrorMessage} />
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isSaving}
              onClick={() => {
                setTaskToDelete(null);
                setMutationErrorMessage(null);
              }}
            >
              Annuleren
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              disabled={isSaving}
              onClick={confirmDelete}
            >
              {isSaving ? "Verwijderen..." : "Verwijderen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (isFirebasePermissionError(error)) {
    return "Je hebt geen rechten om taken te bekijken of aan te passen.";
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

function InlineSuccessMessage({ message }: InlineErrorMessageProps) {
  return (
    <div className="rounded-xl border border-lime-100 bg-lime-50 px-4 py-3 text-sm leading-6 text-lime-800">
      {message}
    </div>
  );
}

type StatusStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

function StatusState({
  title,
  description,
  actionLabel,
  onAction,
}: StatusStateProps) {
  return (
    <section className="rounded-xl border border-dashed border-cyan-200 bg-white/80 px-5 py-10 text-center shadow-[0_12px_30px_rgba(14,165,233,0.08)]">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
        <Sparkles className="size-5" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        {description}
      </p>
      {actionLabel && onAction ? (
        <Button
          type="button"
          onClick={onAction}
          className="mt-5 bg-slate-950 text-white hover:bg-slate-800"
        >
          {actionLabel}
        </Button>
      ) : null}
    </section>
  );
}
