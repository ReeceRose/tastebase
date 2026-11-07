import type {
  RecipeIngredient,
  RecipeInstruction,
  RecipeWithRelations,
} from "@/lib/types/recipe-types";

type JsonLdValue =
  | string
  | number
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

type JsonLdObject = { [key: string]: JsonLdValue };

function withoutEmpty(node: JsonLdObject): JsonLdObject {
  return Object.fromEntries(
    Object.entries(node).filter(
      ([, value]) =>
        value !== null && !(Array.isArray(value) && value.length === 0),
    ),
  );
}

function isoDuration(minutes: number | null): string | null {
  return minutes ? `PT${minutes}M` : null;
}

export function ingredientLine(ingredient: RecipeIngredient): string {
  const main = [ingredient.amount, ingredient.unit, ingredient.name]
    .filter(Boolean)
    .join(" ");
  return [main, ingredient.notes, ingredient.isOptional ? "optional" : null]
    .filter(Boolean)
    .join(", ");
}

function howToStep(instruction: RecipeInstruction): JsonLdObject {
  return { "@type": "HowToStep", text: instruction.instruction };
}

function instructionNodes(instructions: RecipeInstruction[]): JsonLdObject[] {
  const nodes: JsonLdObject[] = [];
  let sectionName: string | null = null;
  let sectionSteps: JsonLdObject[] = [];

  for (const instruction of instructions) {
    if (!instruction.groupName) {
      sectionName = null;
      nodes.push(howToStep(instruction));
      continue;
    }
    if (sectionName !== instruction.groupName) {
      sectionName = instruction.groupName;
      sectionSteps = [];
      nodes.push({
        "@type": "HowToSection",
        name: sectionName,
        itemListElement: sectionSteps,
      });
    }
    sectionSteps.push(howToStep(instruction));
  }
  return nodes;
}

function imageUrls(recipe: RecipeWithRelations, origin: string): string[] {
  const heroFirst = [
    ...recipe.images.filter((image) => image.isHero),
    ...recipe.images.filter((image) => !image.isHero),
  ];
  return heroFirst.map(
    (image) => `${origin}/api/recipes/images/${image.filename}`,
  );
}

export function buildRecipeJsonLd(
  recipe: RecipeWithRelations,
  origin: string,
): JsonLdObject {
  const totalMinutes =
    (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);

  return withoutEmpty({
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    url: `${origin}/recipes/${recipe.slug}`,
    isBasedOn: recipe.sourceUrl,
    author: {
      "@type": recipe.sourceName ? "Organization" : "Person",
      name: recipe.sourceName ?? recipe.author.name,
    },
    image: imageUrls(recipe, origin),
    recipeYield: recipe.servings,
    prepTime: isoDuration(recipe.prepTimeMinutes),
    cookTime: isoDuration(recipe.cookTimeMinutes),
    totalTime: isoDuration(totalMinutes),
    recipeCuisine: recipe.cuisine,
    difficulty: recipe.difficulty,
    keywords: recipe.tags.map((tag) => tag.name),
    recipeIngredient: recipe.ingredients.map(ingredientLine),
    recipeInstructions: instructionNodes(recipe.instructions),
    datePublished: recipe.createdAt.toISOString(),
    dateModified: recipe.updatedAt.toISOString(),
  });
}

// Recipe text is user-written, so "</script>" in a title must not end the tag.
export function serializeJsonLd(node: JsonLdObject): string {
  return JSON.stringify(node).replace(/</g, "\\u003c");
}

export function requestOrigin(requestHeaders: Headers): string {
  const firstValue = (name: string) =>
    requestHeaders.get(name)?.split(",")[0]?.trim();
  const host = firstValue("x-forwarded-host") ?? firstValue("host");
  const protocol = firstValue("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}
