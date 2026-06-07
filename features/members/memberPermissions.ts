import type { TripRole } from "@/features/members/memberTypes";

export function canManageMembers(role: TripRole | null | undefined) {
  return role === "owner" || role === "admin";
}

export function canEditTripContent(role: TripRole | null | undefined) {
  return role === "owner" || role === "admin" || role === "editor";
}

export function canViewTrip(role: TripRole | null | undefined) {
  return Boolean(role);
}
