"use client";

import {
  createContext,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged } from "firebase/auth";

import {
  signInWithGoogle as signInWithGoogleService,
  signOutUser as signOutUserService,
} from "@/features/auth/authService";
import type { AuthContextValue, AuthUser } from "@/features/auth/authTypes";
import {
  acceptPendingInvitesForUser,
  upsertUserProfile,
} from "@/features/members/memberService";
import { auth } from "@/lib/firebase";

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(Boolean(auth));

  useEffect(() => {
    if (!auth) {
      return;
    }

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);

      if (nextUser) {
        void syncSignedInUser(nextUser);
      }
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      signInWithGoogle: signInWithGoogleService,
      signOutUser: signOutUserService,
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function syncSignedInUser(user: AuthUser) {
  try {
    await upsertUserProfile(user);
  } catch (error) {
    console.error("Gebruiker bijwerken mislukt", error);
    return;
  }

  try {
    await acceptPendingInvitesForUser(user);
  } catch (error) {
    console.error("Uitnodigingen accepteren mislukt", error);
  }
}
