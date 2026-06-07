import type { TripRole as MemberTripRole } from "@/features/members/memberTypes";

export type {
  TripMember,
  TripRole,
} from "@/features/members/memberTypes";
export { tripRoleLabels } from "@/features/members/memberTypes";

export type Trip = {
  id: string;
  title: string;
  destination: string;
  description?: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  memberIds: string[];
  memberCount?: number;
  countryCode?: string;
  languageCode?: string;
  languageName?: string;
  nativeLanguageName?: string;
  currentUserRole?: MemberTripRole;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTripInput = {
  title: string;
  destination: string;
  description?: string;
  startDate: string;
  endDate: string;
  countryCode?: string;
  languageCode?: string;
  languageName?: string;
  nativeLanguageName?: string;
};

export type UpdateTripInput = Partial<CreateTripInput>;
