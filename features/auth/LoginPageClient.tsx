"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LogIn, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/useAuth";
import { isFirebaseConfigured } from "@/lib/firebase";

export function LoginPageClient() {
  const router = useRouter();
  const { user, loading, isAuthenticated, signInWithGoogle } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setError(null);
    setIsSubmitting(true);

    try {
      await signInWithGoogle();
      router.push("/trips");
    } catch (signInError) {
      const message =
        signInError instanceof Error
          ? signInError.message
          : "Inloggen is mislukt. Probeer het opnieuw.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSwitchAccount() {
    setError(null);
    setIsSubmitting(true);

    try {
      await signInWithGoogle();
      router.push("/trips");
    } catch (signInError) {
      const message =
        signInError instanceof Error
          ? signInError.message
          : "Van account wisselen is mislukt. Probeer het opnieuw.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex flex-1 items-center py-8 sm:py-14">
      <div className="mx-auto w-full max-w-lg">
        <Card className="border-cyan-100 bg-white/95 shadow-[0_22px_70px_rgba(14,165,233,0.16)]">
          <CardHeader className="space-y-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 shadow-[0_0_22px_rgba(34,211,238,0.18)]">
              <Sparkles className="size-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-2xl text-slate-950">
                Inloggen bij RouteMaat
              </CardTitle>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Gebruik je Google-account om je reizen te openen.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
                We controleren of je al bent ingelogd.
              </div>
            ) : isAuthenticated ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-lime-100 bg-lime-50 px-4 py-3 text-sm text-lime-800">
                  Je bent ingelogd
                  {user?.displayName ? ` als ${user.displayName}` : ""}.
                </div>
                <Button
                  asChild
                  className="w-full bg-slate-950 text-white hover:bg-slate-800"
                >
                  <Link href="/trips">
                    Naar mijn reizen
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-cyan-100 bg-white"
                  disabled={isSubmitting}
                  onClick={handleSwitchAccount}
                >
                  <LogIn className="size-4" aria-hidden="true" />
                  {isSubmitting
                    ? "Account wisselen..."
                    : "Ander account gebruiken"}
                </Button>
                {error ? (
                  <div className="rounded-xl border border-pink-100 bg-pink-50 px-4 py-3 text-sm leading-6 text-pink-800">
                    {error}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                {!isFirebaseConfigured ? (
                  <div className="rounded-xl border border-pink-100 bg-pink-50 px-4 py-3 text-sm leading-6 text-pink-800">
                    Firebase is nog niet geconfigureerd. Vul eerst de
                    NEXT_PUBLIC_FIREBASE_* variabelen in.
                  </div>
                ) : null}
                <Button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isSubmitting || !isFirebaseConfigured}
                  className="w-full bg-slate-950 text-white shadow-[0_0_24px_rgba(34,211,238,0.30)] hover:bg-slate-800"
                >
                  <LogIn className="size-4" aria-hidden="true" />
                  {isSubmitting ? "Inloggen..." : "Inloggen met Google"}
                </Button>
                {error ? (
                  <div className="rounded-xl border border-pink-100 bg-pink-50 px-4 py-3 text-sm leading-6 text-pink-800">
                    {error}
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
