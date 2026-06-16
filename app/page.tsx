import { Backpack, Lightbulb, Route, Sparkles } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { HomeAuthAction } from "@/features/auth/HomeAuthAction";

const highlights = [
  {
    title: "Reizen plannen",
    description: "Bewaar elke familie- of vriendenreis op een eigen plek.",
    icon: Route,
    className: "border-cyan-100 bg-cyan-50 text-cyan-700",
  },
  {
    title: "Ideeën verzamelen",
    description: "Leg plekken, restaurants, links en notities snel vast.",
    icon: Lightbulb,
    className: "border-pink-100 bg-pink-50 text-pink-600",
  },
  {
    title: "Samen overzicht houden",
    description: "Beheer ideeën, taken, documenten en je inpaklijst op één plek.",
    icon: Backpack,
    className: "border-lime-100 bg-lime-50 text-lime-700",
  },
] as const;

export default function Home() {
  return (
    <AppShell>
      <section className="flex flex-1 flex-col justify-center gap-8 py-8 sm:py-14">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/90 px-3 py-1 text-sm font-medium text-cyan-700 shadow-[0_0_22px_rgba(34,211,238,0.18)]">
            <Sparkles className="size-4" aria-hidden="true" />
            Privé familie-reisplanner
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
              RouteMaat
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Plan reizen samen, verzamel ideeën en houd per trip overzicht van
              planning, documenten, taken en je inpaklijst.
            </p>
          </div>

          <HomeAuthAction />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((highlight) => {
            const Icon = highlight.icon;

            return (
              <article
                key={highlight.title}
                className="rounded-xl border border-cyan-100 bg-white/95 p-4 shadow-[0_18px_45px_rgba(14,165,233,0.10)]"
              >
                <div
                  className={`mb-4 flex size-11 items-center justify-center rounded-xl border shadow-[0_0_20px_rgba(34,211,238,0.10)] ${highlight.className}`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h2 className="text-base font-semibold text-slate-950">
                  {highlight.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {highlight.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
