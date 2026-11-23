"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  RefreshFieldList,
  RefreshLineList,
} from "@/components/lists/recipe-refresh-changes";
import { RecipeRefreshSkeleton } from "@/components/skeletons/recipe-refresh-skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchRecipeSourceUpdateAction } from "@/lib/server-actions/recipe-import-actions";
import { ButtonVariant } from "@/lib/types";
import {
  type RecipeRefreshPlan,
  RefreshChangeKind,
  RefreshSection,
} from "@/lib/types/recipe-refresh-types";
import type { RecipeEditorValues } from "@/lib/types/recipe-types";
import {
  applyRefreshPlan,
  buildRefreshPlan,
  changedSections,
} from "@/lib/utils/recipe-refresh";

interface RecipeRefreshDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceUrl: string;
  getValues: () => RecipeEditorValues;
  onApply: (values: RecipeEditorValues) => void;
}

interface LoadedRefresh {
  plan: RecipeRefreshPlan;
  warnings: string[];
}

const SECTION_TITLES: Record<RefreshSection, string> = {
  [RefreshSection.DETAILS]: "Details",
  [RefreshSection.INGREDIENTS]: "Ingredients",
  [RefreshSection.METHOD]: "Method",
  [RefreshSection.NUTRITION]: "Nutrition",
};

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "the source";
  }
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

// "9 new values" when the source only fills in blanks, otherwise a count of
// changes.
function changeSummary(plan: RecipeRefreshPlan, section: RefreshSection) {
  if (
    section === RefreshSection.DETAILS ||
    section === RefreshSection.NUTRITION
  ) {
    const changes =
      section === RefreshSection.DETAILS ? plan.details : plan.nutrition;
    return changes.every((change) => change.before === null)
      ? plural(changes.length, "new value", "new values")
      : plural(changes.length, "change", "changes");
  }
  const changes =
    section === RefreshSection.INGREDIENTS ? plan.ingredients : plan.method;
  if (changes.every((change) => change.kind === RefreshChangeKind.ADDED)) {
    return section === RefreshSection.INGREDIENTS
      ? plural(changes.length, "new ingredient", "new ingredients")
      : plural(changes.length, "new step", "new steps");
  }
  return plural(changes.length, "change", "changes");
}

function SectionChanges({
  plan,
  section,
}: {
  plan: RecipeRefreshPlan;
  section: RefreshSection;
}) {
  if (section === RefreshSection.DETAILS) {
    return <RefreshFieldList changes={plan.details} />;
  }
  if (section === RefreshSection.NUTRITION) {
    return <RefreshFieldList changes={plan.nutrition} />;
  }
  if (section === RefreshSection.INGREDIENTS) {
    return <RefreshLineList changes={plan.ingredients} />;
  }
  return (
    <div className="space-y-3">
      <RefreshLineList changes={plan.method} />
      {plan.detachedMedia > 0 && (
        <p className="rounded-control bg-accent px-3 py-2 text-sm text-accent-foreground">
          {plan.detachedMedia === 1
            ? "1 photo or video is on a step that's gone. It stays on the recipe, untagged."
            : `${plan.detachedMedia} photos or videos are on steps that are gone. They stay on the recipe, untagged.`}
        </p>
      )}
    </div>
  );
}

export function RecipeRefreshDialog({
  open,
  onOpenChange,
  sourceUrl,
  getValues,
  onApply,
}: RecipeRefreshDialogProps) {
  const baseId = useId();
  const [loaded, setLoaded] = useState<LoadedRefresh | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Set<RefreshSection>>(() => new Set());
  const applyRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    let current = true;
    setLoaded(null);
    setError(null);
    fetchRecipeSourceUpdateAction(sourceUrl)
      .catch(() => ({
        success: false as const,
        error: "Couldn't read the recipe's page.",
      }))
      .then((result) => {
        if (!current) return;
        if (!result.success) {
          setError(result.error);
          return;
        }
        const plan = buildRefreshPlan(getValues(), result.data);
        setLoaded({ plan, warnings: result.data.warnings });
        setChosen(new Set(changedSections(plan)));
      });
    return () => {
      current = false;
    };
  }, [open, sourceUrl, getValues]);

  const sections = loaded ? changedSections(loaded.plan) : [];
  const hasChanges = sections.length > 0;

  // The dialog opens while the page is still loading, when Cancel is the only
  // button that can take focus; move it to the main action once it can.
  useEffect(() => {
    if (hasChanges) applyRef.current?.focus();
  }, [hasChanges]);
  const toggle = (section: RefreshSection, checked: boolean) => {
    setChosen((previous) => {
      const next = new Set(previous);
      if (checked) next.add(section);
      else next.delete(section);
      return next;
    });
  };

  const apply = () => {
    if (!loaded) return;
    onApply(applyRefreshPlan(getValues(), loaded.plan, [...chosen]));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update from {hostOf(sourceUrl)}</DialogTitle>
          <DialogDescription>
            Choose what to bring over. Photos, videos, step tags and notes stay,
            and nothing is saved until you save the recipe.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-6 min-h-0 flex-1 overflow-y-auto px-6">
          {!loaded && !error && <RecipeRefreshSkeleton />}
          {error && <p className="text-destructive">{error}</p>}
          {loaded && sections.length === 0 && (
            <p>This recipe already matches its page.</p>
          )}
          {loaded && loaded.warnings.length > 0 && sections.length > 0 && (
            <p className="mb-4 rounded-control bg-accent px-3 py-2 text-sm text-accent-foreground">
              {loaded.warnings.join(" ")}
            </p>
          )}
          <div className="space-y-6">
            {loaded &&
              sections.map((section) => {
                const id = `${baseId}-${section}`;
                return (
                  <section key={section} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={id}
                        checked={chosen.has(section)}
                        onCheckedChange={(checked) =>
                          toggle(section, checked === true)
                        }
                      />
                      <label htmlFor={id} className="text-heading">
                        {SECTION_TITLES[section]}
                      </label>
                      <span className="text-meta text-muted-foreground">
                        {changeSummary(loaded.plan, section)}
                      </span>
                    </div>
                    <div className="pl-8">
                      <SectionChanges plan={loaded.plan} section={section} />
                    </div>
                  </section>
                );
              })}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant={ButtonVariant.GHOST}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            ref={applyRef}
            type="button"
            onClick={apply}
            disabled={!loaded || chosen.size === 0}
          >
            Bring changes in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
