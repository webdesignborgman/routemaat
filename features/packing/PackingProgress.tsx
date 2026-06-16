import { CheckCircle2, PackageCheck } from "lucide-react";

type PackingProgressProps = {
  checkedCount: number;
  totalCount: number;
};

export function PackingProgress({
  checkedCount,
  totalCount,
}: PackingProgressProps) {
  const percentage =
    totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <section className="rounded-xl border border-lime-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(132,204,22,0.08)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lime-50 text-lime-700">
            <PackageCheck className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-950">
              {checkedCount} van {totalCount} ingepakt
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Vink af voor deze reis. Je standaardlijst blijft hetzelfde.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-lime-800">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {percentage}%
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-lime-50">
        <div
          className="h-full rounded-full bg-lime-400 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </section>
  );
}
