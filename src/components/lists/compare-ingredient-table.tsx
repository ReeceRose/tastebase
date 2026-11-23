import type {
  CompareCell,
  CompareColumn,
  CompareRow,
} from "@/lib/types/recipe-compare-types";
import { cn } from "@/lib/utils";
import { COMPARE_ROW_LABEL, compareGrid } from "@/lib/utils/compare-layout";
import { spreadCaption } from "@/lib/utils/recipe-compare";
import { swatchClasses } from "@/lib/utils/swatches";

interface CompareIngredientTableProps {
  rows: CompareRow[];
  columns: CompareColumn[];
  onlyDifferences: boolean;
}

interface IngredientSectionProps {
  title: string;
  rows: CompareRow[];
  columns: CompareColumn[];
}

function IngredientCell({
  cell,
  column,
}: {
  cell: CompareCell | null;
  column: CompareColumn;
}) {
  if (!cell) {
    return (
      <td className="text-muted-foreground">
        <span aria-hidden>—</span>
        <span className="sr-only">Not in {column.title}</span>
      </td>
    );
  }

  return (
    <td className="min-w-0">
      <p className="font-extrabold tabular">{cell.quantity || "Some"}</p>
      {cell.share !== null && (
        <div aria-hidden className="mt-1.5 h-1.5 rounded-full bg-background">
          <div
            className={cn(
              "h-full rounded-full",
              swatchClasses(column.swatch).bg,
            )}
            style={{ width: `${Math.max(cell.share * 100, 4)}%` }}
          />
        </div>
      )}
      {cell.detail && (
        <p className="mt-1 text-caption text-muted-foreground">{cell.detail}</p>
      )}
    </td>
  );
}

// The first row names the section; rows after it are split by a rule.
function IngredientSection({ title, rows, columns }: IngredientSectionProps) {
  const grid = compareGrid(columns.length);

  return (
    <tbody aria-label={title} className="block">
      <tr className="block pt-4 pb-1">
        <th
          scope="rowgroup"
          colSpan={columns.length + 1}
          className="sticky left-0 block text-left text-caption font-extrabold tracking-wide text-muted-foreground uppercase"
        >
          {title}
        </th>
      </tr>
      {rows.map((row, index) => {
        const caption = spreadCaption(row.spread);
        return (
          <tr
            key={row.id}
            className={cn(
              "grid items-start gap-x-4 gap-y-1.5 py-3",
              index > 0 && "border-t-2 border-background",
              grid,
            )}
          >
            <th
              scope="row"
              className={cn(COMPARE_ROW_LABEL, "text-left font-normal")}
            >
              <p className="font-extrabold">{row.label}</p>
              {caption && (
                <p className="mt-0.5 flex items-center gap-1.5 text-caption text-muted-foreground">
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full bg-accent"
                  />
                  {caption}
                </p>
              )}
            </th>
            {row.cells.map((cell, cellIndex) => (
              <IngredientCell
                key={`${row.id}-${columns[cellIndex].id}`}
                cell={cell}
                column={columns[cellIndex]}
              />
            ))}
          </tr>
        );
      })}
    </tbody>
  );
}

function sectionTitles(count: number): [string, string] {
  return count === 2
    ? ["In both", "Only in one"]
    : [`In all ${count}`, "Only in some"];
}

export function CompareIngredientTable({
  rows,
  columns,
  onlyDifferences,
}: CompareIngredientTableProps) {
  const visible = onlyDifferences ? rows.filter((row) => !row.agrees) : rows;
  const shared = visible.filter((row) => row.inAll);
  const partial = visible.filter((row) => !row.inAll);
  const hidden = rows.length - visible.length;
  const [sharedTitle, partialTitle] = sectionTitles(columns.length);

  return (
    <section aria-labelledby="compare-ingredients-title" className="space-y-3">
      <h2
        id="compare-ingredients-title"
        className="sticky left-0 w-fit px-1 text-heading"
      >
        Ingredients
      </h2>
      {visible.length > 0 ? (
        <table
          aria-labelledby="compare-ingredients-title"
          className="block rounded-tile bg-card px-5 pb-2"
        >
          <thead className="sr-only">
            <tr>
              <th scope="col">Ingredient</th>
              {columns.map((column) => (
                <th key={column.id} scope="col">
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          {shared.length > 0 && (
            <IngredientSection
              title={sharedTitle}
              rows={shared}
              columns={columns}
            />
          )}
          {partial.length > 0 && (
            <IngredientSection
              title={partialTitle}
              rows={partial}
              columns={columns}
            />
          )}
        </table>
      ) : (
        <div className="rounded-tile bg-card px-5">
          <p className="sticky left-0 w-fit py-6 text-muted-foreground">
            {rows.length === 0
              ? "None of these recipes list ingredients yet."
              : "Every ingredient matches."}
          </p>
        </div>
      )}
      {onlyDifferences && hidden > 0 && (
        <p className="sticky left-0 w-fit px-1 text-meta text-muted-foreground">
          {hidden === 1
            ? "1 matching ingredient hidden"
            : `${hidden} matching ingredients hidden`}
        </p>
      )}
    </section>
  );
}
