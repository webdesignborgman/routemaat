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
