import type * as React from "react";
import { BrandMark } from "@/components/navigation/brand-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { CircleMotif } from "@/components/ui/circle-motif";
import { RecipeSwatch } from "@/lib/types";
import { cn } from "@/lib/utils";
import { swatchClasses } from "@/lib/utils/swatches";

interface AuthShellProps {
  children: React.ReactNode;
}

const SAMPLE_TILES = [
  { title: "Weeknight chana masala", swatch: RecipeSwatch.TURMERIC },
  { title: "Grandma Rosa's Sunday ragù", swatch: RecipeSwatch.TOMATO },
  { title: "Lemon-ricotta pancakes", swatch: RecipeSwatch.SKY },
  { title: "Miso-glazed aubergine", swatch: RecipeSwatch.AUBERGINE },
];

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col overflow-hidden bg-leek p-12 text-white lg:flex">
        <BrandMark wordmarkClassName="text-white" />
        <p className="mt-auto max-w-[13ch] text-display text-white">
          The recipes your house actually cooks.
        </p>
        <ul aria-hidden className="mt-10 grid max-w-md grid-cols-2 gap-3">
          {SAMPLE_TILES.map((tile) => {
            const classes = swatchClasses(tile.swatch);
            return (
              <li
                key={tile.title}
                className={cn(
                  "relative min-h-[130px] overflow-hidden rounded-tile p-4",
                  classes.bg,
                  classes.fg,
                )}
              >
                <CircleMotif
                  className={cn("-right-8 -bottom-12 size-24", classes.deep)}
                />
                <span className="relative block max-w-[12ch] text-lg leading-tight font-extrabold tracking-[-0.02em]">
                  {tile.title}
                </span>
              </li>
            );
          })}
        </ul>
      </aside>

      <main className="flex flex-col p-6 md:p-10">
        <div className="flex items-center justify-between">
          <BrandMark className="lg:invisible" wordmarkClassName="text-[22px]" />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </main>
    </div>
  );
}
