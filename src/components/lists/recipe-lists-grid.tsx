import { ListTile } from "@/components/cards/list-tile";
import {
  getFavouritesTile,
  getRecipeLists,
} from "@/lib/server-actions/recipe-list-actions";

export async function RecipeListsGrid() {
  const [favourites, lists] = await Promise.all([
    getFavouritesTile(),
    getRecipeLists(),
  ]);

  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
        {[favourites, ...lists].map((list) => (
          <li key={list.id} className="grid">
            <ListTile list={list} />
          </li>
        ))}
      </ul>
      {lists.length === 0 && (
        <p className="text-muted-foreground">
          Make a list for anything: want to cook, weeknight dinners, hosting,
          Christmas. Then add recipes from the Save button on any recipe.
        </p>
      )}
    </div>
  );
}
