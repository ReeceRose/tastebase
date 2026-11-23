/**
 * Every row on the compare page uses the same grid so columns line up across
 * the header, the facts, the ingredients and the method. Below lg the label
 * sits on its own line above the cells and the whole comparison scrolls
 * sideways; from lg the label is a fixed-width first column.
 */
const COMPARE_GRIDS: Record<number, string> = {
  2: "grid-cols-[repeat(2,minmax(9.5rem,1fr))] lg:grid-cols-[10rem_repeat(2,minmax(0,1fr))]",
  3: "grid-cols-[repeat(3,minmax(9.5rem,1fr))] lg:grid-cols-[10rem_repeat(3,minmax(0,1fr))]",
  4: "grid-cols-[repeat(4,minmax(9.5rem,1fr))] lg:grid-cols-[10rem_repeat(4,minmax(0,1fr))]",
};

export function compareGrid(columns: number): string {
  return COMPARE_GRIDS[columns] ?? COMPARE_GRIDS[2];
}

export const COMPARE_ROW_LABEL =
  "sticky left-0 col-span-full justify-self-start lg:static lg:col-span-1 lg:justify-self-stretch";
