export type TripRole = "owner" | "admin" | "editor" | "viewer";

export const tripRoleLabels: Record<TripRole, string> = {
  owner: "Eigenaar",
  admin: "Beheerder",
  editor: "Bewerker",
  viewer: "Kijker",
};

export type Trip = {
  id: string;
  title: string;
  destination: string;
  description?: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  memberIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type TripMember = {
  userId: string;
  role: TripRole;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  joinedAt: Date;
};

export type CreateTripInput = {
  title: string;
  destination: string;
  description?: string;
  startDate: string;
  endDate: string;
};

export type UpdateTripInput = Partial<CreateTripInput>;
