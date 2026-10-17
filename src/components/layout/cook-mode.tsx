"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ListChecks,
  TimerReset,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { IngredientList } from "@/components/recipes/ingredient-list";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIngredientTicks } from "@/hooks/use-ingredient-ticks";
import { formatCountdown, useStepTimers } from "@/hooks/use-step-timers";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { recordRecipeCook } from "@/lib/server-actions/recipe-cook-actions";
import {
  ButtonVariant,
  type MeasurementUnit,
  type RecipeSwatch,
  type TemperatureUnit,
} from "@/lib/types";
import type { RecipeWithRelations } from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";
import { convertTemperaturesInText } from "@/lib/utils/ingredient-scaling";
import { isDarkSwatch, swatchClasses } from "@/lib/utils/swatches";
import { formatTotalTime } from "@/lib/utils/time-formatting";
import { formatTemperatureForDisplay } from "@/lib/utils/unit-conversions";

interface CookModeProps {
  recipe: RecipeWithRelations;
  swatch: RecipeSwatch;
  measurementSystem: MeasurementUnit;
  temperatureUnit: TemperatureUnit;
}

const SWIPE_DISTANCE = 60;

export function CookMode({
  recipe,
  swatch,
  measurementSystem,
  temperatureUnit,
}: CookModeProps) {
  const router = useRouter();
  const classes = swatchClasses(swatch);
  const dark = isDarkSwatch(swatch);
  const steps = [...recipe.instructions].sort(
    (a, b) => a.stepNumber - b.stepNumber,
  );
  const [index, setIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isFinishing, startFinishing] = useTransition();
  const { ticked, toggle } = useIngredientTicks(recipe.id);
  const screenOn = useWakeLock();
  const touchStart = useRef<number | null>(null);
  const recipeHref = `/recipes/${recipe.slug}`;

  const { timers, now, start, cancel } = useStepTimers((timer) => {
    toast.success(`Time's up: ${timer.label}`);
  });

  const step = steps[index];
  const isLast = index === steps.length - 1;
  const stepTime = step?.timeMinutes ?? null;
  const stepTimer = step
    ? timers.find((timer) => timer.stepId === step.id)
    : undefined;
  const otherTimers = timers.filter((timer) => timer.stepId !== step?.id);

  const go = useCallback(
    (delta: number) =>
      setIndex((current) =>
        Math.min(Math.max(current + delta, 0), Math.max(steps.length - 1, 0)),
      ),
    [steps.length],
  );

  const finish = () => {
    startFinishing(async () => {
      const result = await recordRecipeCook(recipe.id);
      if (result.success) {
        toast.success("Nice. Marked as cooked.");
      }
      router.push(recipeHref);
    });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (drawerOpen) return;
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "Escape") router.push(recipeHref);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, go, router, recipeHref]);

  const temperature = step?.temperature
    ? formatTemperatureForDisplay(step.temperature, temperatureUnit)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className={cn("px-4 pt-4 pb-3 sm:px-8", classes.bg, classes.fg)}>
        <div className="flex items-center gap-3">
          <Link
            href={recipeHref}
            aria-label="Leave cook mode"
            className="grid size-11 shrink-0 place-items-center rounded-full outline-none hover:bg-black/10 focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <X className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-extrabold tracking-[-0.02em]">
              {recipe.title}
            </p>
            <p className="text-meta opacity-85">
              {steps.length > 0
                ? `Step ${index + 1} of ${steps.length}`
                : "No steps yet"}
              {screenOn ? " · Screen stays on" : ""}
            </p>
          </div>
          <Button
            variant={ButtonVariant.SECONDARY}
            onClick={() => setDrawerOpen(true)}
          >
            <ListChecks className="size-5" />
            <span className="hidden sm:inline">Ingredients</span>
          </Button>
        </div>
        <ol className="mt-3 flex gap-1" aria-hidden>
          {steps.map((item, position) => (
            <li
              key={item.id}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-200",
                position <= index
                  ? dark
                    ? "bg-white"
                    : "bg-ink-fixed"
                  : dark
                    ? "bg-white/30"
                    : "bg-black/15",
              )}
            />
          ))}
        </ol>
      </header>

      <main
        className="flex flex-1 flex-col overflow-y-auto px-5 py-8 sm:px-10 lg:px-20"
        onTouchStart={(event) => {
          touchStart.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const distance =
            (event.changedTouches[0]?.clientX ?? touchStart.current) -
            touchStart.current;
          touchStart.current = null;
          if (distance <= -SWIPE_DISTANCE) go(1);
          if (distance >= SWIPE_DISTANCE) go(-1);
        }}
      >
        {step ? (
          <div className="mx-auto w-full max-w-3xl" aria-live="polite">
            <span
              className={cn(
                "grid size-16 place-items-center rounded-full text-3xl font-extrabold",
                classes.bg,
                classes.fg,
              )}
            >
              {index + 1}
            </span>
            <p className="mt-6 text-[28px] leading-[1.2] font-semibold tracking-[-0.015em] sm:text-[38px]">
              {convertTemperaturesInText(step.instruction, temperatureUnit)}
            </p>
            {step.notes && (
              <p className="mt-4 text-lead text-muted-foreground">
                {step.notes}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {temperature && (
                <span className="rounded-full bg-card px-4 py-2 text-lead font-extrabold tabular">
                  {temperature}
                </span>
              )}
              {stepTime && !stepTimer && (
                <Button
                  variant={ButtonVariant.ACCENT}
                  size="lg"
                  onClick={() => start(step.id, `step ${index + 1}`, stepTime)}
                >
                  Start {formatTotalTime(stepTime)} timer
                </Button>
              )}
              {stepTimer && (
                <div className="flex items-center gap-2 rounded-full bg-accent py-1.5 pr-1.5 pl-5 text-accent-foreground">
                  <span
                    className="text-2xl font-extrabold tabular"
                    role="timer"
                    aria-live="off"
                  >
                    {formatCountdown(stepTimer.endsAt - now)}
                  </span>
                  <button
                    type="button"
                    onClick={() => cancel(step.id)}
                    aria-label="Cancel timer"
                    className="grid size-10 place-items-center rounded-full bg-black/10 outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                  >
                    <TimerReset className="size-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="mx-auto max-w-xl text-center text-lead text-muted-foreground">
            This recipe has no steps written down yet. Add some from the editor.
          </p>
        )}
      </main>

      {otherTimers.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 px-5 pb-2">
          {otherTimers.map((timer) => (
            <span
              key={timer.stepId}
              className="rounded-full bg-accent px-3 py-1 text-meta text-accent-foreground tabular"
            >
              {timer.label}: {formatCountdown(timer.endsAt - now)}
            </span>
          ))}
        </div>
      )}

      <footer className="flex gap-3 border-t-2 border-border bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8">
        <Button
          variant={ButtonVariant.OUTLINE}
          size="lg"
          onClick={() => go(-1)}
          disabled={index === 0}
          className="flex-1 sm:flex-none"
        >
          <ArrowLeft className="size-5" />
          Back
        </Button>
        {isLast || steps.length === 0 ? (
          <Button
            size="lg"
            onClick={finish}
            disabled={isFinishing}
            className="flex-[2] sm:ml-auto sm:flex-none"
          >
            <Check className="size-5" />
            {isFinishing ? "Saving…" : "Finish cooking"}
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={() => go(1)}
            className="flex-[2] sm:ml-auto sm:flex-none"
          >
            Next step
            <ArrowRight className="size-5" />
          </Button>
        )}
      </footer>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto p-6 sm:max-w-md"
        >
          <SheetTitle>Ingredients</SheetTitle>
          <SheetDescription className="sr-only">
            Tick ingredients off as you use them.
          </SheetDescription>
          <IngredientList
            ingredients={recipe.ingredients}
            factor={1}
            system={measurementSystem}
            ticked={ticked}
            onToggle={toggle}
            large
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
