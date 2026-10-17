import Link from "next/link";
import { TagTile } from "@/components/cards/tag-tile";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getTagTiles } from "@/lib/server-actions/recipe-tags-actions";
import type { TagTileData } from "@/lib/types/recipe-types";

const UNSORTED = "Other tags";

function groupByCategory(tags: TagTileData[]): [string, TagTileData[]][] {
  const groups = new Map<string, TagTileData[]>();
  for (const tag of tags) {
    const category = tag.category?.trim() || UNSORTED;
    groups.set(category, [...(groups.get(category) ?? []), tag]);
  }
  return [...groups.entries()].sort(([a], [b]) =>
    a === UNSORTED ? 1 : b === UNSORTED ? -1 : a.localeCompare(b),
  );
}

interface TagGridProps {
  tags: TagTileData[];
}

function TagGrid({ tags }: TagGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
      {tags.map((tag) => (
        <li key={tag.id} className="grid">
          <TagTile tag={tag} />
        </li>
      ))}
    </ul>
  );
}

export async function RecipeTagsList() {
  const tags = await getTagTiles();

  if (tags.length === 0) {
    return (
      <EmptyState
        title="No tags yet"
        description="Add tags like weeknight or vegetarian when you save a recipe, and they'll collect here."
        action={
          <Button asChild>
            <Link href="/recipes">Browse recipes</Link>
          </Button>
        }
      />
    );
  }

  const groups = groupByCategory(tags);
  if (groups.length === 1) {
    return <TagGrid tags={tags} />;
  }

  return (
    <div className="space-y-8">
      {groups.map(([category, groupTags]) => (
        <section key={category} className="space-y-3">
          <h2 className="text-heading capitalize">{category}</h2>
          <TagGrid tags={groupTags} />
        </section>
      ))}
    </div>
  );
}
