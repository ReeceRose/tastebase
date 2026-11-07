import { describe, expect, it } from "vitest";
import lines from "@/lib/import/__tests__/fixtures/real-ingredient-lines.json";
import { stripHtml } from "@/lib/import/html-to-text";
import { doubtfulIngredients } from "@/lib/import/import-quality";
import { parseIngredientList } from "@/lib/import/ingredient-list";
import { parseIngredientLines } from "@/lib/import/ingredient-parser";
import { MeasurementUnit } from "@/lib/types";
import { displayIngredientAmount } from "@/lib/utils/ingredient-scaling";
import { parseQuantity, parseRange } from "@/lib/utils/quantity-parsing";

// Lines from about 30 recipe sites, collected by `pnpm run import:survey`.
const rows = (lines as string[]).flatMap((line) =>
  parseIngredientList([stripHtml(line)]).map((row) => ({ line, row })),
);

// A ratchet, so parsing can get better but can't quietly get worse. Lower
// these as parsing improves.
const MAX_DOUBTFUL_ROWS = 5;
const MIN_ROWS_WITH_AMOUNT = 0.85;

describe("real ingredient lines", () => {
  it("covers a real sample", () => {
    expect(lines.length).toBeGreaterThan(1500);
  });

  it("stays within the allowance of doubtful rows", () => {
    const doubtful = doubtfulIngredients(rows.map(({ row }) => row));
    expect(
      doubtful.length,
      doubtful.map((row) => row.name).join("\n"),
    ).toBeLessThanOrEqual(MAX_DOUBTFUL_ROWS);
  });

  it("finds an amount on nearly every row", () => {
    const withAmount = rows.filter(({ row }) => row.quantity).length;
    expect(withAmount / rows.length).toBeGreaterThan(MIN_ROWS_WITH_AMOUNT);
  });

  it("only produces amounts the scaler can read", () => {
    const unreadable = rows.filter(({ row }) => {
      if (!row.quantity) return false;
      return (
        parseQuantity(row.quantity) === null &&
        parseRange(row.quantity) === null
      );
    });
    expect(unreadable.map(({ line }) => line)).toEqual([]);
  });

  it("stays within what the editor can save", () => {
    const tooLong = rows.filter(
      ({ row }) => row.name.length > 200 || (row.unit && row.unit.length > 50),
    );
    expect(tooLong.map(({ line }) => line)).toEqual([]);
  });

  it("leaves nothing that breaks scaling and conversion", () => {
    for (const { row } of rows) {
      for (const system of [
        MeasurementUnit.METRIC,
        MeasurementUnit.IMPERIAL,
        null,
      ]) {
        const shown = displayIngredientAmount(
          row.quantity,
          row.unit,
          2,
          system,
          row.name,
        );
        expect(shown.amount).not.toContain("NaN");
        expect(shown.name).not.toContain("NaN");
      }
    }
  });
});

// Every real line's parsed result, saved to a file and compared on each run.
// A change that alters any line fails here until the file is updated, so look
// over the diff, then run `pnpm exec vitest run -u` to accept it.
describe("parsed output of every real line", () => {
  it("matches the reviewed snapshot", async () => {
    const shown = (lines as string[]).map((line) => {
      const parsed = parseIngredientList([stripHtml(line)]).map((row) =>
        [
          row.quantity ?? "-",
          row.unit ?? "-",
          row.name,
          row.notes ?? "-",
          ...(row.isOptional ? ["optional"] : []),
        ].join(" | "),
      );
      return `${line}\n  => ${parsed.join("\n  => ") || "(nothing)"}`;
    });
    await expect(`${shown.join("\n")}\n`).toMatchFileSnapshot(
      "fixtures/real-ingredient-lines.snapshot.txt",
    );
  });
});

describe("second measures after scaling", () => {
  const [tomato] = parseIngredientLines("400g / 14 oz canned crushed tomato");

  it("scales both amounts", () => {
    expect(
      displayIngredientAmount(
        tomato.quantity,
        tomato.unit,
        2,
        null,
        tomato.name,
      ),
    ).toEqual({
      amount: "800",
      unit: "g",
      name: "canned crushed tomato (28 oz)",
    });
  });

  it("uses the author's own amount for the reader's system", () => {
    expect(
      displayIngredientAmount(
        tomato.quantity,
        tomato.unit,
        1,
        MeasurementUnit.IMPERIAL,
        tomato.name,
      ),
    ).toMatchObject({
      amount: "14",
      unit: "oz",
      name: "canned crushed tomato",
    });
  });
});
