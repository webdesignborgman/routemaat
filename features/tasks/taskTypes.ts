export type TripTaskStatus = "open" | "in_progress" | "done";

export type TripTaskPriority = "low" | "medium" | "high";

export type TripTaskCategory =
  | "general"
  | "booking"
  | "documents"
  | "transport"
  | "money"
  | "health"
  | "packing"
  | "tickets"
  | "food"
  | "other";

export type TripTask = {
  id: string;
  tripId: string;
  title: string;
  description?: string;
  status: TripTaskStatus;
  priority: TripTaskPriority;
  category: TripTaskCategory;
  assignedToUserId?: string;
  assignedToDisplayName?: string;
  dueDate?: string;
  completedAt?: Date;
  completedBy?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTripTaskInput = {
  title: string;
  description?: string;
  status: TripTaskStatus;
  priority: TripTaskPriority;
  category: TripTaskCategory;
  assignedToUserId?: string;
  assignedToDisplayName?: string;
  dueDate?: string;
};

export type UpdateTripTaskInput = Partial<CreateTripTaskInput> & {
  completedAt?: Date | null;
  completedBy?: string | null;
};

export type TripTaskFilters = {
  query: string;
  status: TripTaskStatus | "all";
  category: TripTaskCategory | "all";
  priority: TripTaskPriority | "all";
  assignedToUserId: string | "all" | "unassigned";
};

export type TripTaskFormValues = {
  title: string;
  description: string;
  status: TripTaskStatus;
  priority: TripTaskPriority;
  category: TripTaskCategory;
  assignedToUserId: string;
  dueDate: string;
};
