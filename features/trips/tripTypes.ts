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
