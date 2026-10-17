import { ChefHat, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { RecipeActionsMenu } from "@/components/modals/recipe-actions-menu";
import { RecipeSaveMenu } from "@/components/modals/recipe-save-menu";
import { Button } from "@/components/ui/button";
import { CircleMotif } from "@/components/ui/circle-motif";
import { MemberAvatar } from "@/components/ui/member-avatar";
import {
  ButtonVariant,
  RecipeDifficulty,
  type RecipeSwatch,
} from "@/lib/types";
import type {
  RecipeCookSummary,
  RecipeListOption,
  RecipeWithRelations,
} from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";
import { isDarkSwatch, swatchClasses } from "@/lib/utils/swatches";
import {
  formatRelativeDay,
  formatTotalTime,
} from "@/lib/utils/time-formatting";

interface RecipeHeroProps {
  recipe: RecipeWithRelations;
  swatch: RecipeSwatch;
  currentUserId: string;
  isFavourite: boolean;
  lists: RecipeListOption[];
  averageRating: number | null;
  cooks: RecipeCookSummary;
}

const DIFFICULTY_LABELS: Record<RecipeDifficulty, string> = {
  [RecipeDifficulty.EASY]: "Easy",
  [RecipeDifficulty.MEDIUM]: "Medium",
  [RecipeDifficulty.HARD]: "Takes effort",
};

function cookLine(
  cooks: RecipeCookSummary,
  currentUserId: string,
): string | null {
  if (cooks.count === 0 || !cooks.lastCookedAt || !cooks.lastCookedBy) {
    return null;
  }
  const times = cooks.count === 1 ? "once" : `${cooks.count} times`;
  const who =
    cooks.lastCookedBy.id === currentUserId ? "you" : cooks.lastCookedBy.name;
  return `Cooked ${times}, last by ${who} ${formatRelativeDay(cooks.lastCookedAt).toLowerCase()}`;
}

export function RecipeHero({
  recipe,
  swatch,
  currentUserId,
  isFavourite,
  lists,
  averageRating,
  cooks,
}: RecipeHeroProps) {
  const classes = swatchClasses(swatch);
  const dark = isDarkSwatch(swatch);
  const own = recipe.author.id === currentUserId;
  const hero = recipe.images.find((image) => image.isHero) ?? recipe.images[0];
  const byline = own
    ? recipe.isPublic
      ? "Your recipe, shared with the house"
      : "Your recipe, only visible to you"
    : `${recipe.author.name}'s recipe`;

  const facts = [
    { label: "Prep", value: formatTotalTime(recipe.prepTimeMinutes) },
    { label: "Cook", value: formatTotalTime(recipe.cookTimeMinutes) },
    {
      label: "Serves",
      value: recipe.servings ? String(recipe.servings) : null,
    },
    {
      label: "Difficulty",
      value: recipe.difficulty ? DIFFICULTY_LABELS[recipe.difficulty] : null,
    },
    {
      label: "Rating",
      value: averageRating ? `${averageRating.toFixed(1)} ★` : null,
    },
  ].filter((fact): fact is { label: string; value: string } =>
    Boolean(fact.value),
  );
  const cooked = cookLine(cooks, currentUserId);

  return (
    <section
      aria-labelledby="recipe-title"
      className={cn(
        "relative overflow-hidden rounded-hero",
        classes.bg,
        classes.fg,
      )}
    >
      {hero && (
        <div className="relative aspect-[16/9] w-full lg:hidden">
          <Image
            src={`/api/recipes/images/${hero.filename}`}
            alt={hero.altText || ""}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_300px] lg:p-10">
        <div className="relative z-10 min-w-0">
          <p className="flex items-center gap-2.5 text-meta">
            <MemberAvatar
              userId={recipe.author.id}
              name={recipe.author.name}
              decorative
              className="bg-white/85 text-ink-fixed"
            />
            {byline}
          </p>
          <h1
            id="recipe-title"
            className="mt-4 max-w-[14ch] wrap-break-word hyphens-auto text-[36px] min-[380px]:text-[44px] leading-[0.92] font-extrabold tracking-[-0.04em] sm:text-[56px] lg:text-hero"
          >
            {recipe.title}
          </h1>
          {recipe.description && (
            <p className="mt-4 max-w-[56ch] text-lead opacity-90">
              {recipe.description}
            </p>
          )}

          {facts.length > 0 && (
            <dl className="mt-6 flex flex-wrap gap-2">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className={cn(
                    "min-w-24 rounded-2xl px-4 py-2.5",
                    dark ? "bg-white/15" : "bg-black/10",
                  )}
                >
                  <dt className="text-caption opacity-80">{fact.label}</dt>
                  <dd className="text-xl leading-tight font-extrabold tracking-[-0.02em] tabular">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {cooked && <p className="mt-3 text-meta opacity-90">{cooked}</p>}

          <div className="mt-7 flex flex-wrap items-center gap-2 sm:gap-2.5">
            <Button size="lg" asChild>
              <Link href={`/recipes/${recipe.slug}/cook`}>
                <ChefHat className="size-5" />
                Start cooking
              </Link>
            </Button>
            <RecipeSaveMenu
              recipeId={recipe.id}
              initialIsFavourite={isFavourite}
              initialLists={lists}
            />
            {own && (
              <Button variant={ButtonVariant.SECONDARY} size="lg" asChild>
                <Link href={`/recipes/${recipe.slug}/edit`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </Button>
            )}
            <RecipeActionsMenu
              recipeId={recipe.id}
              title={recipe.title}
              canDelete={own}
              cooks={cooks}
              currentUserId={currentUserId}
            />
          </div>
        </div>

        <div aria-hidden className="relative hidden lg:block">
          {hero ? (
            <div className="absolute -top-20 -right-20 size-[400px] overflow-hidden rounded-full ring-8 ring-white/25">
              <Image
                src={`/api/recipes/images/${hero.filename}`}
                alt=""
                fill
                priority
                sizes="400px"
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <>
              <CircleMotif
                className={cn("-top-24 -right-24 size-[380px]", classes.deep)}
              />
              <CircleMotif className="top-36 right-48 size-14 bg-white/30" />
              <CircleMotif className="top-10 right-28 size-10 bg-white/30" />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
