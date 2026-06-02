import type { User } from "firebase/auth";

export type AuthUser = User;

export type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
};
