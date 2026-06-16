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
import type { TripMember } from "@/features/members/memberTypes";
import {
  taskCategories,
  taskCategoryLabels,
  taskPriorities,
  taskPriorityLabels,
  taskStatuses,
  taskStatusLabels,
} from "@/features/tasks/taskLabels";
import type {
  TripTask,
  TripTaskCategory,
  TripTaskFormValues,
  TripTaskPriority,
  TripTaskStatus,
} from "@/features/tasks/taskTypes";

type TaskFormProps = {
  task?: TripTask;
  members: TripMember[];
  isSubmitting?: boolean;
  onSubmit: (values: TripTaskFormValues) => void | Promise<void>;
  onCancel: () => void;
};

type TaskFormErrors = {
  title?: string;
  status?: string;
  priority?: string;
  category?: string;
  dueDate?: string;
};

function getInitialValues(task?: TripTask): TripTaskFormValues {
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? "open",
    priority: task?.priority ?? "medium",
    category: task?.category ?? "general",
    assignedToUserId: task?.assignedToUserId ?? "none",
    dueDate: task?.dueDate ?? "",
  };
}

export function TaskForm({
  task,
  members,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const initialValues = useMemo(() => getInitialValues(task), [task]);
  const [values, setValues] = useState<TripTaskFormValues>(initialValues);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const errors = getValidationErrors(values);

  function updateValue<Key extends keyof TripTaskFormValues>(
    key: Key,
    value: TripTaskFormValues[Key]
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));
  }

  async function handleSubmit() {
    setSubmitAttempted(true);

    if (Object.keys(errors).length > 0) {
      return;
    }

    await onSubmit(values);
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
          <Label htmlFor="task-title">Titel *</Label>
          <Input
            id="task-title"
            value={values.title}
            onChange={(event) => updateValue("title", event.target.value)}
            placeholder="Bijvoorbeeld: JR Pass controleren"
            required
            aria-invalid={submitAttempted && Boolean(errors.title)}
          />
          {submitAttempted && errors.title ? (
            <p className="text-sm font-medium text-pink-700">{errors.title}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-status">Status *</Label>
          <Select
            value={values.status}
            onValueChange={(value) =>
              updateValue("status", value as TripTaskStatus)
            }
          >
            <SelectTrigger
              id="task-status"
              className="w-full"
              aria-invalid={submitAttempted && Boolean(errors.status)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {taskStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {taskStatusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {submitAttempted && errors.status ? (
            <p className="text-sm font-medium text-pink-700">{errors.status}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-priority">Prioriteit *</Label>
          <Select
            value={values.priority}
            onValueChange={(value) =>
              updateValue("priority", value as TripTaskPriority)
            }
          >
            <SelectTrigger
              id="task-priority"
              className="w-full"
              aria-invalid={submitAttempted && Boolean(errors.priority)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {taskPriorities.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {taskPriorityLabels[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {submitAttempted && errors.priority ? (
            <p className="text-sm font-medium text-pink-700">
              {errors.priority}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-category">Categorie *</Label>
          <Select
            value={values.category}
            onValueChange={(value) =>
              updateValue("category", value as TripTaskCategory)
            }
          >
            <SelectTrigger
              id="task-category"
              className="w-full"
              aria-invalid={submitAttempted && Boolean(errors.category)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {taskCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {taskCategoryLabels[category]}
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
          <Label htmlFor="task-assignee">Toegewezen aan</Label>
          <Select
            value={values.assignedToUserId}
            onValueChange={(value) => updateValue("assignedToUserId", value)}
          >
            <SelectTrigger id="task-assignee" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Niemand specifiek</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.userId} value={member.userId}>
                  {getMemberDisplayName(member)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="task-due-date">Deadline / datum</Label>
          <Input
            id="task-due-date"
            type="date"
            value={values.dueDate}
            onChange={(event) => updateValue("dueDate", event.target.value)}
            aria-invalid={submitAttempted && Boolean(errors.dueDate)}
          />
          {submitAttempted && errors.dueDate ? (
            <p className="text-sm font-medium text-pink-700">
              {errors.dueDate}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="task-description">Omschrijving</Label>
          <Textarea
            id="task-description"
            value={values.description}
            onChange={(event) => updateValue("description", event.target.value)}
            placeholder="Wat moet er precies gebeuren?"
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

function getValidationErrors(values: TripTaskFormValues): TaskFormErrors {
  const errors: TaskFormErrors = {};

  if (values.title.trim().length === 0) {
    errors.title = "Vul een titel in.";
  }

  if (!taskStatuses.includes(values.status)) {
    errors.status = "Kies een geldige status.";
  }

  if (!taskPriorities.includes(values.priority)) {
    errors.priority = "Kies een geldige prioriteit.";
  }

  if (!taskCategories.includes(values.category)) {
    errors.category = "Kies een geldige categorie.";
  }

  if (values.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(values.dueDate)) {
    errors.dueDate = "Gebruik een geldige datum.";
  }

  return errors;
}

function getMemberDisplayName(member: TripMember) {
  return member.displayName ?? member.email ?? "Onbekend";
}
