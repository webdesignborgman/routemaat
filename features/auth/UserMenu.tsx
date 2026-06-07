"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, UserCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/useAuth";

function getUserLabel(displayName?: string | null, email?: string | null) {
  return displayName || email || "Ingelogde gebruiker";
}

export function UserMenu() {
  const router = useRouter();
  const { user, loading, signInWithGoogle, signOutUser } = useAuth();

  if (loading) {
    return (
      <Button
        type="button"
        variant="outline"
        className="h-9 border-cyan-100 bg-white text-slate-500"
        disabled
      >
        Laden
      </Button>
    );
  }

  if (!user) {
    return (
      <Button
        asChild
        variant="outline"
        className="h-9 border-cyan-100 bg-white text-slate-700"
      >
        <Link href="/login">Inloggen</Link>
      </Button>
    );
  }

  const userLabel = getUserLabel(user.displayName, user.email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 gap-2 border-cyan-100 bg-white text-slate-700"
        >
          {user.photoURL ? (
            <span
              className="size-5 rounded-full bg-cover bg-center"
              style={{ backgroundImage: `url(${user.photoURL})` }}
              aria-hidden="true"
            />
          ) : (
            <UserCircle className="size-4 text-cyan-700" aria-hidden="true" />
          )}
          <span className="max-w-32 truncate">{userLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-white">
        <DropdownMenuLabel>
          <span className="block truncate text-slate-950">{userLabel}</span>
          {user.email ? (
            <span className="mt-1 block truncate text-xs font-normal text-slate-500">
              {user.email}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={() => {
            void signInWithGoogle()
              .then(() => router.push("/trips"))
              .catch((error: unknown) => {
                console.error("Account wisselen mislukt", error);
              });
          }}
        >
          <LogIn className="size-4" aria-hidden="true" />
          Ander account gebruiken
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer text-pink-700"
          onSelect={() => {
            void signOutUser();
          }}
        >
          <LogOut className="size-4" aria-hidden="true" />
          Uitloggen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
