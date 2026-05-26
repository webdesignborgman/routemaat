import type { ReactNode } from "react";

import { BottomNav } from "@/components/layout/BottomNav";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,#f0fbff_0%,#fff7fb_48%,#f8fff0_100%)] text-slate-950">
      <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 pb-24 pt-5 sm:px-6 lg:px-8">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
