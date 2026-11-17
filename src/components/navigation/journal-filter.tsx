import Link from "next/link";
import { Chip } from "@/components/ui/chip";
import { JournalFilter } from "@/lib/types";

const FILTERS = [
  { value: JournalFilter.ALL, label: "Everything", href: "/journal" },
  {
    value: JournalFilter.COOKED,
    label: "Things I made",
    href: "/journal?show=cooked",
  },
  { value: JournalFilter.NOTES, label: "Notes", href: "/journal?show=notes" },
];

interface JournalFilterLinksProps {
  current: JournalFilter;
}

export function JournalFilterLinks({ current }: JournalFilterLinksProps) {
  return (
    <nav aria-label="Show" className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => (
        <Chip key={filter.value} asChild>
          <Link
            href={filter.href}
            aria-pressed={filter.value === current}
            aria-current={filter.value === current ? "page" : undefined}
          >
            {filter.label}
          </Link>
        </Chip>
      ))}
    </nav>
  );
}
