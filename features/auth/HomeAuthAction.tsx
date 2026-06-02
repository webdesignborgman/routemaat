"use client";

import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";

export function HomeAuthAction() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <Button
        type="button"
        size="lg"
        className="bg-slate-950 text-white"
        disabled
      >
        Laden
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <Button
        asChild
        size="lg"
        className="bg-slate-950 text-white shadow-[0_0_26px_rgba(34,211,238,0.35)] hover:bg-slate-800"
      >
        <Link href="/trips">
          Naar mijn reizen
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    );
  }

  return (
    <Button
      asChild
      size="lg"
      className="bg-slate-950 text-white shadow-[0_0_26px_rgba(34,211,238,0.35)] hover:bg-slate-800"
    >
      <Link href="/login">
        Inloggen
        <LogIn className="size-4" aria-hidden="true" />
      </Link>
    </Button>
  );
}
