import Link from "next/link";
import { Backpack, Home, Route } from "lucide-react";

import { UserMenu } from "@/features/auth/UserMenu";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/trips", label: "Reizen", icon: Route },
  { href: "/inpaklijst", label: "Inpaklijst", icon: Backpack },
] as const;

export function AppNav() {
  return (
    <header className="border-b border-cyan-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-base font-semibold text-slate-950">
          RouteMaat
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-cyan-50 hover:text-cyan-700"
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <UserMenu />
      </div>
    </header>
  );
}
