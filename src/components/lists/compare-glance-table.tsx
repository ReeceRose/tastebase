import { useId } from "react";
import type {
  CompareColumn,
  CompareFact,
} from "@/lib/types/recipe-compare-types";
import { cn } from "@/lib/utils";
import { COMPARE_ROW_LABEL, compareGrid } from "@/lib/utils/compare-layout";

interface CompareGlanceTableProps {
  title: string;
  description: string | null;
  facts: CompareFact[];
  columns: CompareColumn[];
}

export function CompareGlanceTable({
  title,
  description,
  facts,
  columns,
}: CompareGlanceTableProps) {
  const titleId = useId();
  const grid = compareGrid(columns.length);

  if (facts.length === 0) return null;

  return (
    <section aria-labelledby={titleId} className="space-y-3">
      <div className="sticky left-0 w-fit px-1">
        <h2 id={titleId} className="text-heading">
          {title}
        </h2>
        {description && (
          <p className="text-meta text-muted-foreground">{description}</p>
        )}
      </div>
      <table
        aria-labelledby={titleId}
        className="block rounded-tile bg-card px-5 py-1"
      >
        <thead className="sr-only">
          <tr>
            <th scope="col">Fact</th>
            {columns.map((column) => (
              <th key={column.id} scope="col">
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="block divide-y-2 divide-background">
          {facts.map((fact) => (
            <tr
              key={fact.label}
              className={cn("grid items-baseline gap-x-4 gap-y-1 py-3", grid)}
            >
              <th
                scope="row"
                className={cn(
                  COMPARE_ROW_LABEL,
                  "text-left text-meta font-normal text-muted-foreground",
                )}
              >
                {fact.label}
              </th>
              {fact.cells.map((cell, index) => (
                <td
                  key={`${fact.label}-${columns[index].id}`}
                  className={cn("tabular", cell.best && "font-extrabold")}
                >
                  {cell.value ?? (
                    <span className="text-muted-foreground">—</span>
                  )}
                  {cell.best && fact.bestLabel && (
                    <span className="ml-2 inline-flex items-center gap-1.5 text-caption font-semibold text-muted-foreground">
                      <span
                        aria-hidden
                        className="size-2 rounded-full bg-accent"
                      />
                      {fact.bestLabel}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
