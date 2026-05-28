"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Route } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/trips", label: "Reizen", icon: Route },
  { href: "/trips/japan-2028/ideas", label: "Ideeën", icon: Map },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 box-border border-t border-cyan-100 bg-white/90 px-3 py-2 shadow-[0_-10px_30px_rgba(14,165,233,0.12)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-500 transition",
                isActive && "bg-cyan-50 text-cyan-700 shadow-sm"
              )}
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
