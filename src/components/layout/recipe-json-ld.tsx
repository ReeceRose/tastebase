import type { RecipeWithRelations } from "@/lib/types/recipe-types";
import { buildRecipeJsonLd, serializeJsonLd } from "@/lib/utils/recipe-json-ld";

interface RecipeJsonLdProps {
  recipe: RecipeWithRelations;
  origin: string;
}

export function RecipeJsonLd({ recipe, origin }: RecipeJsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(buildRecipeJsonLd(recipe, origin)),
      }}
    />
  );
}
