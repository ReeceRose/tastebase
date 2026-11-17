import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Chip } from "@/components/ui/chip";
import type { MonthRef } from "@/lib/types/journal-lookback-types";
import { monthName } from "@/lib/utils/journal-lookback";

interface JournalMonthNavProps {
  year: number;
  older: MonthRef | null;
  newer: MonthRef | null;
}

interface MonthArrowProps {
  target: MonthRef | null;
  older: boolean;
}

const arrowClass =
  "grid size-11 place-items-center rounded-full outline-none hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring";

function MonthArrow({ target, older }: MonthArrowProps) {
  if (!target) return <span className="size-11" />;
  const Icon = older ? ChevronLeft : ChevronRight;
  return (
    <Link
      href={`/journal/${target.year}/${target.month}`}
      aria-label={monthName(target.year, target.month, true)}
      className={arrowClass}
    >
      <Icon className="size-5" />
    </Link>
  );
}

export function JournalMonthNav({ year, older, newer }: JournalMonthNavProps) {
  return (
    <nav aria-label="Months" className="flex flex-wrap items-center gap-2">
      <MonthArrow target={older} older />
      <Chip asChild>
        <Link href={`/journal/${year}`} className="tabular">
          All of {year}
        </Link>
      </Chip>
      <MonthArrow target={newer} older={false} />
    </nav>
  );
}
