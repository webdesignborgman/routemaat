import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

type PageHeaderProps = {
  title: string;
  description?: string;
  backHref?: string;
  action?: ReactNode;
};

export function PageHeader({
  title,
  description,
  backHref,
  action,
}: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-3">
        {backHref ? (
          <Button asChild variant="ghost" className="-ml-2 text-slate-600">
            <Link href={backHref}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Terug
            </Link>
          </Button>
        ) : null}
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
