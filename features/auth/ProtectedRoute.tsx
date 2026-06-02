"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { Lock, Route } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <section className="rounded-xl border border-cyan-100 bg-white/85 px-5 py-12 text-center shadow-[0_18px_45px_rgba(14,165,233,0.10)]">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
          <Route className="size-5" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-slate-950">App laden</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          We controleren of je bent ingelogd.
        </p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="rounded-xl border border-dashed border-cyan-200 bg-white/85 px-5 py-12 text-center shadow-[0_18px_45px_rgba(14,165,233,0.10)]">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-pink-50 text-pink-600">
          <Lock className="size-5" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-slate-950">
          Log in om verder te gaan
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Deze pagina hoort bij je persoonlijke reizen.
        </p>
        <Button
          asChild
          className="mt-6 bg-slate-950 text-white hover:bg-slate-800"
        >
          <Link href="/login">Naar inloggen</Link>
        </Button>
      </section>
    );
  }

  return <>{children}</>;
}
