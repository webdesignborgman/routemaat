import Link from "next/link";
import { ArrowRight, MapPinned, Sparkles } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <AppShell>
      <section className="flex flex-1 items-center py-10 sm:py-16">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-3 py-1 text-sm font-medium text-cyan-700 shadow-sm">
              <Sparkles className="size-4" aria-hidden="true" />
              Familie-reisplanner
            </div>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
                RouteMaat
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Verzamel reisideeën, maak samen keuzes en houd per reis overzicht
                zonder gedoe.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="bg-slate-950 text-white shadow-[0_0_26px_rgba(34,211,238,0.35)] hover:bg-slate-800"
            >
              <Link href="/trips">
                Naar reizen
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="rounded-xl border border-cyan-100 bg-white/90 p-5 shadow-[0_20px_55px_rgba(14,165,233,0.14)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-700">Eerste reis</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                  Japan 2028
                </h2>
              </div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                <MapPinned className="size-6" aria-hidden="true" />
              </div>
            </div>
            <div className="grid gap-3 text-sm text-slate-600">
              <div className="rounded-lg bg-cyan-50 px-4 py-3">
                Ideeën voor Tokyo, Kyoto en Osaka
              </div>
              <div className="rounded-lg bg-pink-50 px-4 py-3">
                Tags, status en prioriteit bij elkaar
              </div>
              <div className="rounded-lg bg-lime-50 px-4 py-3">
                Klaar om later met Firebase te koppelen
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
