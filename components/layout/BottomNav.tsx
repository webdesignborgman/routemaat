import Link from "next/link";
import { Home, Route } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/trips", label: "Reizen", icon: Route },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 box-border border-t border-cyan-100 bg-white/90 px-3 py-2 shadow-[0_-10px_30px_rgba(14,165,233,0.12)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-sm grid-cols-2 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-500 transition hover:bg-cyan-50 hover:text-cyan-700"
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
