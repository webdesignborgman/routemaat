export type TripRole = "owner" | "admin" | "editor" | "viewer";

export const tripRoleLabels: Record<TripRole, string> = {
  owner: "Eigenaar",
  admin: "Beheerder",
  editor: "Bewerker",
  viewer: "Kijker",
};

export type TripMember = {
  userId: string;
  role: TripRole;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  joinedAt: Date;
};

export type TripInviteStatus = "pending" | "accepted";

export type TripInvite = {
  id: string;
  tripId: string;
  email: string;
  role: TripRole;
  status: TripInviteStatus;
  invitedBy: string;
  createdAt: Date;
  acceptedAt?: Date;
};
