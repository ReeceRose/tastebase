import { getDashboardStats } from "@/lib/server-actions";

async function DashboardStats() {
  const statsResult = await getDashboardStats();
  const stats = statsResult.success ? statsResult.data : null;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8">
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold text-primary">Total Recipes</h3>
        <p className="text-2xl font-bold mt-2">{stats?.totalRecipes || 0}</p>
        <p className="text-sm text-muted-foreground">
          {stats?.totalRecipes === 0
            ? "Ready to add your first recipe?"
            : "Recipes in your collection"}
        </p>
      </div>

      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold text-primary">Favorites</h3>
        <p className="text-2xl font-bold mt-2">{stats?.favoriteRecipes || 0}</p>
        <p className="text-sm text-muted-foreground">
          {stats?.favoriteRecipes === 0
            ? "Star your best recipes"
            : "Favorited recipes"}
        </p>
      </div>

      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold text-primary">Categories</h3>
        <p className="text-2xl font-bold mt-2">
          {stats?.uniqueCategories || 0}
        </p>
        <p className="text-sm text-muted-foreground">
          {stats?.uniqueCategories === 0 ? "Organize with tags" : "Unique tags"}
        </p>
      </div>

      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold text-primary">Recent</h3>
        <p className="text-2xl font-bold mt-2">{stats?.recentRecipes || 0}</p>
        <p className="text-sm text-muted-foreground">
          {stats?.recentRecipes === 0
            ? "Recently viewed recipes"
            : "Added this month"}
        </p>
      </div>
    </div>
  );
}

export { DashboardStats };
