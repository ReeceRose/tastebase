import Link from "next/link";
import { RecipeRowList } from "@/components/lists/recipe-row-list";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getRecentlyOpened } from "@/lib/server-actions/home-actions";

interface RecentlyOpenedListProps {
  currentUserId: string;
}

export async function RecentlyOpenedList({
  currentUserId,
}: RecentlyOpenedListProps) {
  const recipes = await getRecentlyOpened(50);

  if (recipes.length === 0) {
    return (
      <EmptyState
        title="Nothing opened yet"
        description="Recipes you open will show up here, newest first, so you can get back to them quickly."
        action={
          <Button asChild>
            <Link href="/recipes">Browse recipes</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="rounded-tile bg-card p-3 sm:p-4">
      <RecipeRowList
        recipes={recipes}
        currentUserId={currentUserId}
        showLastViewed
      />
    </div>
  );
}
