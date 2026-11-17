import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Chip } from "@/components/ui/chip";

interface JournalYearNavProps {
  year: number;
  years: number[];
}

const arrowClass =
  "grid size-11 place-items-center rounded-full outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring";

export function JournalYearNav({ year, years }: JournalYearNavProps) {
  const older = years.includes(year - 1) ? year - 1 : null;
  const newer = years.includes(year + 1) ? year + 1 : null;

  return (
    <nav aria-label="Years" className="flex flex-wrap items-center gap-2">
      {older ? (
        <Link
          href={`/journal/${older}`}
          aria-label={`${older}`}
          className={arrowClass}
        >
          <ChevronLeft className="size-5" />
        </Link>
      ) : (
        <span className="size-11" />
      )}
      {[...years].reverse().map((item) => (
        <Chip key={item} asChild>
          <Link
            href={`/journal/${item}`}
            aria-pressed={item === year}
            aria-current={item === year ? "page" : undefined}
            className="tabular"
          >
            {item}
          </Link>
        </Chip>
      ))}
      {newer ? (
        <Link
          href={`/journal/${newer}`}
          aria-label={`${newer}`}
          className={arrowClass}
        >
          <ChevronRight className="size-5" />
        </Link>
      ) : (
        <span className="size-11" />
      )}
    </nav>
  );
}
