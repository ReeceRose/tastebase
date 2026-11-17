import Link from "next/link";
import type { MonthCount } from "@/lib/types/journal-lookback-types";

interface MonthlyCooksChartProps {
  year: number;
  months: MonthCount[];
  busiest: MonthCount | null;
}

export function MonthlyCooksChart({
  year,
  months,
  busiest,
}: MonthlyCooksChartProps) {
  const top = Math.max(1, ...months.map((month) => month.count));

  return (
    <section className="rounded-tile bg-card p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-heading">Month by month</h2>
        {busiest && (
          <p className="text-meta text-muted-foreground">
            Busiest: {busiest.label}
          </p>
        )}
      </div>
      <nav
        aria-label="Months"
        className="flex h-44 items-end gap-[2px] border-b-2 border-border"
      >
        {months.map((month) => (
          <Link
            key={month.month}
            href={`/journal/${year}/${month.month + 1}`}
            aria-label={`${month.label}: ${month.count} ${month.count === 1 ? "cook" : "cooks"}`}
            title={`${month.label}: ${month.count} ${month.count === 1 ? "cook" : "cooks"}`}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1 rounded-t-[4px] outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            {month.month === busiest?.month && (
              <span aria-hidden className="text-caption font-extrabold tabular">
                {month.count}
              </span>
            )}
            {month.count > 0 && (
              <span
                className="w-full max-w-6 rounded-t-[4px] bg-swatch-leek"
                style={{ height: `${(month.count / top) * 85}%` }}
              />
            )}
          </Link>
        ))}
      </nav>
      <div aria-hidden className="mt-1.5 flex gap-[2px]">
        {months.map((month) => (
          <span
            key={month.month}
            className="flex-1 text-center text-caption text-muted-foreground"
          >
            {month.label.charAt(0)}
          </span>
        ))}
      </div>
    </section>
  );
}
