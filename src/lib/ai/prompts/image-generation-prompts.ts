import type { RecipeIngredient, RecipeInstruction } from "@/lib/types";

export interface ImageGenerationPromptData {
  title: string;
  description?: string;
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  cuisineType?: string;
  tags?: string[];
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  notes?: string;
}

export function buildRecipeImagePrompt(
  data: ImageGenerationPromptData,
): string {
  const {
    title,
    description,
    ingredients,
    instructions,
    cuisineType,
    tags,
    servings,
  } = data;

  // Base style directive for professional food photography
  const styleDirective =
    "Professional food photography, clean minimal studio lighting, elegant plating, high-end cookbook style, white or neutral background, shot from above at 45-degree angle";

  // Build detailed description
  const parts: string[] = [`A beautifully plated ${title}`];

  // Add general cooking quality guidance
  parts.push(
    "showing proper cooking technique with ingredients well-integrated and at their optimal texture and appearance",
  );

  // Add description context
  if (description) {
    parts.push(`- ${description.slice(0, 200)}`);
  }

  // Add ingredient highlights
  if (ingredients.length > 0) {
    const keyIngredients = ingredients
      .slice(0, 5) // Top 5 ingredients
      .map((ing) => ing.name)
      .join(", ");
    parts.push(`featuring ${keyIngredients}`);
  }

  // Add cooking technique context
  if (instructions.length > 0) {
    const cookingMethods = extractCookingMethods(instructions);
    if (cookingMethods.length > 0) {
      parts.push(`prepared by ${cookingMethods.join(" and ")}`);
    }
  }

  // Add cuisine and serving context
  if (cuisineType) {
    parts.push(`in ${cuisineType} style`);
  }

  if (servings) {
    const servingStyle =
      servings === 1
        ? "individual portion"
        : servings <= 4
          ? "family-style presentation"
          : "large serving platter";
    parts.push(`presented as ${servingStyle}`);
  }

  // Add dietary context
  if (tags) {
    const dietaryTags = tags.filter((tag) =>
      [
        "vegetarian",
        "vegan",
        "gluten-free",
        "dairy-free",
        "keto",
        "paleo",
      ].some((diet) => tag.toLowerCase().includes(diet)),
    );
    if (dietaryTags.length > 0) {
      parts.push(`(${dietaryTags.join(", ")})`);
    }
  }

  // Add general quality and technique guidance
  const qualityGuidance =
    "The dish should look professionally prepared with proper cooking techniques applied - sauces should be smooth and well-emulsified with eggs fully incorporated into creamy sauces (never raw or uncooked eggs visible on top), proteins properly cooked, vegetables at optimal texture, and all components harmoniously combined rather than appearing raw or undercooked";

  const prompt =
    parts.join(" ") +
    `. ${qualityGuidance}. ${styleDirective}. Highly detailed, appetizing, and visually stunning.`;

  return prompt;
}

function extractCookingMethods(instructions: RecipeInstruction[]): string[] {
  const methods = new Set<string>();
  const methodKeywords = {
    baking: ["bake", "baked", "oven"],
    grilling: ["grill", "grilled", "barbecue"],
    sautéing: ["sauté", "sautéed", "pan-fry"],
    roasting: ["roast", "roasted"],
    braising: ["braise", "braised"],
    steaming: ["steam", "steamed"],
    frying: ["fry", "fried", "deep-fry"],
    simmering: ["simmer", "simmered"],
    boiling: ["boil", "boiled"],
  };

  const fullText = instructions
    .map((inst) => inst.instruction.toLowerCase())
    .join(" ");

  for (const [method, keywords] of Object.entries(methodKeywords)) {
    if (keywords.some((keyword) => fullText.includes(keyword))) {
      methods.add(method);
    }
  }

  return Array.from(methods).slice(0, 2); // Limit to 2 methods
}
