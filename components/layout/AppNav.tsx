import Link from "next/link";
import { Home, Route } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/trips", label: "Reizen", icon: Route },
] as const;

export function AppNav() {
  return (
    <nav className="hidden border-b border-cyan-100 bg-white/80 backdrop-blur md:block">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3 lg:px-8">
        <Link href="/" className="text-base font-semibold text-slate-950">
          RouteMaat
        </Link>
        <div className="flex items-center gap-2">
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
        </div>
      </div>
    </nav>
  );
}
