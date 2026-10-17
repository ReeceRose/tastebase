import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CircleMotif } from "@/components/ui/circle-motif";
import { MemberAvatar } from "@/components/ui/member-avatar";
import { RecipeDifficulty, type RecipeSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { isDarkSwatch, swatchClasses } from "@/lib/utils/swatches";
import {
  formatRelativeDay,
  formatTotalTime,
} from "@/lib/utils/time-formatting";

interface HomeFeatureProps {
  recipe: RecipeSummary;
  currentUserId: string;
}

const DIFFICULTY_LABELS: Record<RecipeDifficulty, string> = {
  [RecipeDifficulty.EASY]: "Easy",
  [RecipeDifficulty.MEDIUM]: "Medium",
  [RecipeDifficulty.HARD]: "Takes effort",
};

export function HomeFeature({ recipe, currentUserId }: HomeFeatureProps) {
  const classes = swatchClasses(recipe.swatch);
  const dark = isDarkSwatch(recipe.swatch);
  const own = recipe.author.id === currentUserId;
  const byline = own
    ? `You added this ${formatRelativeDay(recipe.createdAt).toLowerCase()}`
    : `${recipe.author.name} added this ${formatRelativeDay(recipe.createdAt).toLowerCase()}`;
  const facts = [
    formatTotalTime(recipe.totalMinutes),
    recipe.cuisine,
    recipe.difficulty ? DIFFICULTY_LABELS[recipe.difficulty] : null,
  ].filter((fact): fact is string => Boolean(fact));

  return (
    <section
      aria-labelledby="home-feature-title"
      className={cn(
        "relative grid overflow-hidden rounded-hero p-6 sm:p-8 lg:grid-cols-[1fr_300px] lg:gap-6 lg:p-9",
        classes.bg,
        classes.fg,
      )}
    >
      <div className="relative z-10">
        <p className="flex items-center gap-2.5 text-meta">
          <MemberAvatar
            userId={recipe.author.id}
            name={recipe.author.name}
            decorative
            className="ring-2 ring-white/70"
          />
          {byline}
        </p>
        <h2
          id="home-feature-title"
          className="mt-4 max-w-[12ch] text-[40px] leading-[0.95] font-extrabold tracking-[-0.035em] sm:text-display lg:text-[64px]"
        >
          {recipe.title}
        </h2>
        {recipe.description && (
          <p className="mt-4 line-clamp-2 max-w-[52ch] text-lead opacity-90">
            {recipe.description}
          </p>
        )}
        {facts.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {facts.map((fact) => (
              <li
                key={fact}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-meta",
                  dark ? "bg-white/15" : "bg-black/10",
                )}
              >
                {fact}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button size="lg" asChild>
            <Link href={`/recipes/${recipe.slug}`}>Open recipe</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/recipes">Browse all recipes</Link>
          </Button>
        </div>
      </div>

      <div aria-hidden className="relative hidden lg:block">
        {recipe.heroImage ? (
          <div className="absolute -top-16 -right-16 size-[340px] overflow-hidden rounded-full ring-8 ring-white/25">
            <Image
              src={`/api/recipes/images/${recipe.heroImage.filename}`}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="340px"
              unoptimized
            />
          </div>
        ) : (
          <>
            <CircleMotif
              className={cn("-top-20 -right-20 size-[340px]", classes.deep)}
            />
            <CircleMotif className="top-24 right-44 size-14 bg-white/30" />
            <CircleMotif className="top-6 right-24 size-10 bg-white/30" />
          </>
        )}
      </div>
    </section>
  );
}
