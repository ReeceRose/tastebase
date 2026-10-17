import { Plus } from "lucide-react";
import Link from "next/link";
import { HomeFeature } from "@/components/cards/home-feature";
import { HouseActivity } from "@/components/lists/house-activity";
import { RecipeRowList } from "@/components/lists/recipe-row-list";
import { RecipeTileGrid } from "@/components/lists/recipe-tile-grid";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getFeaturedRecipe,
  getForgottenRecipes,
  getHouseActivity,
  getLatestFromHouse,
  getRecentlyOpened,
} from "@/lib/server-actions/home-actions";
import { ButtonVariant } from "@/lib/types";

interface HomeSectionProps {
  currentUserId: string;
}

export async function HomeFeatureSection({ currentUserId }: HomeSectionProps) {
  const recipe = await getFeaturedRecipe();

  if (!recipe) {
    return (
      <EmptyState
        title="Your collection is empty"
        description="Paste a link to a recipe you love, snap a cookbook page, or type one in. Everyone in your house will be able to see it."
        action={
          <Button variant={ButtonVariant.ACCENT} size="lg" asChild>
            <Link href="/recipes/new">
              <Plus className="size-5" strokeWidth={2.5} />
              Add your first recipe
            </Link>
          </Button>
        }
      />
    );
  }

  return <HomeFeature recipe={recipe} currentUserId={currentUserId} />;
}

export async function HouseRecipesSection({ currentUserId }: HomeSectionProps) {
  const recipes = await getLatestFromHouse(8);
  if (recipes.length === 0) return null;

  const fromOthers = recipes.some(
    (recipe) => recipe.author.id !== currentUserId,
  );

  return (
    <section aria-labelledby="house-recipes-title" className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="house-recipes-title" className="text-heading">
          {fromOthers ? "New in the house" : "Latest in your collection"}
        </h2>
        <Link
          href="/recipes"
          className="text-meta underline decoration-2 underline-offset-4 outline-none hover:decoration-accent focus-visible:decoration-accent"
        >
          See all recipes
        </Link>
      </div>
      <RecipeTileGrid recipes={recipes} currentUserId={currentUserId} />
    </section>
  );
}

export async function RecentlyOpenedSection({
  currentUserId,
}: HomeSectionProps) {
  const recipes = await getRecentlyOpened(6);

  return (
    <section
      aria-labelledby="recently-opened-title"
      className="rounded-tile bg-card p-6"
    >
      <h2 id="recently-opened-title" className="mb-3 text-heading">
        Pick up where you left off
      </h2>
      {recipes.length > 0 ? (
        <RecipeRowList
          recipes={recipes}
          currentUserId={currentUserId}
          showLastViewed
        />
      ) : (
        <p className="text-muted-foreground">
          Recipes you open will show up here so you can get back to them
          quickly.
        </p>
      )}
    </section>
  );
}

export async function HouseActivitySection() {
  const items = await getHouseActivity(6);

  return (
    <section
      aria-labelledby="house-activity-title"
      className="rounded-tile bg-card p-6"
    >
      <h2 id="house-activity-title" className="mb-4 text-heading">
        Around the house
      </h2>
      <HouseActivity items={items} />
    </section>
  );
}

export async function ForgottenRecipesSection({
  currentUserId,
}: HomeSectionProps) {
  const recipes = await getForgottenRecipes(5);
  if (recipes.length === 0) return null;

  return (
    <section
      aria-labelledby="forgotten-title"
      className="rounded-tile bg-card p-6"
    >
      <h2 id="forgotten-title" className="mb-3 text-heading">
        Not made in a while
      </h2>
      <RecipeRowList
        recipes={recipes}
        currentUserId={currentUserId}
        showElapsed
      />
    </section>
  );
}
